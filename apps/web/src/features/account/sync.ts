import { type QueryClient, useQueryClient } from "@tanstack/react-query"
import { useState, useSyncExternalStore } from "react"

import type {
  AccountController,
  AccountSnapshot,
  GuestImportPlan,
  PendingAccountRequest,
} from "@/features/account/sync-contract"
import type { AccountJournal } from "@/features/account/sync-journal"

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
  AccountJournalError,
  createAccountJournal,
  decodeJournalWorkspace,
  encodeJournalWorkspace,
  readAccountJournal,
  removeAccountJournal,
  setAccountJournalResolution,
  withAccountOperation,
} from "@/features/account/sync-journal"
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
  readOwnedWorkspace,
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

const initialState: AccountSnapshot = {
  user: null,
  status: "loading",
  error: null,
  dirty: false,
  revision: null,
  remoteRevision: null,
  guestAvailable: false,
  pendingOperation: null,
}

function sameWorkspace(left: Workspace, right: Workspace) {
  return left === right || JSON.stringify(left) === JSON.stringify(right)
}

function requestReference(record: AccountJournal): PendingAccountRequest {
  return {
    operationId: record.operationId,
    token: record.token,
    kind: record.original.kind,
    phase: record.resolution ? "resolution" : "original",
  }
}

function sameRequest(
  left: PendingAccountRequest | null,
  right: PendingAccountRequest | null,
) {
  return (
    left === right ||
    (left !== null &&
      right !== null &&
      left.operationId === right.operationId &&
      left.token === right.token &&
      left.kind === right.kind &&
      left.phase === right.phase)
  )
}

function createAccountController(client: QueryClient) {
  let state = initialState
  let epoch = 0
  let verified = false
  let remote: AccountWorkspace | null = null
  let journal: AccountJournal | null = null
  let running: Promise<void> | null = null
  let actionRunning = false
  let logoutRunning: Promise<void> | null = null
  let actionFinished: Promise<unknown> | null = null
  let lastWorkspace: Workspace | null = null
  let unsubscribeFocus: (() => void) | undefined
  const waits = new Set<AbortController>()
  const listeners = new Set<() => void>()

  function publish(change: Partial<AccountSnapshot>) {
    state = { ...state, ...change }

    for (const listener of listeners) listener()
  }

  function current(version: number, userId: string, owner: WorkspaceOwner) {
    return (
      epoch === version &&
      verified &&
      state.user?.id === userId &&
      owner.identity === userId &&
      getFocusSnapshot().owner === owner
    )
  }

  function requireSession(owner: WorkspaceOwner) {
    const user = state.user

    if (!user || !current(epoch, user.id, owner)) {
      throw new Error("Account verification changed. Review this action again")
    }

    return { user, version: epoch }
  }

  function requireLogoutContext(owner: WorkspaceOwner) {
    const user = state.user

    if (
      !user ||
      owner.identity !== user.id ||
      getFocusSnapshot().owner !== owner
    )
      throw new Error("The displayed account changed. Review logout again")

    return user
  }

  function assertLogoutContext(
    version: number,
    userId: string,
    owner: WorkspaceOwner,
  ) {
    const user = requireLogoutContext(owner)

    if (epoch !== version || user.id !== userId)
      throw new Error("The displayed account changed. Review logout again")
  }

  function assertSession(
    version: number,
    userId: string,
    owner: WorkspaceOwner,
  ) {
    if (!current(version, userId, owner)) {
      throw new Error("Account verification changed. Review this action again")
    }
  }

  function assertCurrent(
    version: number,
    userId: string,
    owner: WorkspaceOwner,
  ) {
    assertSession(version, userId, owner)
    const focus = getFocusSnapshot()

    if (!focus.hydrated || focus.error !== null)
      throw new Error("The account workspace is not ready")
  }

  function requireOwner(owner: WorkspaceOwner) {
    const bound = requireSession(owner)
    assertCurrent(bound.version, bound.user.id, owner)

    return bound
  }

  function authoritative(
    version: number,
    userId: string,
    owner: WorkspaceOwner,
  ) {
    assertCurrent(version, userId, owner)

    return readOwnedWorkspace({ owner })
  }

  function assertBaseline(
    version: number,
    userId: string,
    owner: WorkspaceOwner,
    expected: Workspace,
  ) {
    if (!sameWorkspace(expected, authoritative(version, userId, owner)))
      throw new LocalSaveChangedError()
  }

  function fail(error: Error) {
    const offline = error instanceof AccountApiError && error.status === 0
    publish({ status: offline ? "offline" : "error", error: error.message })
  }

  function clearQueries() {
    client.removeQueries({ queryKey: ["account"] })
    const mutations = client.getMutationCache()

    for (const mutation of mutations.findAll({ mutationKey: ["account"] }))
      mutations.remove(mutation)
  }

  function cancelWaits() {
    for (const wait of waits) wait.abort()
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

  function retain(record: AccountJournal | null) {
    journal = record
    publish({ pendingOperation: record ? requestReference(record) : null })
  }

  async function operation<T>(owner: WorkspaceOwner, run: () => Promise<T>) {
    const { user, version } = requireOwner(owner)
    const wait = new AbortController()
    waits.add(wait)

    function isCurrent() {
      const focus = getFocusSnapshot()

      return (
        !wait.signal.aborted &&
        current(version, user.id, owner) &&
        focus.hydrated &&
        focus.error === null
      )
    }

    try {
      return await withAccountOperation({
        accountId: user.id,
        signal: wait.signal,
        isCurrent,
        async run() {
          authoritative(version, user.id, owner)

          const record = await readAccountJournal({
            accountId: user.id,
            isCurrent,
          })

          assertCurrent(version, user.id, owner)
          retain(record)

          return await run()
        },
      })
    } finally {
      waits.delete(wait)
    }
  }

  function storageGuard(
    version: number,
    userId: string,
    owner: WorkspaceOwner,
  ) {
    return function isCurrent() {
      const focus = getFocusSnapshot()

      return (
        current(version, userId, owner) &&
        focus.hydrated &&
        focus.error === null
      )
    }
  }

  async function retire(
    record: AccountJournal,
    version: number,
    owner: WorkspaceOwner,
  ) {
    await removeAccountJournal({
      expected: record,
      isCurrent: storageGuard(version, record.accountId, owner),
    })
    assertCurrent(version, record.accountId, owner)
    retain(null)
  }

  async function updateGuest(
    userId: string,
    version: number,
    owner: WorkspaceOwner,
  ) {
    const guest = await getPendingGuestWorkspace()

    if (!current(version, userId, owner)) return
    const hash = guest ? await hashWorkspace(guest) : null

    if (current(version, userId, owner))
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
      storageGuard(version, userId, owner),
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

  async function finishResolution(
    record: AccountJournal,
    response: AccountWorkspace,
    version: number,
    owner: WorkspaceOwner,
  ) {
    const choice = record.resolution

    if (!choice) throw new AccountJournalError("changed")
    const hash = await hashWorkspace(response.workspace)
    const local = authoritative(version, record.accountId, owner)
    const localHash = await hashWorkspace(local)
    assertBaseline(version, record.accountId, owner, local)

    if (choice.source === "server" && localHash !== hash) {
      if (localHash !== choice.expectedLocalHash) {
        conflict(
          response,
          "Local work changed before account recovery finished. Review both versions again",
        )

        return
      }

      await replaceActiveWorkspace(
        { expected: local, workspace: response.workspace },
        { owner },
      )
      assertCurrent(version, record.accountId, owner)
    }

    const stamp = readStoredSyncState(record.accountId).stamp
    await acknowledge(
      record.accountId,
      version,
      owner,
      response,
      hash,
      stamp ? { expected: stamp } : undefined,
    )
    await retire(record, version, owner)
    settled(response)
  }

  async function finishImport(
    record: AccountJournal,
    response: AccountWorkspace,
    version: number,
    owner: WorkspaceOwner,
  ) {
    const original = record.original

    if (original.kind !== "import" || record.resolution)
      throw new AccountJournalError("changed")
    const remoteHash = await hashWorkspace(response.workspace)
    const local = authoritative(version, record.accountId, owner)
    const localHash = await hashWorkspace(local)
    assertBaseline(version, record.accountId, owner, local)

    if (localHash !== remoteHash && localHash !== original.originalLocalHash) {
      conflict(
        response,
        "The import completed, but local work changed. Review both versions before continuing",
      )

      return
    }

    await rememberGuestImport(
      record.accountId,
      original.guestHash,
      storageGuard(version, record.accountId, owner),
    )
    assertBaseline(version, record.accountId, owner, local)

    if (localHash !== remoteHash) {
      await replaceActiveWorkspace(
        { expected: local, workspace: response.workspace },
        { owner },
      )
      assertCurrent(version, record.accountId, owner)
    }

    const stamp = readStoredSyncState(record.accountId).stamp
    await acknowledge(
      record.accountId,
      version,
      owner,
      response,
      remoteHash,
      stamp ? { expected: stamp } : undefined,
    )
    await retire(record, version, owner)
    settled(response)
    await updateGuest(record.accountId, version, owner)
  }

  async function recoverJournal(
    record: AccountJournal,
    response: AccountWorkspace,
    remoteHash: string,
    version: number,
    owner: WorkspaceOwner,
  ) {
    const choice = record.resolution

    if (choice) {
      if (
        !choice.ambiguousPredecessor &&
        response.revision > choice.expectedRevision &&
        remoteHash === choice.sentHash
      ) {
        await finishResolution(record, response, version, owner)
      } else {
        conflict(
          response,
          "A previous recovery request needs review. Choose the version to retain",
        )
      }

      return
    }

    const original = record.original

    if (original.kind === "import") {
      conflict(
        response,
        "A saved guest import needs review. Retry its original snapshot or resolve the versions",
      )

      return
    }

    if (
      response.revision > original.expectedRevision &&
      remoteHash === original.sentHash
    ) {
      await acknowledge(record.accountId, version, owner, response, remoteHash)
      await retire(record, version, owner)
      settled(response)
    } else {
      conflict(
        response,
        "A previous save has an uncertain result. Review both versions before continuing",
      )
    }
  }

  async function reconcile(
    userId: string,
    version: number,
    owner: WorkspaceOwner,
  ) {
    const response = await load(userId)
    assertCurrent(version, userId, owner)
    const remoteHash = await hashWorkspace(response.workspace)

    if (journal) {
      await recoverJournal(journal, response, remoteHash, version, owner)

      return
    }

    while (current(version, userId, owner)) {
      const local = authoritative(version, userId, owner)
      const stored = readStoredSyncState(userId)
      const localHash = await hashWorkspace(local)
      const latest = authoritative(version, userId, owner)

      if (!sameWorkspace(local, latest)) continue
      remote = response

      if (localHash === remoteHash) {
        await acknowledge(
          userId,
          version,
          owner,
          response,
          remoteHash,
          stored.stamp ? { expected: stored.stamp } : undefined,
        )
        settled(response)

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
        await acknowledge(userId, version, owner, response, remoteHash)
        settled(response)

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

  async function writeWorkspace(input: {
    userId: string
    version: number
    owner: WorkspaceOwner
    workspace: Workspace
    expectedLocal: Workspace
    expectedRevision: number
    record: AccountJournal
    resolving: boolean
  }) {
    const hash = await hashWorkspace(input.workspace)
    assertBaseline(
      input.version,
      input.userId,
      input.owner,
      input.expectedLocal,
    )

    const response = await client
      .getMutationCache()
      .build(client, saveWorkspaceMutationOptions())
      .execute({
        userId: input.userId,
        workspace: input.workspace,
        expected_revision: input.expectedRevision,
        beforeSend() {
          assertBaseline(
            input.version,
            input.userId,
            input.owner,
            input.expectedLocal,
          )
        },
      })

    assertCurrent(input.version, input.userId, input.owner)
    const responseHash = await hashWorkspace(response.workspace)
    assertCurrent(input.version, input.userId, input.owner)

    if (hash !== responseHash || response.revision <= input.expectedRevision)
      throw new AccountApiError(200)

    if (input.resolving) {
      await finishResolution(input.record, response, input.version, input.owner)
    } else {
      await acknowledge(
        input.userId,
        input.version,
        input.owner,
        response,
        hash,
      )
      await retire(input.record, input.version, input.owner)
      settled(response)
    }

    return response
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
      if (journal) throw new AccountJournalError("changed")

      const local = workspaceSchema.parse(
        authoritative(version, user.id, owner),
      )

      const baseline = remote

      if (!baseline || baseline.revision !== state.revision)
        throw new Error("The account revision is unavailable")

      const [sentHash, baseHash] = await Promise.all([
        hashWorkspace(local),
        hashWorkspace(baseline.workspace),
      ])

      try {
        assertBaseline(version, user.id, owner, local)
      } catch (cause) {
        if (cause instanceof LocalSaveChangedError) continue
        throw cause
      }

      const record = await createAccountJournal({
        accountId: user.id,
        original: {
          kind: "save",
          expectedRevision: baseline.revision,
          baseHash,
          sentHash,
        },
        resolution: null,
        isCurrent: storageGuard(version, user.id, owner),
      })

      retain(record)
      await writeWorkspace({
        userId: user.id,
        version,
        owner,
        workspace: local,
        expectedLocal: local,
        expectedRevision: baseline.revision,
        record,
        resolving: false,
      })
    }
  }

  async function sync({ owner }: { owner: WorkspaceOwner }) {
    if (getFocusSnapshot().owner !== owner)
      throw new Error("The workspace changed")

    if (!verified) {
      await refresh()

      return
    }

    const { user, version } = requireOwner(owner)

    if (actionRunning || logoutRunning) return

    if (running) return await running

    const task = operation(owner, () => saveLoop(owner)).catch(
      (cause: unknown) => {
        if (current(version, user.id, owner))
          fail(
            cause instanceof Error ? cause : new Error("Account sync failed"),
          )
      },
    )

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
    const endingSession = logoutRunning

    const version = ++epoch
    verified = false
    cancelWaits()
    running = null
    actionRunning = false
    actionFinished = null
    clearQueries()
    retain(null)
    publish({ status: "loading", error: null })
    let sessionVerified = false

    try {
      if (endingSession) await Promise.allSettled([endingSession])

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
      verified = true
      sessionVerified = true

      if (switching) await switching

      if (version !== epoch) return
      remote = null
      signalIdentity(next)
      const owner = getFocusSnapshot().owner
      publish({
        status: next ? "syncing" : "guest",
        dirty: next ? state.dirty : false,
        revision: null,
        remoteRevision: null,
      })

      if (next) {
        await updateGuest(next, version, owner)
        assertCurrent(version, next, owner)
        await sync({ owner })
      }
    } catch (cause) {
      if (version === epoch) {
        if (!sessionVerified) verified = false
        fail(
          cause instanceof Error
            ? cause
            : new Error("Account verification failed"),
        )
      }
    }
  }

  async function resolveConflict(
    input: Parameters<AccountController["resolve"]>[0],
    { owner }: { owner: WorkspaceOwner },
  ) {
    const { user, version } = requireOwner(owner)
    const expected = workspaceSchema.parse(input.expected)
    const reference = journal ? requestReference(journal) : null

    if (
      state.status !== "conflict" ||
      !remote ||
      remote.revision !== input.expectedRevision ||
      !sameRequest(input.request, reference)
    )
      throw new Error("The conflict changed. Review it again")
    assertBaseline(version, user.id, owner, expected)
    const latest = await load(user.id)
    assertBaseline(version, user.id, owner, expected)

    if (
      latest.revision !== input.expectedRevision ||
      !sameWorkspace(latest.workspace, remote.workspace)
    ) {
      conflict(latest, "The account version changed. Review it again")
      throw new Error("The account version changed. Review it again")
    }

    const stamp = readStoredSyncState(user.id).stamp

    if (stamp && stamp.revision > latest.revision)
      throw new Error(
        "The server revision is older than this device's baseline. Export a backup before recovery",
      )
    const chosen = input.source === "server" ? latest.workspace : expected

    const [sentHash, baseHash, expectedLocalHash] = await Promise.all([
      hashWorkspace(chosen),
      hashWorkspace(latest.workspace),
      hashWorkspace(expected),
    ])

    assertBaseline(version, user.id, owner, expected)
    const previous = journal

    const resolution = {
      attemptId: crypto.randomUUID(),
      source: input.source,
      expectedRevision: latest.revision,
      baseHash,
      sentHash,
      expectedLocalHash,
      ambiguousPredecessor:
        previous !== null &&
        (previous.resolution?.expectedRevision ??
          previous.original.expectedRevision) === latest.revision,
    }

    const record = previous
      ? await setAccountJournalResolution({
          expected: previous,
          resolution,
          isCurrent: storageGuard(version, user.id, owner),
        })
      : await createAccountJournal({
          accountId: user.id,
          original: {
            kind: "save",
            expectedRevision: latest.revision,
            baseHash,
            sentHash,
          },
          resolution,
          isCurrent: storageGuard(version, user.id, owner),
        })

    retain(record)

    try {
      await writeWorkspace({
        userId: user.id,
        version,
        owner,
        workspace: chosen,
        expectedLocal: expected,
        expectedRevision: latest.revision,
        record,
        resolving: true,
      })
      await updateGuest(user.id, version, owner)
    } catch (cause) {
      if (current(version, user.id, owner)) {
        if (cause instanceof AccountApiError && cause.status === 409) {
          const changed = await load(user.id)
          assertCurrent(version, user.id, owner)
          conflict(
            changed,
            "The account changed before recovery finished. Review it again",
          )
        } else {
          fail(
            cause instanceof Error
              ? cause
              : new Error("Account recovery failed"),
          )
        }
      }

      throw cause
    }
  }

  async function prepareImportPlan({
    owner,
  }: {
    owner: WorkspaceOwner
  }): Promise<GuestImportPlan> {
    const { user, version } = requireOwner(owner)

    const expected = workspaceSchema.parse(
      authoritative(version, user.id, owner),
    )

    const record = journal

    if (record) {
      const original = record.original

      if (original.kind !== "import" || record.resolution)
        throw new Error("Resolve the pending account request before importing")

      const guest = await decodeJournalWorkspace({
        json: original.guestJson,
        hash: original.guestHash,
      })

      assertBaseline(version, user.id, owner, expected)

      return {
        id: original.importId,
        guest,
        expected,
        expectedRevision: original.expectedRevision,
        owner,
        recovered: true,
        journal: requestReference(record),
      }
    }

    if (state.status !== "saved" || state.revision === null || state.dirty)
      throw new Error("Sync the account before importing")
    const expectedRevision = state.revision
    const guest = await getPendingGuestWorkspace()
    assertBaseline(version, user.id, owner, expected)

    if (!guest || state.revision !== expectedRevision)
      throw new ImportPlanChangedError()

    return {
      id: crypto.randomUUID(),
      guest,
      expected,
      expectedRevision,
      owner,
      recovered: false,
      journal: null,
    }
  }

  async function performImport(
    plan: GuestImportPlan,
    { owner }: { owner: WorkspaceOwner },
  ) {
    const { user, version } = requireOwner(owner)
    const expected = workspaceSchema.parse(plan.expected)
    const guest = workspaceSchema.parse(plan.guest)
    assertBaseline(version, user.id, owner, expected)

    if (
      plan.owner !== owner ||
      !sameRequest(plan.journal, journal ? requestReference(journal) : null)
    )
      throw new ImportPlanChangedError()
    let record = journal

    if (record) {
      const original = record.original

      if (
        original.kind !== "import" ||
        record.resolution ||
        !plan.recovered ||
        original.importId !== plan.id ||
        original.expectedRevision !== plan.expectedRevision ||
        !sameWorkspace(
          guest,
          await decodeJournalWorkspace({
            json: original.guestJson,
            hash: original.guestHash,
          }),
        )
      )
        throw new ImportPlanChangedError()
    } else {
      if (
        plan.recovered ||
        state.status !== "saved" ||
        state.dirty ||
        state.revision !== plan.expectedRevision
      )
        throw new ImportPlanChangedError()

      const [encodedGuest, encodedLocal] = await Promise.all([
        encodeJournalWorkspace(guest),
        encodeJournalWorkspace(expected),
      ])

      assertBaseline(version, user.id, owner, expected)
      record = await createAccountJournal({
        accountId: user.id,
        original: {
          kind: "import",
          importId: plan.id,
          expectedRevision: plan.expectedRevision,
          guestJson: encodedGuest.json,
          guestHash: encodedGuest.hash,
          originalLocalJson: encodedLocal.json,
          originalLocalHash: encodedLocal.hash,
        },
        resolution: null,
        isCurrent: storageGuard(version, user.id, owner),
      })
      retain(record)
    }

    publish({ status: "syncing", error: null })

    try {
      const response = await client
        .getMutationCache()
        .build(client, importGuestMutationOptions())
        .execute({
          userId: user.id,
          workspace: guest,
          expected_revision: plan.expectedRevision,
          import_id: plan.id,
          beforeSend() {
            assertBaseline(version, user.id, owner, expected)
          },
        })

      assertCurrent(version, user.id, owner)

      if (response.revision <= plan.expectedRevision)
        throw new AccountApiError(200)
      const latest = await load(user.id)
      assertCurrent(version, user.id, owner)

      if (latest.revision < response.revision) throw new AccountApiError(200)
      await finishImport(record, latest, version, owner)

      if (state.status === "conflict")
        throw new Error(
          "The import completed, but local work changed. Review both versions",
        )
    } catch (cause) {
      if (current(version, user.id, owner)) {
        if (cause instanceof AccountApiError && cause.status === 409) {
          const latest = await load(user.id)
          assertCurrent(version, user.id, owner)
          conflict(
            latest,
            "The retained guest import needs review. Its original snapshot has not changed",
          )
        } else if (state.status !== "conflict") {
          fail(
            cause instanceof Error ? cause : new Error("Guest import failed"),
          )
        }
      }

      throw cause
    }
  }

  async function performLogout(
    owner: WorkspaceOwner,
    userId: string,
    version: number,
  ) {
    assertLogoutContext(version, userId, owner)
    await client
      .getMutationCache()
      .build(client, logoutMutationOptions())
      .execute({
        userId,
        beforeSend() {
          assertLogoutContext(version, userId, owner)
        },
      })
    assertLogoutContext(version, userId, owner)
    verified = false
    ++epoch
    cancelWaits()
    clearQueries()
    journal = null
    remote = null
    running = null
    actionRunning = false
    actionFinished = null
    publish({ ...initialState, status: "guest" })
    const hiding = setActiveWorkspace({ identity: null })

    try {
      signalIdentity(null)
    } finally {
      await hiding
    }
  }

  async function logout({ owner }: { owner: WorkspaceOwner }) {
    const user = requireLogoutContext(owner)

    if (logoutRunning)
      throw new Error("Account sign-out is already in progress")
    const version = ++epoch
    cancelWaits()
    const task = performLogout(owner, user.id, version)
    logoutRunning = task

    try {
      await task
    } finally {
      if (logoutRunning === task) logoutRunning = null
    }
  }

  function focusChanged() {
    const focus = getFocusSnapshot()

    if (lastWorkspace === focus.workspace) return
    lastWorkspace = focus.workspace

    if (
      !verified ||
      !state.user ||
      focus.owner.identity !== state.user.id ||
      !focus.hydrated ||
      focus.error !== null
    )
      return
    const wasSaved = state.status === "saved"

    if (wasSaved) publish({ dirty: true, status: "syncing" })
    else publish({ dirty: true })

    if (wasSaved && !running && !actionRunning && !logoutRunning)
      void sync({ owner: focus.owner })
  }

  function markerChanged(event: StorageEvent) {
    if (event.key === "pomodoro:workspace:guest" && verified && state.user) {
      const { user } = state
      const version = epoch
      const focus = getFocusSnapshot()

      if (
        focus.owner.identity !== user.id ||
        !focus.hydrated ||
        focus.error !== null
      )
        return
      void updateGuest(user.id, version, focus.owner).catch(
        (cause: unknown) => {
          if (current(version, user.id, focus.owner))
            publish({
              guestAvailable: false,
              error:
                cause instanceof Error
                  ? cause.message
                  : "Guest data is unavailable",
            })
        },
      )

      return
    }

    if (event.key !== ACCOUNT_MARKER_KEY && event.key !== null) return
    const version = ++epoch
    verified = false
    cancelWaits()
    journal = null
    remote = null
    clearQueries()
    const hiding = setActiveWorkspace({ identity: null })
    publish({ ...initialState })
    void hiding.then(
      () => {
        if (version === epoch) void refresh()
      },
      (cause: unknown) => {
        if (version === epoch)
          fail(
            cause instanceof Error
              ? cause
              : new Error("Account verification failed"),
          )
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
        cancelWaits()
        unsubscribeFocus?.()
        window.removeEventListener("storage", markerChanged)
        window.removeEventListener("focus", refreshOnEvent)
        window.removeEventListener("online", refreshOnEvent)
        clearQueries()
        journal = null
        remote = null
        const hiding = setActiveWorkspace({ identity: null })
        publish({ ...initialState })
        void hiding.catch((cause: unknown) => {
          if (version === epoch)
            fail(
              cause instanceof Error
                ? cause
                : new Error("Account verification failed"),
            )
        })
      }
    }
  }

  async function exclusive<T>(action: () => Promise<T>, owner: WorkspaceOwner) {
    requireOwner(owner)

    if (actionRunning || running || logoutRunning)
      throw new Error("An account operation is in progress")
    actionRunning = true
    const task = operation(owner, action)
    actionFinished = task

    try {
      return await task
    } finally {
      if (actionFinished === task) {
        actionFinished = null
        actionRunning = false

        if (
          verified &&
          state.status === "syncing" &&
          getFocusSnapshot().owner === owner
        )
          void sync({ owner })
      }
    }
  }

  async function resolve(
    input: Parameters<AccountController["resolve"]>[0],
    ownership: { owner: WorkspaceOwner },
  ) {
    await exclusive(() => resolveConflict(input, ownership), ownership.owner)
  }

  async function prepareImport(ownership: { owner: WorkspaceOwner }) {
    return await exclusive(() => prepareImportPlan(ownership), ownership.owner)
  }

  async function importGuest(
    plan: GuestImportPlan,
    ownership: { owner: WorkspaceOwner },
  ) {
    await exclusive(() => performImport(plan, ownership), ownership.owner)
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
