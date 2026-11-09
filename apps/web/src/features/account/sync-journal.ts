import { z } from "zod"

import type { JournalWorkspaceV1 } from "@/features/account/journal-workspace-v1"
import type { Workspace } from "@/features/focus/schema"

import { journalWorkspaceV1Schema } from "@/features/account/journal-workspace-v1"

type SameWorkspace =
  (<T>() => T extends Workspace ? 1 : 2) extends <
    T,
  >() => T extends JournalWorkspaceV1 ? 1 : 2
    ? true
    : false

const sameWorkspace: SameWorkspace = true

const uuid = z.string().uuid()

const canonicalAccountId = uuid.refine((value) => value === value.toLowerCase())

const hash = z.string().regex(/^[0-9a-f]{64}$/)

const revision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)

const originalSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("save"),
    expectedRevision: revision,
    baseHash: hash,
    sentHash: hash,
  }),
  z.strictObject({
    kind: z.literal("import"),
    importId: uuid,
    expectedRevision: revision,
    guestJson: z.string().max(20_000_000),
    guestHash: hash,
    originalLocalJson: z.string().max(20_000_000),
    originalLocalHash: hash,
  }),
])

const resolutionSchema = z.strictObject({
  attemptId: uuid,
  source: z.enum(["server", "local"]),
  expectedRevision: revision,
  baseHash: hash,
  sentHash: hash,
  expectedLocalHash: hash,
  ambiguousPredecessor: z.boolean(),
})

const journalSchema = z
  .strictObject({
    version: z.literal(1),
    accountId: canonicalAccountId,
    operationId: uuid,
    token: uuid,
    original: originalSchema,
    resolution: resolutionSchema.nullable(),
  })
  .refine((record) => {
    const choice = record.resolution

    return (
      choice === null ||
      (choice.expectedRevision >= record.original.expectedRevision &&
        (choice.source === "server"
          ? choice.sentHash === choice.baseHash
          : choice.sentHash === choice.expectedLocalHash))
    )
  })

export type JournalOriginal = z.infer<typeof originalSchema>

export type JournalResolution = z.infer<typeof resolutionSchema>

export type AccountJournal = z.infer<typeof journalSchema>

export class AccountJournalError extends Error {
  readonly kind: "unavailable" | "invalid" | "changed" | "busy"

  constructor(kind: "unavailable" | "invalid" | "changed" | "busy") {
    super(
      {
        unavailable:
          "Account recovery storage is unavailable. Retry when storage is available.",
        invalid:
          "Account recovery data is invalid or unsupported. Preserve it and seek recovery help.",
        changed:
          "Account recovery data or the current account changed. Refresh and review again.",
        busy: "Another account operation is still running. Retry after it finishes.",
      }[kind],
    )
    this.name = "AccountJournalError"
    this.kind = kind
  }
}

function current(isCurrent: () => boolean) {
  if (!isCurrent()) throw new AccountJournalError("changed")
}

function accountId(value: string) {
  const parsed = canonicalAccountId.safeParse(value)

  if (!parsed.success) throw new AccountJournalError("invalid")

  return parsed.data
}

async function hashJournalJson(json: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(json),
  )

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

export async function encodeJournalWorkspace(workspace: Workspace) {
  if (!sameWorkspace) throw new AccountJournalError("invalid")
  const parsed = journalWorkspaceV1Schema.safeParse(workspace)

  if (!parsed.success) throw new AccountJournalError("invalid")
  const json = JSON.stringify(parsed.data)

  if (json.length > 20_000_000) throw new AccountJournalError("invalid")
  const digest = await hashJournalJson(json)

  return { json, hash: digest }
}

export async function decodeJournalWorkspace(input: {
  json: string
  hash: string
}) {
  if (input.json.length > 20_000_000 || !hash.safeParse(input.hash).success) {
    throw new AccountJournalError("invalid")
  }

  let value: unknown

  try {
    value = JSON.parse(input.json)
  } catch {
    throw new AccountJournalError("invalid")
  }

  const parsed = journalWorkspaceV1Schema.safeParse(value)

  if (!parsed.success || JSON.stringify(parsed.data) !== input.json) {
    throw new AccountJournalError("invalid")
  }

  if ((await hashJournalJson(input.json)) !== input.hash) {
    throw new AccountJournalError("invalid")
  }

  const workspace: Workspace = parsed.data

  return workspace
}

async function validateJournal(
  record: AccountJournal,
  isCurrent: () => boolean,
) {
  const parsed = journalSchema.safeParse(record)

  if (!parsed.success) throw new AccountJournalError("invalid")

  if (parsed.data.original.kind === "import") {
    const original = parsed.data.original
    await decodeJournalWorkspace({
      json: original.guestJson,
      hash: original.guestHash,
    })
    current(isCurrent)
    await decodeJournalWorkspace({
      json: original.originalLocalJson,
      hash: original.originalLocalHash,
    })
    current(isCurrent)
  }

  return parsed.data
}

function openDatabase(isCurrent: () => boolean) {
  current(isCurrent)

  if (typeof indexedDB === "undefined")
    throw new AccountJournalError("unavailable")

  return new Promise<IDBDatabase>((resolve, reject) => {
    let settled = false
    let request: IDBOpenDBRequest | undefined
    const timer = setTimeout(() => fail(), 10_000)

    function fail() {
      if (settled) return
      settled = true
      clearTimeout(timer)

      if (request?.transaction) {
        try {
          request.transaction.abort()
        } catch {
          reject(new AccountJournalError("unavailable"))

          return
        }
      }

      reject(new AccountJournalError("unavailable"))
    }

    try {
      request = indexedDB.open("pomodoro:account-requests:v1", 1)
    } catch {
      fail()

      return
    }

    request.onblocked = fail
    request.onerror = fail
    request.onupgradeneeded = (event) => {
      if (settled || !isCurrent() || event.oldVersion !== 0) {
        request.transaction?.abort()

        return
      }

      request.result.createObjectStore("requests", { keyPath: "accountId" })
    }

    request.onsuccess = () => {
      const db = request.result

      if (settled || !isCurrent()) {
        db.close()

        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(new AccountJournalError("changed"))
        }

        return
      }

      if (
        db.objectStoreNames.length !== 1 ||
        !db.objectStoreNames.contains("requests")
      ) {
        db.close()
        settled = true
        clearTimeout(timer)
        reject(new AccountJournalError("invalid"))

        return
      }

      db.onversionchange = () => db.close()
      settled = true
      clearTimeout(timer)
      resolve(db)
    }
  })
}

function transact<T>(input: {
  db: IDBDatabase
  accountId: string
  isCurrent: () => boolean
  mode: IDBTransactionMode
  apply: (store: IDBObjectStore, value: AccountJournal | null) => T
}) {
  return new Promise<T>((resolve, reject) => {
    let result: T
    let failure: AccountJournalError | null = null
    let finished = false
    let transaction: IDBTransaction

    const timer = setTimeout(() => {
      failure = new AccountJournalError("unavailable")

      try {
        transaction.abort()
      } catch {
        input.db.close()
      }

      finish()
    }, 10_000)

    function finish() {
      if (finished) return
      finished = true
      clearTimeout(timer)
      input.db.close()

      if (failure) reject(failure)
      else resolve(result)
    }

    try {
      current(input.isCurrent)
      transaction = input.db.transaction("requests", input.mode, {
        durability: input.mode === "readwrite" ? "strict" : "default",
      })
      const store = transaction.objectStore("requests")

      if (
        store.keyPath !== "accountId" ||
        store.autoIncrement ||
        store.indexNames.length !== 0
      ) {
        throw new AccountJournalError("invalid")
      }

      input.db.onversionchange = () => {
        failure = new AccountJournalError("unavailable")

        try {
          transaction.abort()
        } catch {
          input.db.close()
        }

        finish()
      }

      transaction.oncomplete = () => {
        if (!input.isCurrent()) failure = new AccountJournalError("changed")
        finish()
      }

      transaction.onabort = () => {
        failure ??= new AccountJournalError("unavailable")
        finish()
      }

      const request = store.get(input.accountId)
      request.onsuccess = () => {
        if (finished) return

        try {
          current(input.isCurrent)
          const raw: unknown = request.result
          let record: AccountJournal | null = null

          if (raw !== undefined) {
            const parsed = journalSchema.safeParse(raw)

            if (!parsed.success || parsed.data.accountId !== input.accountId) {
              throw new AccountJournalError("invalid")
            }

            record = parsed.data
          }

          result = input.apply(store, record)
        } catch (error) {
          failure =
            error instanceof AccountJournalError
              ? error
              : new AccountJournalError("unavailable")
          transaction.abort()
        }
      }
    } catch (error) {
      failure =
        error instanceof AccountJournalError
          ? error
          : new AccountJournalError("unavailable")
      finish()
    }
  })
}

export async function readAccountJournal(input: {
  accountId: string
  isCurrent: () => boolean
}) {
  const id = accountId(input.accountId)
  current(input.isCurrent)
  const db = await openDatabase(input.isCurrent)

  const record = await transact({
    db,
    accountId: id,
    isCurrent: input.isCurrent,
    mode: "readonly",
    apply: (_store, value) => value,
  })

  current(input.isCurrent)

  if (record === null) return null
  const valid = await validateJournal(record, input.isCurrent)
  current(input.isCurrent)

  return valid
}

export async function createAccountJournal(input: {
  accountId: string
  original: JournalOriginal
  resolution: JournalResolution | null
  isCurrent: () => boolean
}) {
  const id = accountId(input.accountId)
  current(input.isCurrent)

  const record = await validateJournal(
    {
      version: 1,
      accountId: id,
      operationId: crypto.randomUUID(),
      token: crypto.randomUUID(),
      original: input.original,
      resolution: input.resolution,
    },
    input.isCurrent,
  )

  current(input.isCurrent)
  const db = await openDatabase(input.isCurrent)

  return await transact({
    db,
    accountId: id,
    isCurrent: input.isCurrent,
    mode: "readwrite",
    apply: (store, value) => {
      if (value !== null) throw new AccountJournalError("changed")
      current(input.isCurrent)
      store.add(record)

      return record
    },
  })
}

export async function setAccountJournalResolution(input: {
  expected: AccountJournal
  resolution: JournalResolution
  isCurrent: () => boolean
}) {
  current(input.isCurrent)
  const expected = await validateJournal(input.expected, input.isCurrent)
  current(input.isCurrent)
  const previous = expected.resolution

  if (
    previous &&
    (input.resolution.expectedRevision < previous.expectedRevision ||
      input.resolution.attemptId === previous.attemptId ||
      input.resolution.ambiguousPredecessor !==
        (input.resolution.expectedRevision === previous.expectedRevision))
  ) {
    throw new AccountJournalError("invalid")
  }

  const next = await validateJournal(
    { ...expected, token: crypto.randomUUID(), resolution: input.resolution },
    input.isCurrent,
  )

  current(input.isCurrent)

  if (next.token === expected.token)
    throw new AccountJournalError("unavailable")
  const db = await openDatabase(input.isCurrent)

  return await transact({
    db,
    accountId: expected.accountId,
    isCurrent: input.isCurrent,
    mode: "readwrite",
    apply: (store, value) => {
      if (value === null || JSON.stringify(value) !== JSON.stringify(expected))
        throw new AccountJournalError("changed")
      current(input.isCurrent)
      store.put(next)

      return next
    },
  })
}

export async function removeAccountJournal(input: {
  expected: AccountJournal
  isCurrent: () => boolean
}) {
  current(input.isCurrent)
  const expected = await validateJournal(input.expected, input.isCurrent)
  current(input.isCurrent)
  const db = await openDatabase(input.isCurrent)
  await transact({
    db,
    accountId: expected.accountId,
    isCurrent: input.isCurrent,
    mode: "readwrite",
    apply: (store, value) => {
      if (value === null || JSON.stringify(value) !== JSON.stringify(expected))
        throw new AccountJournalError("changed")
      current(input.isCurrent)
      store.delete(expected.accountId)
    },
  })
}

export async function withAccountOperation<T>(input: {
  accountId: string
  isCurrent: () => boolean
  signal?: AbortSignal
  run: () => Promise<T>
}) {
  const id = accountId(input.accountId)
  current(input.isCurrent)

  if (typeof navigator === "undefined" || !navigator.locks)
    throw new AccountJournalError("unavailable")
  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort()

  if (input.signal?.aborted) throw new AccountJournalError("changed")
  input.signal?.addEventListener("abort", cancel, { once: true })

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 30_000)

  try {
    return await navigator.locks.request(
      `pomodoro:account-operation:v1:${id}`,
      { signal: controller.signal },
      async () => {
        clearTimeout(timer)
        input.signal?.removeEventListener("abort", cancel)

        if (timedOut) throw new AccountJournalError("busy")

        if (controller.signal.aborted) throw new AccountJournalError("changed")
        current(input.isCurrent)

        const result = await input.run()
        current(input.isCurrent)

        return result
      },
    )
  } catch (error) {
    if (timedOut) throw new AccountJournalError("busy")

    if (controller.signal.aborted) throw new AccountJournalError("changed")
    throw error
  } finally {
    clearTimeout(timer)
    input.signal?.removeEventListener("abort", cancel)
  }
}
