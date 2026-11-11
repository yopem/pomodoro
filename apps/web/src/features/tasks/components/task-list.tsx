import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react"
import { startTransition, useActionState, useState } from "react"

import type { Task, Workspace } from "@/features/focus/schema"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { List } from "@/components/ui/list"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import {
  deleteTask,
  reorderTasks,
  replaceActiveWorkspace,
  saveTask,
  selectTask,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { TaskForm } from "@/features/tasks/components/task-form"
import { ConfirmAction } from "@/features/timer/components/confirm-action"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  disclosure: { marginInlineStart: "auto" },
  summary: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--muted-foreground"],
    cursor: "pointer",
    display: "flex",
    fontSize: "0.875rem",
    minBlockSize: 44,
    paddingInline: 12,
    backgroundColor: { default: "transparent", ":hover": tokens["--muted"] },
    outlineColor: tokens["--ring"],
    outlineOffset: 2,
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineWidth: 2,
  },
})

type Confirmation =
  { kind: "delete"; task: Task } | { kind: "completed" | "actual" | "all" }

interface TaskConfirmation {
  request: Confirmation
  workspace: Workspace
}

type TaskRowAction = "complete" | "select" | "edit" | "up" | "down" | "remove"

export function TaskRow({
  task,
  index,
  workspace,
  busy,
  onEdit,
  onConfirm,
}: {
  task: Task
  index: number
  workspace: Workspace
  busy: boolean
  onEdit: (task: Task) => void
  onConfirm: (confirmation: TaskConfirmation) => void
}) {
  const owner = useWorkspaceMutationOwner()
  const selectedTaskId = workspace.timer.selected_task_id
  const taskCount = workspace.tasks.length

  const [error, dispatch, pending] = useActionState(
    async (_previous: string | null, action: TaskRowAction) => {
      try {
        if (action === "complete") {
          await saveTask(
            {
              task: { ...task, completed: !task.completed },
              expected: task,
            },
            { owner },
          )
        } else if (action === "select") {
          await selectTask(
            { id: task.id === selectedTaskId ? null : task.id },
            { owner },
          )
        } else if (action === "edit") {
          onEdit(task)
        } else if (action === "remove") {
          onConfirm({ request: { kind: "delete", task }, workspace })
        } else {
          const expected = workspace.tasks.map((item) => item.id)
          const ids = [...expected]
          const destination = index + (action === "up" ? -1 : 1)
          const current = ids[index]
          const other = ids[destination]

          if (current === undefined || other === undefined) return null
          ids[index] = other
          ids[destination] = current
          await reorderTasks({ ids, expected }, { owner })
        }

        return null
      } catch (cause) {
        return cause instanceof Error
          ? cause.message
          : "The task could not be updated"
      }
    },
    null,
  )

  const [events] = useState(function createTaskRowEvents() {
    function toggleCompleted() {
      startTransition(() => dispatch("complete"))
    }

    function toggleSelected() {
      startTransition(() => dispatch("select"))
    }

    function edit() {
      startTransition(() => dispatch("edit"))
    }

    function moveUp() {
      startTransition(() => dispatch("up"))
    }

    function moveDown() {
      startTransition(() => dispatch("down"))
    }

    function remove() {
      startTransition(() => dispatch("remove"))
    }

    return { toggleCompleted, toggleSelected, edit, moveUp, moveDown, remove }
  })

  const disabled = busy || pending

  return (
    <Card render={<li />} selected={task.id === selectedTaskId}>
      <CardPanel density="compact">
        <Stack spacing="compact">
          <HStack layout="spread">
            <Box>
              <Text
                variant="label"
                tone={task.completed ? "muted" : "default"}
                decoration={task.completed ? "strike" : "none"}
              >
                {task.title}
              </Text>
              {task.id === selectedTaskId && <Text>Selected</Text>}
            </Box>
            <Text size="small">
              {task.actual} / {task.estimate} sessions
            </Text>
          </HStack>
          {task.note && <Text variant="note">{task.note}</Text>}
          <HStack layout="row">
            <Button
              variant={task.completed ? "secondary" : "outline"}
              size="icon"
              disabled={disabled}
              aria-label={`${task.completed ? "Mark incomplete" : "Complete"}: ${task.title}`}
              aria-pressed={task.completed}
              onClick={events.toggleCompleted}
            >
              <CheckIcon size={16} aria-hidden="true" />
            </Button>
            {(!task.completed || task.id === selectedTaskId) && (
              <Button
                variant={task.id === selectedTaskId ? "secondary" : "ghost"}

                disabled={disabled}
                onClick={events.toggleSelected}
              >
                {task.id === selectedTaskId ? "Deselect" : "Select"}
              </Button>
            )}
            <details {...stylex.props(styles.disclosure)}>
              <summary
                {...stylex.props(styles.summary)}
                aria-label={`Actions for ${task.title}`}
              >
                Actions
              </summary>
              <HStack layout="row">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={`Edit ${task.title}`}
                  onClick={events.edit}
                >
                  <PencilIcon size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled || index === 0}
                  aria-label={`Move ${task.title} up`}
                  onClick={events.moveUp}
                >
                  <ArrowUpIcon size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled || index === taskCount - 1}
                  aria-label={`Move ${task.title} down`}
                  onClick={events.moveDown}
                >
                  <ArrowDownIcon size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={`Delete ${task.title}`}
                  onClick={events.remove}
                >
                  <TrashIcon size={16} aria-hidden="true" />
                </Button>
              </HStack>
            </details>
          </HStack>
          {error && (
            <Text role="alert" tone="destructive">
              {error}
            </Text>
          )}
        </Stack>
      </CardPanel>
    </Card>
  )
}

export function TaskList({ workspace }: { workspace: Workspace }) {
  const owner = useWorkspaceMutationOwner()

  const [editing, setEditing] = useState<{
    id: string
    task: Task | "new"
  } | null>(null)

  const [confirmation, setConfirmation] = useState<TaskConfirmation | null>(
    null,
  )

  const [hidden, setHidden] = useState(false)
  const { tasks } = workspace

  const [error, dispatch, busy] = useActionState(
    async (
      _previous: string | null,
      action: "completed" | "actual" | "all" | "confirm",
    ) => {
      if (action !== "confirm") {
        setConfirmation({ request: { kind: action }, workspace })

        return null
      }

      if (!confirmation) return null
      const { request, workspace: original } = confirmation
      setConfirmation(null)

      try {
        if (request.kind === "delete") {
          await deleteTask(
            { id: request.task.id, expected: request.task },
            { owner },
          )
        } else {
          const next = structuredClone(original)

          if (request.kind === "actual") {
            next.tasks = next.tasks.map((task) => ({ ...task, actual: 0 }))
          } else {
            const removedIds = new Set(
              next.tasks
                .filter((task) => request.kind === "all" || task.completed)
                .map((task) => task.id),
            )

            if (
              next.timer.run_id &&
              next.timer.selected_task_id &&
              removedIds.has(next.timer.selected_task_id)
            ) {
              throw new Error("Reset or finish the selected task timer first")
            }

            next.tasks = next.tasks.filter((task) => !removedIds.has(task.id))

            if (
              next.timer.selected_task_id &&
              removedIds.has(next.timer.selected_task_id)
            )
              next.timer.selected_task_id = null
          }

          await replaceActiveWorkspace(
            { expected: original, workspace: next },
            { owner },
          )
        }

        return null
      } catch (cause) {
        return cause instanceof Error ? cause.message : "Could not update tasks"
      }
    },
    null,
  )

  const [events] = useState(function createTaskListEvents() {
    function toggleHidden() {
      setHidden((wasHidden) => !wasHidden)
    }

    function addTask() {
      setEditing({ id: crypto.randomUUID(), task: "new" })
    }

    function editTask(task: Task) {
      setEditing({ id: crypto.randomUUID(), task })
    }

    function closeEditor(id: string) {
      setEditing((current) => (current?.id === id ? null : current))
    }

    function clearCompleted() {
      startTransition(() => dispatch("completed"))
    }

    function clearActual() {
      startTransition(() => dispatch("actual"))
    }

    function clearAll() {
      startTransition(() => dispatch("all"))
    }

    function confirm() {
      startTransition(() => dispatch("confirm"))
    }

    function changeOpen(open: boolean) {
      if (!open) setConfirmation(null)
    }

    return {
      toggleHidden,
      addTask,
      editTask,
      closeEditor,
      clearCompleted,
      clearActual,
      clearAll,
      confirm,
      changeOpen,
    }
  })

  const editingTask = editing?.task === "new" ? null : editing?.task
  const request = confirmation?.request

  let description =
    "Remove all tasks from the list? Focus history stays available."

  let confirmationTitle = "Clear all tasks?"

  if (request?.kind === "delete") {
    description = `Remove “${request.task.title}” from the task list? Focus history stays available.`
    confirmationTitle = "Delete task?"
  } else if (request?.kind === "actual") {
    description =
      "Set all task actual counts to zero? Focus history stays available."
    confirmationTitle = "Clear actual counts?"
  } else if (request?.kind === "completed") {
    description =
      "Remove completed tasks from the list? Focus history stays available."
    confirmationTitle = "Clear completed tasks?"
  }

  return (
    <Box
      variant="taskQueue"
      render={<section aria-labelledby="tasks-heading" />}
    >
      <Stack>
        <HStack layout="spread">
          <Box>
            <Heading id="tasks-heading">Tasks</Heading>
          </Box>
          <HStack layout="row">
            <Button variant="ghost" onClick={events.toggleHidden}>
              {hidden ? "Show tasks" : "Hide tasks"}
            </Button>
            <Button
              variant="outline"

              disabled={busy}
              onClick={events.addTask}
            >
              <PlusIcon size={16} aria-hidden="true" /> Add task
            </Button>
          </HStack>
        </HStack>
        {error && (
          <Text role="alert" tone="destructive">
            {error}
          </Text>
        )}
        {!hidden && (
          <>
            {tasks.length === 0 ? (
              <Card>
                <Empty>
                  <EmptyHeader>
                    <EmptyDescription>
                      No tasks yet. Add one or use a template.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button variant="outline" render={<Link to="/templates" />}>
                    Browse templates
                  </Button>
                </Empty>
              </Card>
            ) : (
              <>
                <List variant="plain">
                  {tasks.map((task, index) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      index={index}
                      workspace={workspace}
                      busy={busy}
                      onEdit={events.editTask}
                      onConfirm={setConfirmation}
                    />
                  ))}
                </List>
                <HStack layout="row">
                  <Link to="/templates">Apply a template</Link>
                  <Button
                    variant="ghost"

                    disabled={busy || !tasks.some((task) => task.completed)}
                    onClick={events.clearCompleted}
                  >
                    Clear completed
                  </Button>
                  <Button
                    variant="ghost"

                    disabled={busy || !tasks.some((task) => task.actual > 0)}
                    onClick={events.clearActual}
                  >
                    Clear actual counts
                  </Button>
                  <Button
                    variant="ghost"

                    disabled={busy || !tasks.length}
                    onClick={events.clearAll}
                  >
                    Clear all tasks
                  </Button>
                </HStack>
              </>
            )}
          </>
        )}
      </Stack>
      {editing !== null && (
        <TaskForm
          key={editing.id}
          openingId={editing.id}
          task={editingTask ?? null}
          currentTask={tasks.find((task) => task.id === editingTask?.id)}
          projects={workspace.projects}
          onClose={events.closeEditor}
        />
      )}
      <ConfirmAction
        open={confirmation !== null}
        onOpenChange={events.changeOpen}
        title={confirmationTitle}
        description={description}
        action={request?.kind === "actual" ? "Clear counts" : "Remove tasks"}
        onConfirm={events.confirm}
      />
    </Box>
  )
}
