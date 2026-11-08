import { type QueryClient, useQueryClient } from "@tanstack/react-query"
import { useState, useSyncExternalStore } from "react"

import type {
  AccountController,
  AccountSnapshot,
  GuestImportPlan,
} from "@/features/account/sync-contract"

import {
  AccountApiError,
  type AccountWorkspace,
  importGuestMutationOptions,
  logoutMutationOptions,
  saveWorkspaceMutationOptions,
  sessionQueryOptions,
  workspaceQueryOptions,
} from "@/features/account/queries"
import { ImportPlanChangedError } from "@/features/account/sync-contract"
import {
  ACCOUNT_MARKER_KEY,
  acknowledgeWorkspace,
  hashWorkspace,
  importedGuestHash,
  readStoredSyncState,
  rememberGuestImport,
  type SyncStamp,
} from "@/features/account/sync-storage"
import {
  createEmptyWorkspace,
  type Workspace,
  workspaceSchema,
} from "@/features/focus/schema"
import {
  getFocusSnapshot,
  getPendingGuestWorkspace,
  replaceActiveWorkspace,
  setActiveWorkspace,
  subscribeFocusSnapshot,
  type WorkspaceOwner,
} from "@/features/focus/store"

class LocalSaveChangedError extends Error {
  constructor() {
    super("Local work changed before the write. Review it again")
    this.name = "LocalSaveChangedError"
  }
}

interface PendingSave {
  userId: string
  owner: WorkspaceOwner
  hash: string
  expectedRevision: number
  baseHash: string
  clearsImport: boolean
}

interface PendingImport {
  userId: string
  plan: GuestImportPlan
  response: AccountWorkspace | null
}

const initialState: AccountSnapshot = {
  user: null,
  status: "loading",
  error: null,
  dirty: false,
  revision: null,
  remoteRevision: null,
  guestAvailable: false,
}

function sameWorkspace(left: Workspace, right: Workspace) {
  return left === right || JSON.stringify(left) === JSON.stringify(right)
}

function createAccountController(client: QueryClient) {
  let state = initialState
  let epoch = 0
  let verified = false
  let remote: AccountWorkspace | null = null
  let running: Promise<void> | null = null
  let actionRunning = false
  let actionFinished: Promise<void> | null = null
  let pendingSave: PendingSave | null = null
  let pendingImport: PendingImport | null = null
  const pendingSaves = new Map<string, PendingSave>()
  const pendingImports = new Map<string, PendingImport>()
  let lastWorkspace: Workspace | null = null
  let unsubscribeFocus: (() => void) | undefined
  const listeners = new Set<() => void>()

  function rememberSaveRequest(receipt: PendingSave) {
    pendingSaves.set(receipt.userId, receipt)
    pendingSave = receipt
  }

  function forgetSaveRequest(receipt: PendingSave) {
    if (pendingSaves.get(receipt.userId) === receipt)
      pendingSaves.delete(receipt.userId)

    if (pendingSave === receipt) pendingSave = null
  }

  function rememberImportRequest(receipt: PendingImport) {
    pendingImports.set(receipt.userId, receipt)
    pendingImport = receipt
  }

  function forgetImportRequest(receipt: PendingImport) {
    if (pendingImports.get(receipt.userId) === receipt)
      pendingImports.delete(receipt.userId)

    if (pendingImport === receipt) pendingImport = null
  }

  function publish(change: Partial<AccountSnapshot>) {
    state = { ...state, ...change }

    for (const listener of listeners) listener()
  }

  function current(version: number, userId: string, owner: WorkspaceOwner) {
    return (
      epoch === version &&
      verified &&
      state.user?.id === userId &&
      getFocusSnapshot().owner === owner
    )
  }

  function requireOwner(owner: WorkspaceOwner) {
    const user = state.user
    const focus = getFocusSnapshot()

    if (
      !verified ||
      !user ||
      focus.owner !== owner ||
      owner.identity !== user.id ||
      !focus.hydrated ||
      focus.error !== null
    ) {
      throw new Error("The account workspace is not ready")
    }

    return { user, version: epoch }
  }

  function fail(error: Error) {
    const offline = error instanceof AccountApiError && error.status === 0
    publish({
      status: offline ? "offline" : "error",
      error: error instanceof Error ? error.message : "Account sync failed",
    })
  }

  function clearQueries() {
    client.removeQueries({ queryKey: ["account"] })
    const mutations = client.getMutationCache()

    for (const mutation of mutations.findAll({ mutationKey: ["account"] })) {
      mutations.remove(mutation)
    }
  }

  function assertCurrent(
    version: number,
    userId: string,
    owner: WorkspaceOwner,
  ) {
    if (!current(version, userId, owner)) {
      throw new Error("Account verification changed. Review this action again")
    }

    const focus = getFocusSnapshot()

    if (!focus.hydrated || focus.error !== null) {
      throw new Error("The account workspace is not ready")
    }
  }

  function signalIdentity(userId: string | null) {
    const prefix = `${userId ?? "guest"}:`

    if (!window.localStorage.getItem(ACCOUNT_MARKER_KEY)?.startsWith(prefix)) {
      window.localStorage.setItem(
        ACCOUNT_MARKER_KEY,
        `${prefix}${crypto.randomUUID()}`,
      )
    }
  }

  function uncertain(cause: unknown) {
    return (
      cause instanceof AccountApiError &&
      (cause.status === 0 ||
        cause.status >= 500 ||
        (cause.status >= 200 && cause.status < 300))
    )
  }

  async function updateGuest(
    userId: string,
    version: number,
    owner: WorkspaceOwner,
  ) {
    const guest = await getPendingGuestWorkspace()

    if (!current(version, userId, owner)) return
    const hash = guest ? await hashWorkspace(guest) : null

    if (!current(version, userId, owner)) return
    publish({
      guestAvailable: hash !== null && hash !== importedGuestHash(userId),
    })
  }

  async function load(userId: string) {
    client.removeQueries({ queryKey: workspaceQueryOptions(userId).queryKey })

    return await client.fetchQuery(workspaceQueryOptions(userId))
  }

  async function acknowledge(
    userId: string,
    version: number,
    owner: WorkspaceOwner,
    response: AccountWorkspace,
    hash: string,
    resolution?: { expected: SyncStamp },
  ) {
    assertCurrent(version, userId, owner)
    await acknowledgeWorkspace(
      userId,
      { revision: response.revision, hash },
      () => {
        const focus = getFocusSnapshot()

        return (
          current(version, userId, owner) &&
          focus.hydrated &&
          focus.error === null
        )
      },
      resolution,
    )
    assertCurrent(version, userId, owner)
    publish({ revision: response.revision })
  }

  function conflict(response: AccountWorkspace, message: string | null = null) {
    remote = response
    publish({
      status: "conflict",
      dirty: true,
      remoteRevision: response.revision,
      error: message,
    })
  }

  function settled(response: AccountWorkspace) {
    remote = response

    const dirty = !sameWorkspace(
      response.workspace,
      getFocusSnapshot().workspace,
    )

    publish({
      status: dirty ? "syncing" : "saved",
      dirty,
      error: null,
      remoteRevision: null,
    })
  }

  async function reconcile(
    userId: string,
    version: number,
    owner: WorkspaceOwner,
  ) {
    const response = await load(userId)

    if (!current(version, userId, owner)) return
    const remoteHash = await hashWorkspace(response.workspace)

    while (current(version, userId, owner)) {
      const local = getFocusSnapshot().workspace
      const stored = readStoredSyncState(userId)
      const localHash = await hashWorkspace(local)

      if (!current(version, userId, owner)) return

      if (!sameWorkspace(local, getFocusSnapshot().workspace)) continue
      remote = response
      const receipt = pendingSave

      if (receipt?.userId === userId && receipt.owner === owner) {
        if (
          receipt.hash === remoteHash &&
          response.revision > receipt.expectedRevision
        ) {
          await acknowledge(userId, version, owner, response, remoteHash)

          if (!current(version, userId, owner)) return

          forgetSaveRequest(receipt)

          if (receipt.clearsImport && pendingImport)
            forgetImportRequest(pendingImport)
          settled(response)

          return
        }

        if (
          response.revision === receipt.expectedRevision &&
          remoteHash === receipt.baseHash
        ) {
          publish({
            revision: response.revision,
            status: "syncing",
            dirty: true,
            remoteRevision: null,
            error: null,
          })

          return
        }

        conflict(
          response,
          "The account changed while a save result was uncertain",
        )

        return
      }

      const imported = pendingImport

      if (imported?.userId === userId && imported.plan.owner === owner) {
        if (imported.response === null) {
          publish({
            status: "conflict",
            revision: stored.stamp?.revision ?? imported.plan.expectedRevision,
            remoteRevision: response.revision,
            dirty: localHash !== remoteHash,
            error:
              "The import result is uncertain. Retry the original import or resolve the versions",
          })

          return
        }

        const guestHash = await hashWorkspace(imported.plan.guest)

        if (!current(version, userId, owner)) return
        await rememberGuestImport(userId, guestHash, () =>
          current(version, userId, owner),
        )

        if (!current(version, userId, owner)) return

        forgetImportRequest(imported)
        await updateGuest(userId, version, owner)

        if (!current(version, userId, owner)) return

        if (!sameWorkspace(local, getFocusSnapshot().workspace)) continue

        if (
          localHash !== remoteHash &&
          !sameWorkspace(local, imported.plan.expected)
        ) {
          conflict(response, "Import completed, but local work changed")

          return
        }

        if (localHash !== remoteHash) {
          await replaceActiveWorkspace(
            { expected: local, workspace: response.workspace },
            { owner },
          )

          if (!current(version, userId, owner)) return
        }

        await acknowledge(userId, version, owner, response, remoteHash)

        if (current(version, userId, owner)) settled(response)

        return
      }

      if (localHash === remoteHash) {
        await acknowledge(
          userId,
          version,
          owner,
          response,
          remoteHash,
          stored.stamp ? { expected: stored.stamp } : undefined,
        )

        if (current(version, userId, owner)) settled(response)

        return
      }

      if (
        stored.stamp &&
        (stored.stamp.revision > response.revision ||
          (stored.stamp.revision === response.revision &&
            stored.stamp.hash !== remoteHash))
      ) {
        publish({ revision: stored.stamp.revision })
        conflict(
          response,
          "The stored sync baseline and account revision disagree",
        )

        return
      }

      const unchanged = !stored.invalid && stored.stamp?.hash === localHash

      const fresh =
        !stored.invalid &&
        !stored.stamp &&
        !stored.cacheExists &&
        sameWorkspace(local, createEmptyWorkspace())

      if (unchanged || fresh) {
        await replaceActiveWorkspace(
          { expected: local, workspace: response.workspace },
          { owner },
        )

        if (!current(version, userId, owner)) return
        await acknowledge(userId, version, owner, response, remoteHash)

        if (current(version, userId, owner)) settled(response)

        return
      }

      if (
        !stored.invalid &&
        stored.stamp?.revision === response.revision &&
        stored.stamp.hash === remoteHash
      ) {
        publish({
          revision: response.revision,
          dirty: true,
          status: "syncing",
          error: null,
          remoteRevision: null,
        })

        return
      }

      publish({ revision: stored.stamp?.revision ?? null })
      conflict(response)

      return
    }
  }

  async function writeWorkspace({
    userId,
    version,
    owner,
    workspace,
    expectedLocal,
    expectedRevision,
    base,
    clearsImport,
  }: {
    userId: string
    version: number
    owner: WorkspaceOwner
    workspace: Workspace
    expectedLocal: Workspace
    expectedRevision: number
    base: Workspace
    clearsImport: boolean
  }) {
    const [hash, baseHash] = await Promise.all([
      hashWorkspace(workspace),
      hashWorkspace(base),
    ])

    assertCurrent(version, userId, owner)

    const receipt: PendingSave = {
      userId,
      owner,
      hash,
      baseHash,
      expectedRevision,
      clearsImport,
    }

    let previous: PendingSave | undefined
    let sent = false
    let received = false

    try {
      const response = await client
        .getMutationCache()
        .build(client, saveWorkspaceMutationOptions())
        .execute({
          userId,
          workspace,
          expected_revision: expectedRevision,
          beforeSend() {
            assertCurrent(version, userId, owner)

            if (!sameWorkspace(expectedLocal, getFocusSnapshot().workspace))
              throw new LocalSaveChangedError()
            previous = pendingSaves.get(userId)
            rememberSaveRequest(receipt)
            sent = true
          },
        })

      received = true
      assertCurrent(version, userId, owner)
      const responseHash = await hashWorkspace(response.workspace)
      assertCurrent(version, userId, owner)

      if (hash !== responseHash || response.revision <= expectedRevision)
        throw new AccountApiError(200)
      await acknowledge(userId, version, owner, response, hash)
      assertCurrent(version, userId, owner)
      forgetSaveRequest(receipt)

      if (clearsImport && pendingImport) forgetImportRequest(pendingImport)
      settled(response)

      return response
    } catch (cause) {
      if (
        sent &&
        !received &&
        !uncertain(cause) &&
        !(cause instanceof AccountApiError && cause.status === 409) &&
        pendingSaves.get(userId) === receipt
      ) {
        forgetSaveRequest(receipt)

        if (previous) {
          pendingSaves.set(userId, previous)

          if (current(version, userId, owner)) pendingSave = previous
        }
      }

      throw cause
    }
  }

  async function saveLoop(owner: WorkspaceOwner) {
    const { user, version } = requireOwner(owner)
    publish({ status: "syncing", error: null })
    await reconcile(user.id, version, owner)

    while (
      current(version, user.id, owner) &&
      state.dirty &&
      state.status === "syncing"
    ) {
      const local = workspaceSchema.parse(getFocusSnapshot().workspace)
      const expectedRevision = state.revision
      const baseline = remote

      if (
        expectedRevision === null ||
        !baseline ||
        baseline.revision !== expectedRevision
      ) {
        throw new Error("The account revision is unavailable")
      }

      try {
        await writeWorkspace({
          userId: user.id,
          version,
          owner,
          workspace: local,
          expectedLocal: local,
          expectedRevision,
          base: baseline.workspace,
          clearsImport: pendingSave?.clearsImport ?? false,
        })
      } catch (cause) {
        if (!(cause instanceof LocalSaveChangedError)) throw cause
      }
    }
  }

  async function sync({ owner }: { owner: WorkspaceOwner }) {
    if (getFocusSnapshot().owner !== owner)
      throw new Error("The workspace changed")

    if (!verified) {
      await refresh()
      requireOwner(owner)

      return
    }

    const { user, version } = requireOwner(owner)

    if (actionRunning) return

    if (running) return await running

    const task = (async () => {
      try {
        await saveLoop(owner)
      } catch (error) {
        if (!current(version, user.id, owner)) return

        if (error instanceof AccountApiError && error.status === 409) {
          try {
            await reconcile(user.id, version, owner)

            if (
              current(version, user.id, owner) &&
              state.status === "syncing"
            ) {
              publish({
                status: "error",
                error:
                  "The save baseline was recovered. Retry sync to send remaining changes",
              })
            }
          } catch (cause) {
            if (current(version, user.id, owner))
              fail(
                cause instanceof Error
                  ? cause
                  : new Error("Account sync failed"),
              )
          }
        } else {
          fail(
            error instanceof Error ? error : new Error("Account sync failed"),
          )
        }
      }
    })()

    running = task

    try {
      await task
    } finally {
      if (running === task) running = null

      if (
        current(version, user.id, owner) &&
        state.dirty &&
        state.status === "syncing" &&
        !actionRunning
      )
        void sync({ owner })
    }
  }

  async function refresh() {
    const waiting = [running, actionFinished].filter((task) => task !== null)
    const version = ++epoch
    verified = false
    clearQueries()
    publish({ status: "loading", error: null })

    try {
      await Promise.allSettled(waiting)

      if (version !== epoch) return
      const session = await client.fetchQuery(sessionQueryOptions())

      if (version !== epoch) return
      const next = session.user?.id ?? null

      const switching =
        getFocusSnapshot().identity !== next
          ? setActiveWorkspace({ identity: next })
          : null

      publish({
        user: session.user,
        status: "loading",
        error: null,
        guestAvailable: false,
      })

      if (switching) await switching

      if (version !== epoch) return
      signalIdentity(next)
      const owner = getFocusSnapshot().owner

      const saved = next ? pendingSaves.get(next) : undefined
      pendingSave = saved ? { ...saved, owner } : null

      if (pendingSave) pendingSaves.set(pendingSave.userId, pendingSave)

      const imported = next ? pendingImports.get(next) : undefined
      pendingImport = imported
        ? { ...imported, plan: { ...imported.plan, owner } }
        : null

      if (pendingImport) pendingImports.set(pendingImport.userId, pendingImport)
      verified = true
      remote = null
      publish({
        status: next ? "syncing" : "guest",
        dirty: next ? state.dirty : false,
        revision: null,
        remoteRevision: null,
      })

      if (next) {
        await updateGuest(next, version, owner)

        if (current(version, next, owner)) await sync({ owner })
      }
    } catch (error) {
      if (version === epoch) {
        verified = false
        fail(
          error instanceof Error
            ? error
            : new Error("Account verification failed"),
        )
      }
    }
  }

  async function resolveConflict(
    input: {
      source: "server" | "local"
      expected: Workspace
      expectedRevision: number
    },
    { owner }: { owner: WorkspaceOwner },
  ) {
    const { user, version } = requireOwner(owner)
    const expected = workspaceSchema.parse(input.expected)

    if (
      running ||
      !remote ||
      state.status !== "conflict" ||
      remote.revision !== input.expectedRevision ||
      !sameWorkspace(expected, getFocusSnapshot().workspace)
    ) {
      throw new Error("The conflict changed. Review it again")
    }

    const stamp = readStoredSyncState(user.id).stamp
    const latest = await load(user.id)
    assertCurrent(version, user.id, owner)

    if (!sameWorkspace(expected, getFocusSnapshot().workspace))
      throw new Error("The workspace changed. Review it again")

    if (
      latest.revision !== input.expectedRevision ||
      !sameWorkspace(latest.workspace, remote.workspace)
    ) {
      conflict(latest, "The account version changed. Review it again")
      throw new Error("The account version changed. Review it again")
    }

    if (stamp && stamp.revision > latest.revision) {
      throw new Error(
        "The server revision is older than this device's sync baseline. Export a backup before recovery",
      )
    }

    let chosen = latest

    try {
      if (input.source === "local") {
        await writeWorkspace({
          userId: user.id,
          version,
          owner,
          workspace: expected,
          expectedLocal: expected,
          expectedRevision: input.expectedRevision,
          base: latest.workspace,
          clearsImport: true,
        })
      } else {
        const unresolvedAtRevision =
          pendingSave?.expectedRevision === latest.revision ||
          (pendingImport?.response === null &&
            pendingImport.plan.expectedRevision === latest.revision)

        if (unresolvedAtRevision) {
          chosen = await writeWorkspace({
            userId: user.id,
            version,
            owner,
            workspace: latest.workspace,
            expectedLocal: expected,
            expectedRevision: latest.revision,
            base: latest.workspace,
            clearsImport: true,
          })
        }

        const hash = await hashWorkspace(chosen.workspace)
        assertCurrent(version, user.id, owner)
        await replaceActiveWorkspace(
          { expected, workspace: chosen.workspace },
          { owner },
        )
        assertCurrent(version, user.id, owner)
        await acknowledge(
          user.id,
          version,
          owner,
          chosen,
          hash,
          stamp ? { expected: stamp } : undefined,
        )
        assertCurrent(version, user.id, owner)

        if (pendingSave) forgetSaveRequest(pendingSave)

        if (pendingImport) forgetImportRequest(pendingImport)
        settled(chosen)
      }

      await updateGuest(user.id, version, owner)
      assertCurrent(version, user.id, owner)
    } catch (error) {
      if (current(version, user.id, owner)) {
        if (error instanceof AccountApiError && error.status === 409) {
          try {
            const changed = await load(user.id)
            assertCurrent(version, user.id, owner)
            conflict(
              changed,
              "The account changed before the chosen version was saved",
            )
          } catch (cause) {
            if (current(version, user.id, owner))
              fail(
                cause instanceof Error
                  ? cause
                  : new Error("Account recovery failed"),
              )
          }
        } else if (!sameWorkspace(expected, getFocusSnapshot().workspace)) {
          conflict(chosen, "Local work changed. Review the conflict again")
        } else
          fail(
            error instanceof Error
              ? error
              : new Error("Account recovery failed"),
          )
      }

      throw error
    }
  }

  async function prepareImport({
    owner,
  }: {
    owner: WorkspaceOwner
  }): Promise<GuestImportPlan> {
    const { user, version } = requireOwner(owner)
    const retained = pendingImport

    if (running || actionRunning || pendingSave)
      throw new Error("Recover account sync before importing")

    if (retained?.userId === user.id && retained.plan.owner === owner) {
      if (
        !sameWorkspace(retained.plan.expected, getFocusSnapshot().workspace)
      ) {
        throw new Error(
          "Resolve the account versions before retrying the retained import",
        )
      }

      return retained.plan
    }

    if (state.status !== "saved" || state.revision === null || state.dirty)
      throw new Error("Sync the account before importing")

    const expected = workspaceSchema.parse(getFocusSnapshot().workspace)
    const expectedRevision = state.revision
    const guest = await getPendingGuestWorkspace()
    assertCurrent(version, user.id, owner)

    if (
      !sameWorkspace(expected, getFocusSnapshot().workspace) ||
      state.revision !== expectedRevision ||
      !guest ||
      running ||
      actionRunning
    ) {
      throw new ImportPlanChangedError()
    }

    return { id: crypto.randomUUID(), guest, expected, expectedRevision, owner }
  }

  async function performImport(
    plan: GuestImportPlan,
    { owner }: { owner: WorkspaceOwner },
  ) {
    const { user, version } = requireOwner(owner)
    const expected = workspaceSchema.parse(plan.expected)
    const guest = workspaceSchema.parse(plan.guest)
    const retained = pendingImport

    const retry =
      retained !== null &&
      retained.userId === user.id &&
      retained.plan.id === plan.id &&
      retained.plan.owner === owner

    if (running || pendingSave)
      throw new Error("Recover account sync before importing")

    if (
      plan.owner !== owner ||
      !sameWorkspace(expected, getFocusSnapshot().workspace)
    ) {
      if (retry)
        throw new Error(
          "Resolve the account versions before retrying this import",
        )
      throw new ImportPlanChangedError()
    }

    if (retry) {
      if (
        retained.plan.expectedRevision !== plan.expectedRevision ||
        !sameWorkspace(retained.plan.expected, expected) ||
        !sameWorkspace(retained.plan.guest, guest)
      )
        throw new Error("The retained import payload must not change")
    } else if (
      retained ||
      state.revision !== plan.expectedRevision ||
      state.status !== "saved" ||
      state.dirty
    )
      throw new ImportPlanChangedError()

    const record: PendingImport = retry
      ? retained
      : {
          userId: user.id,
          plan: {
            id: plan.id,
            guest,
            expected,
            expectedRevision: plan.expectedRevision,
            owner,
          },
          response: null,
        }

    publish({ status: "syncing", error: null })

    try {
      if (record.response === null) {
        const response = await client
          .getMutationCache()
          .build(client, importGuestMutationOptions())
          .execute({
            userId: user.id,
            workspace: guest,
            expected_revision: plan.expectedRevision,
            import_id: plan.id,
            beforeSend() {
              assertCurrent(version, user.id, owner)

              if (!sameWorkspace(expected, getFocusSnapshot().workspace)) {
                if (retry)
                  throw new Error(
                    "Resolve the account versions before retrying this import",
                  )
                throw new ImportPlanChangedError()
              }

              rememberImportRequest(record)
            },
          })

        if (response.revision <= plan.expectedRevision)
          throw new AccountApiError(200)
        record.response = response
        assertCurrent(version, user.id, owner)
      }

      await reconcile(user.id, version, owner)
      assertCurrent(version, user.id, owner)

      if (state.status === "conflict")
        throw new Error(
          "Import completed, but local work changed. Resolve the account versions",
        )

      if (pendingImport === record)
        throw new Error("The import still needs recovery")
    } catch (cause) {
      if (!current(version, user.id, owner)) throw cause
      const rejected = record.response === null && !uncertain(cause)

      if (rejected && !retry) forgetImportRequest(record)

      if (
        rejected &&
        !retry &&
        cause instanceof AccountApiError &&
        cause.status === 413
      ) {
        fail(cause)
        throw new ImportPlanChangedError(cause.message)
      }

      if (
        rejected &&
        cause instanceof AccountApiError &&
        cause.status === 409
      ) {
        try {
          const latest = await load(user.id)
          assertCurrent(version, user.id, owner)
          conflict(
            latest,
            "Guest import conflicts with saved data. Review the versions; guest data is unchanged",
          )
        } catch (error) {
          if (current(version, user.id, owner))
            fail(
              error instanceof Error
                ? error
                : new Error("Import recovery failed"),
            )
        }

        if (!retry)
          throw new ImportPlanChangedError(
            "Guest import was rejected. Review the account versions before preparing it again",
          )
      }

      if (current(version, user.id, owner) && state.status !== "conflict")
        fail(cause instanceof Error ? cause : new Error("Guest import failed"))
      throw cause
    }
  }

  async function performLogout({ owner }: { owner: WorkspaceOwner }) {
    const { user, version } = requireOwner(owner)
    await client
      .getMutationCache()
      .build(client, logoutMutationOptions())
      .execute({
        userId: user.id,
        beforeSend() {
          assertCurrent(version, user.id, owner)
        },
      })
    assertCurrent(version, user.id, owner)
    const logoutVersion = ++epoch
    verified = false
    clearQueries()
    const hiding = setActiveWorkspace({ identity: null })
    publish({ ...initialState })
    await hiding

    if (logoutVersion !== epoch)
      throw new Error("Account verification changed during logout")
    signalIdentity(null)
    pendingSave = null
    pendingImport = null
    remote = null
    verified = true
    publish({ ...initialState, status: "guest" })
  }

  function focusChanged() {
    const focus = getFocusSnapshot()

    if (focus.workspace === lastWorkspace) return
    lastWorkspace = focus.workspace

    if (
      state.user &&
      focus.owner.identity === state.user.id &&
      focus.hydrated &&
      !focus.error
    ) {
      const ready = verified && state.status === "saved"
      publish({ dirty: true, status: ready ? "syncing" : state.status })

      if (ready) void sync({ owner: focus.owner })
    }
  }

  function markerChanged(event: StorageEvent) {
    if (event.key === "pomodoro:workspace:guest" && verified && state.user) {
      const user = state.user
      const version = epoch
      const focus = getFocusSnapshot()
      const owner = focus.owner

      if (owner.identity !== user.id || !focus.hydrated || focus.error) return
      void updateGuest(user.id, version, owner).catch((cause: unknown) => {
        const error =
          cause instanceof Error ? cause : new Error("Account request failed")

        if (current(version, user.id, owner))
          publish({
            guestAvailable: false,
            error: error.message,
          })
      })

      return
    }

    if (event.key !== ACCOUNT_MARKER_KEY && event.key !== null) return
    const version = ++epoch
    verified = false
    remote = null
    pendingSave = null
    pendingImport = null
    clearQueries()
    const hiding = setActiveWorkspace({ identity: null })
    publish({ ...initialState })
    void hiding.then(
      () => {
        if (version === epoch) void refresh()
      },
      (cause: unknown) => {
        const error =
          cause instanceof Error ? cause : new Error("Account request failed")

        if (version === epoch) fail(error)
      },
    )
  }

  function refreshOnEvent() {
    void refresh()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)

    if (listeners.size === 1 && typeof window !== "undefined") {
      unsubscribeFocus = subscribeFocusSnapshot(focusChanged)
      window.addEventListener("storage", markerChanged)
      window.addEventListener("focus", refreshOnEvent)
      window.addEventListener("online", refreshOnEvent)
      void refresh()
    }

    return () => {
      listeners.delete(listener)

      if (listeners.size === 0 && typeof window !== "undefined") {
        const version = ++epoch
        verified = false
        unsubscribeFocus?.()
        window.removeEventListener("storage", markerChanged)
        window.removeEventListener("focus", refreshOnEvent)
        window.removeEventListener("online", refreshOnEvent)
        clearQueries()
        pendingSave = null
        pendingImport = null
        const hiding = setActiveWorkspace({ identity: null })
        publish({ ...initialState })
        void hiding.catch((cause: unknown) => {
          const error =
            cause instanceof Error ? cause : new Error("Account request failed")

          if (version === epoch) fail(error)
        })
      }
    }
  }

  async function exclusive(action: () => Promise<void>, owner: WorkspaceOwner) {
    requireOwner(owner)

    if (actionRunning || running)
      throw new Error("An account operation is in progress")
    actionRunning = true

    const task = (async () => {
      try {
        await action()
      } finally {
        actionRunning = false
      }
    })()

    actionFinished = task

    try {
      await task
    } finally {
      if (actionFinished === task) actionFinished = null

      if (
        verified &&
        state.status === "syncing" &&
        getFocusSnapshot().owner === owner
      )
        void sync({ owner })
    }
  }

  async function resolve(
    input: Parameters<AccountController["resolve"]>[0],
    ownership: { owner: WorkspaceOwner },
  ) {
    await exclusive(() => resolveConflict(input, ownership), ownership.owner)
  }

  async function importGuest(
    plan: GuestImportPlan,
    ownership: { owner: WorkspaceOwner },
  ) {
    await exclusive(() => performImport(plan, ownership), ownership.owner)
  }

  async function logout(ownership: { owner: WorkspaceOwner }) {
    await exclusive(() => performLogout(ownership), ownership.owner)
  }

  const controller: AccountController = {
    refresh,
    sync,
    resolve,
    prepareImport,
    importGuest,
    logout,
  }

  return {
    controller,
    subscribe,
    getSnapshot: () => state,
    getServerSnapshot: () => initialState,
  }
}

export function useAccountController() {
  const client = useQueryClient()
  const [account] = useState(() => createAccountController(client))

  const state = useSyncExternalStore(
    account.subscribe,
    account.getSnapshot,
    account.getServerSnapshot,
  )

  return { controller: account.controller, state }
}
