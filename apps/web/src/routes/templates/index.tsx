import type { MouseEvent } from "react"

import { createFileRoute, Link } from "@tanstack/react-router"
import { startTransition, useActionState, useState } from "react"

import type { Template } from "@/features/focus/schema"

import { ConfirmAction } from "@/components/confirm-action"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import {
  applyTemplate,
  deleteTemplate,
  useFocusSnapshot,
} from "@/features/focus/store"
import { TemplateForm } from "@/features/templates/components/template-form"
import { appStyles } from "@/styles/app.stylex"

type TemplateAction =
  | { kind: "create"; copyTasks: boolean }
  | { kind: "edit" | "apply"; id: string }

interface TemplateFeedback {
  error: string | null
  applied: string | null
}

const initialFeedback: TemplateFeedback = { error: null, applied: null }

export const Route = createFileRoute("/templates/")({
  head: () => ({
    meta: [
      { title: "Templates — Pomodoro" },
      {
        name: "description",
        content: "Create and reuse collections of focus tasks.",
      },
    ],
  }),
  component: TemplatesRoute,
})

export function TemplatesRoute() {
  const { workspace, hydrated } = useFocusSnapshot((snapshot) => snapshot)
  const [editing, setEditing] = useState<Template | null>(null)
  const [open, setOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const [feedback, dispatch, pending] = useActionState(
    async (_previous: TemplateFeedback, action: TemplateAction) => {
      try {
        if (action.kind === "create") {
          setIsNew(true)
          setEditing({
            id: crypto.randomUUID(),
            name: "",
            tasks: action.copyTasks
              ? workspace.tasks.map(
                  ({ title, note, estimate, project_id }) => ({
                    title,
                    note,
                    estimate,
                    project_id,
                  }),
                )
              : [],
          })
          setOpen(true)

          return initialFeedback
        }

        const template = workspace.templates.find(
          (item) => item.id === action.id,
        )

        if (!template) throw new Error("The template could not be found")

        if (action.kind === "edit") {
          setIsNew(false)
          setEditing(template)
          setOpen(true)

          return initialFeedback
        }

        await applyTemplate({ id: template.id })

        return { error: null, applied: template.name }
      } catch (cause) {
        return {
          error:
            cause instanceof Error
              ? cause.message
              : "The template action could not be completed",
          applied: null,
        }
      }
    },
    initialFeedback,
  )

  const [events] = useState(function createTemplateActions() {
    function createBlank() {
      startTransition(() => dispatch({ kind: "create", copyTasks: false }))
    }

    function copyTasks() {
      startTransition(() => dispatch({ kind: "create", copyTasks: true }))
    }

    function edit(event: MouseEvent<HTMLButtonElement>) {
      const id = event.currentTarget.value
      startTransition(() => dispatch({ kind: "edit", id }))
    }

    function apply(event: MouseEvent<HTMLButtonElement>) {
      const id = event.currentTarget.value
      startTransition(() => dispatch({ kind: "apply", id }))
    }

    return { createBlank, copyTasks, edit, apply }
  })

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Stack xstyle={appStyles.page}>
        <HStack xstyle={appStyles.pageHeader}>
          <Stack xstyle={appStyles.compact}>
            <Heading render={<h1>Templates</h1>} />
            <Text xstyle={appStyles.muted}>
              Save task collections for another day.
            </Text>
          </Stack>
          <HStack xstyle={appStyles.row}>
            <Button
              disabled={!hydrated || pending}
              onClick={events.createBlank}
            >
              New template
            </Button>
            <Button
              variant="outline"
              disabled={!hydrated || pending || workspace.tasks.length === 0}
              onClick={events.copyTasks}
            >
              Copy current tasks
            </Button>
          </HStack>
        </HStack>
        {feedback.error && (
          <Text role="alert" xstyle={appStyles.error}>
            {feedback.error}
          </Text>
        )}
        {feedback.applied && (
          <output>
            Added tasks from {feedback.applied}. <Link to="/">Go to timer</Link>
          </output>
        )}
        {workspace.templates.length === 0 && (
          <Text>No templates yet. Create one to reuse a task collection.</Text>
        )}
        {workspace.templates.map((template) => (
          <Stack key={template.id} xstyle={appStyles.section}>
            <Heading render={<h2>{template.name}</h2>} />
            <Text>
              {template.tasks.length}{" "}
              {template.tasks.length === 1 ? "task" : "tasks"}
            </Text>
            <HStack xstyle={appStyles.row}>
              <Button
                disabled={!hydrated || pending}
                value={template.id}
                onClick={events.apply}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                value={template.id}
                disabled={pending}
                onClick={events.edit}
              >
                Edit
              </Button>
              <ConfirmAction
                title="Delete template"
                description={`Delete ${template.name}? Existing tasks will remain.`}
                targetId={template.id}
                data={template}
                onConfirm={removeTemplate}
              >
                Delete
              </ConfirmAction>
            </HStack>
          </Stack>
        ))}
      </Stack>
      {open && editing && (
        <TemplateForm
          template={editing}
          expected={isNew ? null : editing}
          projects={workspace.projects}
          onOpenChange={setOpen}
        />
      )}
    </Box>
  )
}

async function removeTemplate(id: string, template: Template) {
  await deleteTemplate({ id, expected: template })
}
