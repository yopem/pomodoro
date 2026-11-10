import type { ChangeEvent } from "react"

import { DownloadIcon, UploadIcon } from "lucide-react"
import { startTransition, useActionState, useState } from "react"

import type { Workspace } from "@/features/focus/schema"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Input } from "@/components/ui/input"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { exportBackup } from "@/features/focus/reports"
import { workspaceSchema } from "@/features/focus/schema"
import { importBackup, useWorkspaceMutationOwner } from "@/features/focus/store"
import { downloadText } from "@/lib/download"

const maxBackupBytes = 10 * 1024 * 1024

interface BackupState {
  file: File | null
  message: string | null
  error: string | null
  confirmation: {
    text: string
    identity: string | null
    expected: Workspace | null
    observed: Workspace
  } | null
}

type BackupAction =
  | { type: "select"; file: File | null }
  | { type: "prepare"; recoverCorrupt: boolean }
  | { type: "replace" }
  | { type: "download" }
  | { type: "close" }

const initialBackupState: BackupState = {
  file: null,
  message: null,
  error: null,
  confirmation: null,
}

export function WorkspaceBackup({
  workspace,
  identity,
}: {
  workspace: Workspace
  identity: string | null
}) {
  const owner = useWorkspaceMutationOwner()

  const [state, dispatch, pending] = useActionState(
    async function handleBackupAction(
      state: BackupState,
      action: BackupAction,
    ) {
      if (action.type === "select")
        return {
          ...state,
          file: action.file,
          message: null,
          error: null,
          confirmation: null,
        }

      if (action.type === "close") return { ...state, confirmation: null }

      if (action.type === "prepare") {
        if (!state.file) return state
        const observed = workspace

        try {
          if (state.file.size > maxBackupBytes)
            throw new Error("Backup must be 10 MB or smaller")
          const bytes = await state.file.arrayBuffer()
          const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
          let parsed: unknown

          try {
            parsed = JSON.parse(text)
          } catch {
            throw new Error("Backup is not valid JSON")
          }

          if (!workspaceSchema.safeParse(parsed).success)
            throw new Error("Backup does not contain a valid workspace")

          return {
            ...state,
            error: null,
            message: null,
            confirmation: {
              text,
              identity,
              expected: action.recoverCorrupt ? null : observed,
              observed,
            },
          }
        } catch (cause) {
          return {
            ...state,
            message: null,
            error:
              cause instanceof Error ? cause.message : "Could not read backup",
          }
        }
      }

      if (action.type === "replace") {
        if (!state.confirmation) return state

        try {
          if (
            workspace !== state.confirmation.observed ||
            identity !== state.confirmation.identity
          )
            throw new Error(
              "Workspace changed. Review it before restoring a backup.",
            )
          await importBackup(
            {
              text: state.confirmation.text,
              identity: state.confirmation.identity,
              expected: state.confirmation.expected,
            },
            { owner },
          )

          return {
            ...state,
            error: null,
            message: "Workspace replaced from backup.",
            file: null,
            confirmation: null,
          }
        } catch (cause) {
          return {
            ...state,
            error:
              cause instanceof Error
                ? cause.message
                : "Could not import backup",
          }
        }
      }

      try {
        downloadText({
          content: exportBackup(workspace),
          filename: "pomodoro-backup.json",
          contentType: "application/json",
        })

        return { ...state, error: null, message: "Backup download started." }
      } catch (cause) {
        return {
          ...state,
          error:
            cause instanceof Error ? cause.message : "Could not export backup",
        }
      }
    },
    initialBackupState,
  )

  const [, dispatchOpenChange] = useActionState(function handleOpenChange(
    _: null,
    open: boolean,
  ) {
    if (!open && !pending) dispatch({ type: "close" })

    return null
  }, null)

  const [events] = useState(function createBackupEvents() {
    function select(event: ChangeEvent<HTMLInputElement>) {
      const file = event.currentTarget.files?.[0] ?? null
      startTransition(() => dispatch({ type: "select", file }))
    }

    function prepare() {
      startTransition(() =>
        dispatch({ type: "prepare", recoverCorrupt: false }),
      )
    }

    function recover() {
      startTransition(() => dispatch({ type: "prepare", recoverCorrupt: true }))
    }

    function replace() {
      startTransition(() => dispatch({ type: "replace" }))
    }

    function download() {
      startTransition(() => dispatch({ type: "download" }))
    }

    function changeOpen(open: boolean) {
      startTransition(() => dispatchOpenChange(open))
    }

    return { select, prepare, recover, replace, download, changeOpen }
  })

  const { file, message, error, confirmation } = state

  return (
    <Dialog open={confirmation !== null} onOpenChange={events.changeOpen}>
      <Card
        render={
          <section
            id="settings-backup"
            aria-labelledby="settings-backup-title"
          />
        }
      >
        <CardHeader>
          <Heading
            id="settings-backup-title"
            render={<h2>Workspace backup</h2>}
          />
          <CardDescription>
            Keep a copy before clearing browser data or replacing your
            workspace.
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <Stack>
            <Grid variant="workspace">
              <Stack>
                <Heading render={<h3>Save a copy</h3>} />
                <Text size="small" tone="muted">
                  Download your current workspace as a JSON file.
                </Text>
                <Button
                  type="button"
                  variant="outline"
                  onClick={events.download}
                >
                  <DownloadIcon size={16} aria-hidden="true" /> Export backup
                </Button>
              </Stack>
              <Stack>
                <Heading render={<h3>Restore a copy</h3>} />
                <Text size="small" tone="muted">
                  Import replaces all tasks, projects, templates, sessions,
                  settings, and timer data.
                </Text>
                <Field>
                  <FieldLabel htmlFor="backup-file">
                    Backup JSON file (maximum 10 MB)
                  </FieldLabel>
                  <Input
                    id="backup-file"
                    type="file"
                    accept="application/json,.json"
                    onChange={events.select}
                  />
                </Field>
                {file && (
                  <>
                    <DialogTrigger
                      render={
                        <Button variant="destructive-outline" size="sm" />
                      }
                      disabled={pending}
                      onClick={events.prepare}
                    >
                      <UploadIcon size={16} aria-hidden="true" /> Import backup
                    </DialogTrigger>
                    <DialogTrigger
                      render={<Button variant="outline" size="sm" />}
                      disabled={pending}
                      onClick={events.recover}
                    >
                      Recover corrupt workspace
                    </DialogTrigger>
                  </>
                )}
              </Stack>
            </Grid>
            <DialogPopup>
              <DialogHeader>
                <DialogTitle>
                  {confirmation?.expected === null
                    ? "Recover corrupt workspace"
                    : "Replace workspace"}
                </DialogTitle>
                <DialogDescription>
                  {confirmation?.expected === null
                    ? "Restore this backup only if the current workspace storage is corrupt. The corrupt data will be retained."
                    : "This replaces all current workspace data. Export a backup first if you need to keep it."}
                </DialogDescription>
              </DialogHeader>
              {error && (
                <Text role="alert" tone="destructive">
                  {error}
                </Text>
              )}
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" disabled={pending} />}
                >
                  Cancel
                </DialogClose>
                <Button
                  variant="destructive"
                  loading={pending}
                  onClick={events.replace}
                >
                  {confirmation?.expected === null
                    ? "Recover workspace"
                    : "Replace workspace"}
                </Button>
              </DialogFooter>
            </DialogPopup>
            {error && !confirmation && (
              <Text role="alert" tone="destructive">
                {error}
              </Text>
            )}
            {message && <output>{message}</output>}
          </Stack>
        </CardPanel>
      </Card>
    </Dialog>
  )
}
