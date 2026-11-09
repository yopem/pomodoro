import type { AccountUser } from "@/features/account/queries"
import type { Workspace } from "@/features/focus/schema"
import type { WorkspaceOwner } from "@/features/focus/store"

export class ImportPlanChangedError extends Error {
  constructor(
    message = "The import preparation changed. Close it and prepare the import again",
  ) {
    super(message)
    this.name = "ImportPlanChangedError"
  }
}

export interface PendingAccountRequest {
  operationId: string
  token: string
  kind: "save" | "import"
  phase: "original" | "resolution"
}

export interface AccountSnapshot {
  user: AccountUser | null
  status:
    "loading" | "guest" | "syncing" | "saved" | "offline" | "conflict" | "error"
  error: string | null
  dirty: boolean
  revision: number | null
  remoteRevision: number | null
  guestAvailable: boolean
  pendingOperation: PendingAccountRequest | null
}

export interface GuestImportPlan {
  id: string
  guest: Workspace
  expected: Workspace
  expectedRevision: number
  owner: WorkspaceOwner
  recovered: boolean
  journal: PendingAccountRequest | null
}

export interface AccountController {
  refresh(): Promise<void>
  sync(ownership: { owner: WorkspaceOwner }): Promise<void>
  resolve(
    input: {
      source: "server" | "local"
      expected: Workspace
      expectedRevision: number
      request: PendingAccountRequest | null
    },
    ownership: { owner: WorkspaceOwner },
  ): Promise<void>
  prepareImport(ownership: { owner: WorkspaceOwner }): Promise<GuestImportPlan>
  importGuest(
    plan: GuestImportPlan,
    ownership: { owner: WorkspaceOwner },
  ): Promise<void>
  logout(ownership: { owner: WorkspaceOwner }): Promise<void>
}
