import { Link } from "@tanstack/react-router"
import { useRef, useState } from "react"

import type {
  AccountController,
  AccountSnapshot,
  GuestImportPlan,
} from "@/features/account/sync-contract"
import type { Workspace } from "@/features/focus/schema"
import type { WorkspaceOwner } from "@/features/focus/store"

import { ConfirmAction } from "@/components/confirm-action"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
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

async function resolveServer(
  id: string,
  workspace: Workspace,
  bound: BoundAccount,
) {
  await bound.controller.resolve(
    { source: "server", expected: workspace, expectedRevision: Number(id) },
    { owner: bound.owner },
  )
}

async function resolveLocal(
  id: string,
  workspace: Workspace,
  bound: BoundAccount,
) {
  await bound.controller.resolve(
    { source: "local", expected: workspace, expectedRevision: Number(id) },
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

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="xl" />}>
        {focus.owner.identity === null ? "Guest mode" : "Account"}
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Your workspace</DialogTitle>
          <DialogDescription>
            Manage your account and sync your work.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <AccountActions
            key={focus.owner.generation}
            controller={controller}
            state={state}
            workspace={focus.workspace}
          />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}

function accountStatus(state: AccountSnapshot) {
  switch (state.status) {
    case "guest":
      return "Guest work stays on this device."
    case "syncing":
      return "Syncing account work."
    case "saved":
      return state.dirty || state.revision === null
        ? "Changes are waiting to sync."
        : "Account work is synced."
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

    async function refresh() {
      if (inFlight.current) return
      inFlight.current = true
      setPending(true)
      setError(null)

      try {
        await bound.controller.refresh()
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Account check failed",
        )
      } finally {
        inFlight.current = false
        setPending(false)
      }
    }

    return { sync, refresh }
  })

  return { commands, pending, error }
}

export function AccountActions({
  controller,
  state,
  workspace,
}: {
  controller: AccountController
  state: AccountSnapshot
  workspace: Workspace
}) {
  const owner = useWorkspaceMutationOwner()
  const [bound] = useState(() => ({ controller, owner }))
  const { commands, pending, error } = useAccountCommands(bound)

  return (
    <Stack spacing="compact">
      <AccountFeedback state={state} pending={pending} error={error} />
      <HStack wrap>
        {!state.user && (
          <Button
            variant="outline"
            render={<a href="/auth/login">Sign in</a>}
          />
        )}
        {state.user ? (
          <>
            <Button
              variant="outline"
              loading={pending}
              disabled={
                state.status === "conflict" ||
                state.status === "loading" ||
                state.status === "syncing"
              }
              onClick={commands.sync}
            >
              {state.status === "error" || state.status === "offline"
                ? "Retry sync"
                : "Sync now"}
            </Button>
            {state.guestAvailable && <GuestImport bound={bound} />}
            <ConfirmAction
              title="Log out"
              description="Unsynced account work stays on this device. Export a backup in Settings if needed."
              targetId="logout"
              data={null}
              owner={bound}
              onConfirm={logout}
            >
              Log out
            </ConfirmAction>
          </>
        ) : (
          (state.status === "error" || state.status === "offline") && (
            <Button
              variant="outline"
              loading={pending}
              onClick={commands.refresh}
            >
              Retry account check
            </Button>
          )
        )}
      </HStack>
      {state.user &&
        state.status === "conflict" &&
        state.remoteRevision !== null && (
          <AccountConflict
            revision={state.remoteRevision}
            workspace={workspace}
            bound={bound}
          />
        )}
    </Stack>
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
    <>
      {state.user && (
        <Text variant="label">
          {state.user.name?.trim() ? state.user.name : "Account"}
        </Text>
      )}
      <Box
        render={
          <output>
            {pending ? "Working on account sync." : accountStatus(state)}
          </output>
        }
      />
      {(error ?? state.error) && (
        <Text role="alert" tone="destructive">
          {error ?? state.error}
        </Text>
      )}
    </>
  )
}

export function AccountConflict({
  revision,
  workspace,
  bound,
}: {
  revision: number
  workspace: Workspace
  bound: BoundAccount
}) {
  return (
    <Stack spacing="compact">
      <Text>
        Export a backup in <Link to="/settings">Settings</Link> before choosing.
        The other version will be replaced.
      </Text>
      <HStack wrap>
        <ConfirmAction
          title="Use account version"
          description="This replaces the local workspace with the account version. Export a backup first."
          targetId={String(revision)}
          data={workspace}
          owner={bound}
          onConfirm={resolveServer}
        >
          Use account version
        </ConfirmAction>
        <ConfirmAction
          title="Keep local version"
          description="This replaces the account workspace with this device's local version. Export a backup first."
          targetId={String(revision)}
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

export function GuestImport({ bound }: { bound: BoundAccount }) {
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

    if (dialog && !dialog.completed && dialog.plan) {
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
      <DialogTrigger render={<Button variant="outline" />}>
        Import guest work
      </DialogTrigger>
      {dialog && (
        <ImportContent
          key={dialog.id}
          dialog={dialog}
          bound={bound}
          setDialog={setDialog}
        />
      )}
    </Dialog>
  )
}

export function ImportContent({
  dialog,
  bound,
  setDialog,
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

  return (
    <DialogPopup>
      <DialogHeader>
        <DialogTitle>Import guest work</DialogTitle>
        <DialogDescription>
          Import the prepared guest work into this account. The guest source
          stays on this device.
        </DialogDescription>
      </DialogHeader>
      <DialogPanel>
        {guest ? (
          <Text>
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
          Confirm import
        </Button>
      </DialogFooter>
    </DialogPopup>
  )
}
