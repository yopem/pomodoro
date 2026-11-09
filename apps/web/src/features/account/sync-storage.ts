import { z } from "zod"

import type { Workspace } from "@/features/focus/schema"

import { workspaceSchema } from "@/features/focus/schema"

export interface SyncStamp {
  revision: number
  hash: string
}

export interface StoredSyncState {
  stamp: SyncStamp | null
  invalid: boolean
  cacheExists: boolean
}

export const ACCOUNT_MARKER_KEY = "pomodoro:account-marker:v1"

const userIdSchema = z.string().uuid()

const hashSchema = z.string().regex(/^[0-9a-f]{64}$/)

const stampSchema = z.strictObject({
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  hash: hashSchema,
})

function stampKey(userId: string) {
  return `pomodoro:sync:v1:${encodeURIComponent(userIdSchema.parse(userId))}`
}

function readStamp(key: string) {
  const value = window.localStorage.getItem(key)

  if (value === null) return { stamp: null, invalid: false }

  try {
    const result = stampSchema.safeParse(JSON.parse(value))

    return result.success
      ? { stamp: result.data, invalid: false }
      : { stamp: null, invalid: true }
  } catch {
    return { stamp: null, invalid: true }
  }
}

export function readStoredSyncState(userId: string): StoredSyncState {
  const key = stampKey(userId)
  const cacheKey = `pomodoro:workspace:account:${encodeURIComponent(userId)}`
  const cacheExists = window.localStorage.getItem(cacheKey) !== null

  return { ...readStamp(key), cacheExists }
}

export async function hashWorkspace(workspace: Workspace) {
  const json = JSON.stringify(workspaceSchema.parse(workspace))

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(json),
  )

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

export async function acknowledgeWorkspace(
  userId: string,
  stamp: SyncStamp,
  isCurrent: () => boolean,
  resolution?: { expected: SyncStamp },
) {
  const key = stampKey(userId)
  const incoming = stampSchema.parse(stamp)
  const expected = resolution ? stampSchema.parse(resolution.expected) : null

  if (!navigator.locks) throw new Error("Web Locks are unavailable")

  await navigator.locks.request(key, () => {
    if (!isCurrent()) return
    const previous = readStamp(key).stamp

    if (previous && previous.revision > incoming.revision) {
      throw new Error("Cannot replace a newer sync stamp")
    }

    if (previous && previous.revision === incoming.revision) {
      if (previous.hash === incoming.hash) return

      if (
        expected === null ||
        expected.revision !== previous.revision ||
        expected.hash !== previous.hash
      ) {
        throw new Error("Sync stamp hashes do not match")
      }
    }

    if (!isCurrent()) return
    window.localStorage.setItem(key, JSON.stringify(incoming))
  })
}

export function importedGuestHash(userId: string) {
  const value = window.localStorage.getItem(
    `${stampKey(userId)}:imported-guest`,
  )

  const result = hashSchema.safeParse(value)

  return result.success ? result.data : null
}

export async function forgetGuestImport(
  userId: string,
  hash: string,
  isCurrent: () => boolean,
) {
  const key = stampKey(userId)
  const digest = hashSchema.parse(hash)

  if (!navigator.locks) throw new Error("Web Locks are unavailable")

  await navigator.locks.request(key, () => {
    if (!isCurrent()) return

    if (importedGuestHash(userId) === digest)
      window.localStorage.removeItem(`${key}:imported-guest`)
  })
}

export async function rememberGuestImport(
  userId: string,
  hash: string,
  isCurrent: () => boolean,
) {
  const key = stampKey(userId)
  const digest = hashSchema.parse(hash)

  if (!navigator.locks) throw new Error("Web Locks are unavailable")

  await navigator.locks.request(key, () => {
    if (!isCurrent()) return
    window.localStorage.setItem(`${key}:imported-guest`, digest)
  })
}
