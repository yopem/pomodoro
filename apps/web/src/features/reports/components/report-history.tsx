import type { MouseEvent } from "react"

import { useNavigate } from "@tanstack/react-router"
import { PencilIcon } from "lucide-react"
import { startTransition, useActionState, useState } from "react"

import type { Session } from "@/features/focus/schema"
import type { WorkspaceOwner } from "@/features/focus/store"

import { ConfirmAction } from "@/components/confirm-action"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Text } from "@/components/ui/text"
import {
  deleteSession,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { formatFocusTime } from "@/lib/focus-time"
import { appStyles } from "@/styles/app.stylex"

const smallMutedStyles = [appStyles.small, appStyles.muted]

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const historyFormatters = {
  "12h": new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
    timeZone,
  }),
  "24h": new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
    timeZone,
  }),
}

async function removeSession(
  id: string,
  session: Session,
  owner: WorkspaceOwner,
) {
  await deleteSession({ id, expected: session }, { owner })
}

type HistoryAction =
  { kind: "edit"; id: string } | { kind: "page"; direction: number }

export function ReportHistory({
  history,
  total,
  page,
  pages,
  rangeLabel,
  hourFormat,
  onEdit,
  onOpenChange,
}: {
  history: Session[]
  total: number
  page: number
  pages: number
  rangeLabel: string
  hourFormat: "12h" | "24h"
  onEdit: (session: Session | null) => void
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate({ from: "/reports/" })
  const owner = useWorkspaceMutationOwner()

  const [error, dispatch, pending] = useActionState(
    async (_previous: string | null, action: HistoryAction) => {
      if (action.kind === "edit") {
        const session = history.find((item) => item.id === action.id)

        if (session) {
          onEdit(session)
          onOpenChange(true)
        }

        return null
      }

      try {
        await navigate({
          search: (previous) => ({
            ...previous,
            page: Math.max(1, Math.min(pages, page + action.direction)),
          }),
        })

        return null
      } catch {
        return "Could not change the history page. Try again."
      }
    },
    null,
  )

  const [events] = useState(function createHistoryEvents() {
    function edit(event: MouseEvent<HTMLButtonElement>) {
      const id = event.currentTarget.value
      startTransition(() => dispatch({ kind: "edit", id }))
    }

    function previous() {
      startTransition(() => dispatch({ kind: "page", direction: -1 }))
    }

    function next() {
      startTransition(() => dispatch({ kind: "page", direction: 1 }))
    }

    return { edit, previous, next }
  })

  return (
    <Stack xstyle={appStyles.section}>
      <Heading>Focus history</Heading>
      {history.length === 0 ? (
        <Stack xstyle={appStyles.empty}>
          <Text>No focus records in this period.</Text>
          <Text xstyle={appStyles.muted}>
            Finish a session or add focus time to start your history.
          </Text>
        </Stack>
      ) : (
        <Table>
          <TableCaption>
            Focus history for {rangeLabel}. Times use your device time zone.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Date</TableHead>
              <TableHead scope="col">Project / task</TableHead>
              <TableHead scope="col">Focus</TableHead>
              <TableHead scope="col">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  {historyFormatters[hourFormat].format(
                    new Date(session.started_at_ms),
                  )}
                </TableCell>
                <TableCell>
                  <Stack xstyle={appStyles.compact}>
                    <Text>{session.task_title}</Text>
                    <Text xstyle={smallMutedStyles}>
                      {session.project_name || "No project"}
                    </Text>
                  </Stack>
                </TableCell>
                <TableCell>
                  {formatFocusTime(session.duration_seconds)}
                </TableCell>
                <TableCell>
                  <HStack xstyle={appStyles.row}>
                    <Button
                      variant="ghost"
                      size="icon"
                      value={session.id}
                      aria-label={`Edit ${session.task_title}`}
                      onClick={events.edit}
                    >
                      <PencilIcon size={16} aria-hidden="true" />
                    </Button>
                    <ConfirmAction
                      title="Delete focus record"
                      description={`Remove ${formatFocusTime(session.duration_seconds)} of ${session.task_title} from reports. This does not change task pomodoro counts.`}
                      targetId={session.id}
                      data={session}
                      owner={owner}
                      onConfirm={removeSession}
                    >
                      Delete
                    </ConfirmAction>
                  </HStack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <HStack xstyle={appStyles.spread}>
        <Text xstyle={smallMutedStyles}>
          {total} records · Page {page} of {pages}
        </Text>
        <HStack>
          <Button
            variant="outline"
            disabled={pending || page === 1}
            onClick={events.previous}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={pending || page === pages}
            onClick={events.next}
          >
            Next
          </Button>
        </HStack>
      </HStack>
      {error && <Text role="alert">{error}</Text>}
    </Stack>
  )
}
