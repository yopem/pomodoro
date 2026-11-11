import type { FormEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { DownloadIcon } from "lucide-react"
import { startTransition, useActionState, useRef, useState } from "react"

import type { Workspace } from "@/features/focus/schema"

import { Box } from "@/components/ui/box"
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
} from "@/components/ui/dialog"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { exportBackup } from "@/features/focus/reports"
import { workspaceSchema } from "@/features/focus/schema"
import { importBackup, useWorkspaceMutationOwner } from "@/features/focus/store"
import {
  BackupFilePicker,
  BackupRestoreActions,
} from "@/features/settings/components/backup-file-picker"
import { downloadText } from "@/lib/download"

const maxBackupBytes = 10 * 1024 * 1024

interface BackupSelection {
  file: File | null
}

function validateBackupFile({ value }: { value: File | null }) {
  return value ? undefined : "Choose a backup file"
}

function selectIsSubmitting(formState: { isSubmitting: boolean }) {
  return formState.isSubmitting
}

const backupFileValidators = {
  onSubmit: validateBackupFile,
}

interface BackupState {
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
  | { type: "select" }
  | {
      type: "prepare"
      file: File
      recoverCorrupt: boolean
    }
  | { type: "replace" }
  | { type: "download" }
  | { type: "close" }

const initialBackupState: BackupState = {
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
  const defaultValues: BackupSelection = { file: null }

  const submitting = useRef(false)
  const recoverCorrupt = useRef(false)

  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      if (!value.file) return
      const file = value.file

      startTransition(() =>
        dispatch({
          type: "prepare",
          file,
          recoverCorrupt: recoverCorrupt.current,
        }),
      )
    },
  })

  const [state, dispatch, pending] = useActionState(
    async function handleBackupAction(
      state: BackupState,
      action: BackupAction,
    ) {
      if (action.type === "select")
        return {
          ...state,
          message: null,
          error: null,
          confirmation: null,
        }

      if (action.type === "close") return { ...state, confirmation: null }

      if (action.type === "prepare") {
        const observed = workspace

        try {
          if (action.file.size > maxBackupBytes)
            throw new Error("Backup must be 10 MB or smaller")
          const bytes = await action.file.arrayBuffer()
          let text: string

          try {
            text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
          } catch {
            throw new Error("Backup must be a UTF-8 JSON file")
          }

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

          form.setFieldValue("file", null)

          return {
            ...state,
            error: null,
            message: "Workspace replaced from backup.",
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
    function select(file: File | null) {
      if (submitting.current) return
      form.setFieldValue("file", file)
      startTransition(() => dispatch({ type: "select" }))
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      event.stopPropagation()

      if (submitting.current) return

      submitting.current = true

      const submitter =
        event.nativeEvent instanceof SubmitEvent
          ? event.nativeEvent.submitter
          : null

      recoverCorrupt.current =
        submitter instanceof HTMLButtonElement && submitter.value === "recover"

      try {
        await form.handleSubmit()
      } finally {
        submitting.current = false
      }
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

    return { select, submit, replace, download, changeOpen }
  })

  const { message, error, confirmation } = state

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
        <CardHeader separator>
          <Heading
            id="settings-backup-title"
            render={<h2>Workspace backup</h2>}
          />
          <CardDescription>
            Download a copy or restore a saved JSON backup.
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <Stack>
            <HStack layout="spread">
              <Stack spacing="compact">
                <Heading render={<h3>Download a backup</h3>} />
                <Text size="small" tone="muted">
                  Save your full workspace as a JSON file.
                </Text>
              </Stack>
              <Button
                type="button"
                variant="outline"

                disabled={pending}
                onClick={events.download}
              >
                <DownloadIcon size={16} aria-hidden="true" /> Export backup
              </Button>
            </HStack>
            <Box variant="backupUpload">
              <Stack spacing="relaxed">
                <Stack spacing="compact">
                  <Heading render={<h3>Restore a backup</h3>} />
                  <Text size="small" tone="muted">
                    Restoring replaces tasks, projects, templates, sessions,
                    settings, and timer data. Download a copy first if needed.
                  </Text>
                </Stack>
                <form onSubmit={events.submit} noValidate>
                  <form.Subscribe selector={selectIsSubmitting}>
                    {(isSubmitting) => (
                      <form.Field name="file" validators={backupFileValidators}>
                        {(field) => (
                          <>
                            <BackupFilePicker
                              file={field.state.value}
                              disabled={pending || isSubmitting}
                              onSelect={events.select}
                              onBlur={field.handleBlur}
                            />
                            {field.state.meta.errors.length > 0 && (
                              <Text role="alert" tone="destructive">
                                {field.state.meta.errors.join(", ")}
                              </Text>
                            )}
                            {field.state.value && (
                              <BackupRestoreActions
                                disabled={pending || isSubmitting}
                              />
                            )}
                          </>
                        )}
                      </form.Field>
                    )}
                  </form.Subscribe>
                </form>
              </Stack>
            </Box>
            <BackupConfirmation
              recoverCorrupt={confirmation?.expected === null}
              pending={pending}
              error={error}
              onReplace={events.replace}
            />
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

export function BackupConfirmation({
  recoverCorrupt,
  pending,
  error,
  onReplace,
}: {
  recoverCorrupt: boolean
  pending: boolean
  error: string | null
  onReplace: () => void
}) {
  return (
    <DialogPopup>
      <DialogHeader>
        <DialogTitle>
          {recoverCorrupt ? "Recover corrupt workspace" : "Replace workspace"}
        </DialogTitle>
        <DialogDescription>
          {recoverCorrupt
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
        <DialogClose render={<Button variant="outline" disabled={pending} />}>
          Cancel
        </DialogClose>
        <Button variant="destructive" loading={pending} onClick={onReplace}>
          {recoverCorrupt ? "Recover workspace" : "Replace workspace"}
        </Button>
      </DialogFooter>
    </DialogPopup>
  )
}
