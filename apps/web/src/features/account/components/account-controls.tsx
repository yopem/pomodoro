import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import {
  ChevronDownIcon,
  CloudIcon,
  LogOutIcon,
  SettingsIcon,
  UserRoundIcon,
} from "lucide-react"
import { useRef, useState } from "react"
import { z } from "zod"

import type {
  AccountController,
  AccountSnapshot,
  GuestImportPlan,
  PendingAccountRequest,
} from "@/features/account/sync-contract"
import type { Workspace } from "@/features/focus/schema"
import type { WorkspaceOwner } from "@/features/focus/store"

import { ConfirmAction } from "@/components/confirm-action"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardPanel } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HStack } from "@/components/ui/hstack"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { ImportPlanChangedError } from "@/features/account/sync-contract"
import {
  useFocusSnapshot,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { useEventCallback } from "@/hooks/use-event-callback"

interface BoundAccount {
  controller: AccountController
  owner: WorkspaceOwner
}

const conflictTargetSchema = z.strictObject({
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  request: z
    .strictObject({
      operationId: z.string().uuid(),
      token: z.string().uuid(),
      kind: z.enum(["save", "import"]),
      phase: z.enum(["original", "resolution"]),
    })
    .nullable(),
})

async function resolveServer(
  id: string,
  workspace: Workspace,
  bound: BoundAccount,
) {
  const target = conflictTargetSchema.parse(JSON.parse(id))

  await bound.controller.resolve(
    {
      source: "server",
      expected: workspace,
      expectedRevision: target.revision,
      request: target.request,
    },
    { owner: bound.owner },
  )
}

async function resolveLocal(
  id: string,
  workspace: Workspace,
  bound: BoundAccount,
) {
  const target = conflictTargetSchema.parse(JSON.parse(id))

  await bound.controller.resolve(
    {
      source: "local",
      expected: workspace,
      expectedRevision: target.revision,
      request: target.request,
    },
    { owner: bound.owner },
  )
}

async function logout(_id: string, _data: null, bound: BoundAccount) {
  await bound.controller.logout({ owner: bound.owner })
}

export function AccountControls({
  controller,
  state,
}: {
  controller: AccountController
  state: AccountSnapshot
}) {
  const focus = useFocusSnapshot((value) => value)

  if (state.user === null || focus.owner.identity === null) {
    return (
      <Button variant="outline" size="lg" render={<Link to="/auth/login" />}>
        Log in
      </Button>
    )
  }

  return (
    <SignedInAccountControls
      key={focus.owner.generation}
      controller={controller}
      state={state}
      workspace={focus.workspace}
      owner={focus.owner}
    />
  )
}

export function SignedInAccountControls({
  controller,
  state,
  workspace,
  owner,
}: {
  controller: AccountController
  state: AccountSnapshot
  workspace: Workspace
  owner: WorkspaceOwner
}) {
  const accountCloseRef = useRef<HTMLButtonElement>(null)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountCloseProps] = useState(() => ({ ref: accountCloseRef }))
  const openAccount = useEventCallback(() => setAccountOpen(true))
  const accountName = state.user?.name?.trim() ?? ""
  const [accountOwner] = useState(() => ({ controller, owner }))

  return (
    <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
      <Menu>
        <MenuTrigger
          ref={accountTriggerRef}
          render={<Button variant="ghost" size="lg" />}
        >
          <UserRoundIcon size={18} aria-hidden="true" />
          Account
          <ChevronDownIcon size={14} aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end" sideOffset={8} xstyle={styles.accountMenu}>
          <MenuGroup>
            <MenuGroupLabel>
              <Stack spacing="compact">
                <Text variant="label" size="small">
                  {accountName.length > 0 ? accountName : "Your account"}
                </Text>
                <Text size="small" tone="muted">
                  {accountStatus(state)}
                </Text>
              </Stack>
            </MenuGroupLabel>
            <MenuSeparator />
            <MenuLinkItem render={<Link to="/settings" />}>
              <SettingsIcon size={16} aria-hidden="true" /> Settings
            </MenuLinkItem>
            <MenuItem onClick={openAccount}>
              <UserRoundIcon size={16} aria-hidden="true" /> Account details
            </MenuItem>
            <MenuSeparator />
            <ConfirmAction
              title="Log out"
              description="Unsynced account work stays on this device. Export a backup in Settings if needed."
              targetId="logout"
              data={null}
              owner={accountOwner}
              onConfirm={logout}
              trigger={
                <MenuItem
                  nativeButton
                  render={<button type="button" aria-label="Log out" />}
                  variant="destructive"
                  closeOnClick={false}
                />
              }
            >
              <LogOutIcon size={16} aria-hidden="true" /> Log out
            </ConfirmAction>
          </MenuGroup>
        </MenuPopup>
      </Menu>
      <DialogPopup
        closeProps={accountCloseProps}
        finalFocus={accountTriggerRef}
      >
        <DialogHeader>
          <DialogTitle>Your workspace</DialogTitle>
          <DialogDescription>
            Manage your account and the work saved on this device.
          </DialogDescription>
        </DialogHeader>
        <AccountActions
          key={owner.generation}
          controller={controller}
          state={state}
          workspace={workspace}
          accountCloseRef={accountCloseRef}
        />
      </DialogPopup>
    </Dialog>
  )
}

function accountStatus(state: AccountSnapshot) {
  switch (state.status) {
    case "guest":
      return "Guest work stays on this device."
    case "syncing":
      return "Saving changes automatically."
    case "saved":
      return state.dirty || state.revision === null
        ? "Changes are waiting to sync."
        : "All changes saved."
    case "offline":
      return "Offline. Changes may not be synced."
    case "error":
      return "Account sync needs attention. Changes may not be synced."
    case "conflict":
      return "Review the account versions before sync can continue."
    case "loading":
      return "Checking account. You can continue working on this device."
  }
}

export function useAccountCommands(bound: BoundAccount) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const [commands] = useState(function createAccountCommands() {
    async function sync() {
      if (inFlight.current) return
      inFlight.current = true
      setPending(true)
      setError(null)

      try {
        await bound.controller.sync({ owner: bound.owner })
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Sync failed")
      } finally {
        inFlight.current = false
        setPending(false)
      }
    }

    return { sync }
  })

  return { commands, pending, error }
}

export function AccountActions({
  controller,
  state,
  workspace,
  accountCloseRef,
}: {
  controller: AccountController
  state: AccountSnapshot
  workspace: Workspace
  accountCloseRef: React.RefObject<HTMLButtonElement | null>
}) {
  const owner = useWorkspaceMutationOwner()
  const [bound] = useState(() => ({ controller, owner }))
  const { commands, pending, error } = useAccountCommands(bound)

  const currentAccount = state.user?.id === owner.identity

  return (
    <>
      <DialogPanel>
        <Stack spacing="relaxed">
          <AccountFeedback state={state} pending={pending} error={error} />
          {state.user && (
            <>
              {(state.status === "error" || state.status === "offline") && (
                <Button
                  variant="outline"
                  loading={pending}
                  onClick={commands.sync}
                >
                  Retry sync
                </Button>
              )}
              <AccountImportAction
                bound={bound}
                state={state}
                accountCloseRef={accountCloseRef}
              />
            </>
          )}
          {state.user &&
            currentAccount &&
            state.status === "conflict" &&
            state.remoteRevision !== null && (
              <AccountConflict
                revision={state.remoteRevision}
                workspace={workspace}
                request={state.pendingOperation}
                bound={bound}
              />
            )}
        </Stack>
      </DialogPanel>
      {state.user && (
        <DialogFooter>
          <HStack layout="spread" xstyle={styles.accountAccess}>
            <Text size="small" tone="muted">
              Log out of this device
            </Text>
            <ConfirmAction
              title="Log out"
              description="Unsynced account work stays on this device. Export a backup in Settings if needed."
              targetId="logout"
              data={null}
              owner={bound}
              onConfirm={logout}
              trigger={<Button variant="destructive-outline" />}
            >
              <LogOutIcon size={16} aria-hidden="true" />
              Log out
            </ConfirmAction>
          </HStack>
        </DialogFooter>
      )}
    </>
  )
}

export function AccountImportAction({
  bound,
  state,
  accountCloseRef,
}: {
  bound: BoundAccount
  state: AccountSnapshot
  accountCloseRef: React.RefObject<HTMLButtonElement | null>
}) {
  if (state.user?.id !== bound.owner.identity) return null

  const pending = state.pendingOperation

  const request =
    pending?.kind === "import" && pending.phase === "original" ? pending : null

  const available =
    request !== null || (pending === null && state.guestAvailable)

  return (
    <GuestImport
      bound={bound}
      request={request}
      available={available}
      accountCloseRef={accountCloseRef}
    />
  )
}

export function AccountFeedback({
  state,
  pending,
  error,
}: {
  state: AccountSnapshot
  pending: boolean
  error: string | null
}) {
  return (
    <Stack spacing="compact">
      <Card>
        {state.user && (
          <CardPanel>
            <HStack>
              <UserRoundIcon size={32} aria-hidden="true" />
              <Stack spacing="compact">
                <Text variant="eyebrow">Signed in as</Text>
                <Text variant="label">
                  {state.user.name?.trim() ? state.user.name : "Your account"}
                </Text>
              </Stack>
            </HStack>
          </CardPanel>
        )}
        <CardFooter separator>
          <Stack spacing="compact">
            <HStack layout="row">
              <CloudIcon size={18} aria-hidden="true" />
              <Text variant="label" size="small">
                Automatic sync
              </Text>
            </HStack>
            <Text size="small" tone="muted">
              <output aria-live="polite" aria-atomic="true">
                {pending ? "Retrying sync." : accountStatus(state)}
              </output>
            </Text>
          </Stack>
        </CardFooter>
      </Card>
      {(error ?? state.error) && (
        <Text role="alert" tone="destructive" size="small">
          {error ?? state.error}
        </Text>
      )}
    </Stack>
  )
}

export function AccountConflict({
  revision,
  workspace,
  request,
  bound,
}: {
  revision: number
  workspace: Workspace
  request: PendingAccountRequest | null
  bound: BoundAccount
}) {
  const targetId = JSON.stringify({ revision, request })

  return (
    <Stack spacing="compact">
      <Text>
        Export a backup in <Link to="/settings">Settings</Link> before choosing.
        The other version will be replaced.
      </Text>
      {request?.kind === "import" && (
        <Text>
          These choices resolve or cancel the unfinished import. They do not
          prove that it was imported. The original guest source may have
          changed.
        </Text>
      )}
      <HStack wrap>
        <ConfirmAction
          title="Use account version"
          description={
            request?.kind === "import"
              ? "This replaces local work with the account version and resolves or cancels the unfinished import. It does not prove the import succeeded. Export a backup first."
              : "This replaces the local workspace with the account version. Export a backup first."
          }
          targetId={targetId}
          data={workspace}
          owner={bound}
          onConfirm={resolveServer}
        >
          Use account version
        </ConfirmAction>
        <ConfirmAction
          title="Keep local version"
          description={
            request?.kind === "import"
              ? "This replaces the account workspace with local work and resolves or cancels the unfinished import. It does not prove the import succeeded. Export a backup first."
              : "This replaces the account workspace with this device's local version. Export a backup first."
          }
          targetId={targetId}
          data={workspace}
          owner={bound}
          onConfirm={resolveLocal}
        >
          Keep local version
        </ConfirmAction>
      </HStack>
    </Stack>
  )
}

export function GuestImport({
  bound,
  request,
  available,
  accountCloseRef,
}: {
  bound: BoundAccount
  request: PendingAccountRequest | null
  available: boolean
  accountCloseRef: React.RefObject<HTMLButtonElement | null>
}) {
  const [dialog, setDialog] = useState<{
    id: number
    open: boolean
    plan: GuestImportPlan | null
    completed: boolean
    error: string | null
  } | null>(null)

  const nextId = useRef(0)
  const preparing = useRef(false)

  const changeOpen = useEventCallback((open: boolean) => {
    if (!open) {
      setDialog((current) => current && { ...current, open: false })

      return
    }

    if (
      dialog &&
      !dialog.completed &&
      dialog.plan &&
      dialog.plan.journal?.operationId === request?.operationId &&
      dialog.plan.journal?.token === request?.token
    ) {
      setDialog({ ...dialog, id: ++nextId.current, open: true })

      return
    }

    if (preparing.current) return
    preparing.current = true
    const id = ++nextId.current
    setDialog({ id, open: true, plan: null, completed: false, error: null })
    void bound.controller
      .prepareImport({ owner: bound.owner })
      .then(
        (plan) =>
          setDialog((current) =>
            current?.id === id ? { ...current, plan } : current,
          ),
        (cause: unknown) =>
          setDialog((current) =>
            current?.id === id
              ? {
                  ...current,
                  error:
                    cause instanceof Error
                      ? cause.message
                      : "Could not prepare import",
                }
              : current,
          ),
      )
      .finally(() => {
        preparing.current = false
      })
  })

  return (
    <Dialog open={dialog?.open ?? false} onOpenChange={changeOpen}>
      {(available || dialog?.open) && (
        <Card>
          <CardPanel>
            <Stack spacing="compact">
              <Text variant="label" size="small">
                Work on this device
              </Text>
              <Text size="small" tone="muted">
                {request
                  ? "Review the saved guest snapshot before retrying the original import."
                  : "Import guest projects, tasks, templates, and focus history into your account. The guest copy stays on this device."}
              </Text>
              <DialogTrigger render={<Button variant="outline" size="lg" />}>
                {request ? "Review pending import" : "Import guest work"}
              </DialogTrigger>
            </Stack>
          </CardPanel>
        </Card>
      )}
      {dialog && (
        <ImportContent
          key={dialog.id}
          dialog={dialog}
          bound={bound}
          setDialog={setDialog}
          accountCloseRef={accountCloseRef}
        />
      )}
    </Dialog>
  )
}

export function ImportContent({
  dialog,
  bound,
  setDialog,
  accountCloseRef,
}: {
  dialog: {
    id: number
    open: boolean
    plan: GuestImportPlan | null
    completed: boolean
    error: string | null
  }
  bound: BoundAccount
  setDialog: React.Dispatch<React.SetStateAction<typeof dialog | null>>
  accountCloseRef: React.RefObject<HTMLButtonElement | null>
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const confirm = useEventCallback(async () => {
    const plan = dialog.plan

    if (!plan || inFlight.current) return
    inFlight.current = true
    setPending(true)
    setError(null)

    try {
      await bound.controller.importGuest(plan, { owner: bound.owner })
      setDialog((current) =>
        current?.id === dialog.id && current.plan === plan
          ? { ...current, open: false, completed: true }
          : current,
      )
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Import failed"
      setError(message)

      if (cause instanceof ImportPlanChangedError) {
        setDialog((current) =>
          current?.id === dialog.id && current.plan === plan
            ? { ...current, plan: null, error: message }
            : current,
        )
      }
    } finally {
      inFlight.current = false
      setPending(false)
    }
  })

  const guest = dialog.plan?.guest
  const recovered = dialog.plan?.recovered ?? false

  return (
    <DialogPopup finalFocus={accountCloseRef}>
      <DialogHeader>
        <DialogTitle>
          {recovered ? "Review pending import" : "Import guest work"}
        </DialogTitle>
        <DialogDescription>
          {recovered
            ? "Retry the original import with its saved ID and original snapshot, not the current guest contents. The guest source may have changed."
            : "Import guest projects, tasks, templates, and focus history. This account keeps its timer and settings unless its workspace is the empty default. The guest source stays on this device."}
        </DialogDescription>
      </DialogHeader>
      <DialogPanel>
        {guest ? (
          <Text>
            {recovered ? "Original saved snapshot: " : ""}
            {guest.tasks.length} tasks, {guest.projects.length} projects,{" "}
            {guest.templates.length} templates, {guest.sessions.length}{" "}
            sessions.
          </Text>
        ) : (
          !dialog.error && <Box render={<output>Preparing import…</output>} />
        )}
        {(error ?? dialog.error) && (
          <Text role="alert" tone="destructive">
            {error ?? dialog.error}
          </Text>
        )}
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={pending} />}>
          Cancel
        </DialogClose>
        <Button loading={pending} disabled={!guest} onClick={confirm}>
          {recovered ? "Retry original import" : "Confirm import"}
        </Button>
      </DialogFooter>
    </DialogPopup>
  )
}

const styles = stylex.create({
  accountMenu: {
    inlineSize: "min(280px, calc(100vw - 32px))",
  },
  accountAccess: { inlineSize: "100%" },
})
