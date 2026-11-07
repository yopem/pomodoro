import { useForm } from "@tanstack/react-form"
import { createFileRoute } from "@tanstack/react-router"
import { ArchiveIcon, FolderIcon, PencilIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { z } from "zod"

import type { Project } from "@/features/focus/schema"

import { ConfirmAction } from "@/components/confirm-action"
import { FieldMessages } from "@/components/field-messages"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { projectColorSchema } from "@/features/focus/schema"
import {
  deleteProject,
  saveProject,
  useFocusSnapshot,
} from "@/features/focus/store"
import { formatFocusTime } from "@/lib/focus-time"
import { appStyles } from "@/styles/app.stylex"

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "Projects — Pomodoro" }] }),
  component: ProjectsRoute,
})

export function ProjectsRoute() {
  const { workspace, hydrated } = useFocusSnapshot((value) => value)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function toggleArchive(project: Project) {
    setActionError(null)

    try {
      await saveProject({
        expected: project,
        project: { ...project, archived: !project.archived },
      })
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "The project could not be saved",
      )
    }
  }

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Stack xstyle={appStyles.page}>
        <HStack xstyle={appStyles.pageHeader}>
          <Stack xstyle={appStyles.compact}>
            <Text xstyle={appStyles.eyebrow}>Make room for your work</Text>
            <Heading render={<h1>Projects</h1>} />
            <Text xstyle={appStyles.muted}>See where your focus goes.</Text>
          </Stack>
          <Button
            disabled={!hydrated}
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <PlusIcon size={18} aria-hidden="true" /> Add project
          </Button>
        </HStack>
        {actionError && (
          <Text role="alert" xstyle={appStyles.error}>
            {actionError}
          </Text>
        )}
        {workspace.projects.length === 0 ? (
          <Stack xstyle={[appStyles.section, appStyles.empty]}>
            <FolderIcon size={32} aria-hidden="true" />
            <Heading>Your projects start here</Heading>
            <Text xstyle={appStyles.muted}>
              Add a project, then assign tasks to track its focus time.
            </Text>
          </Stack>
        ) : (
          <Box
            render={<section aria-label="Project list" />}
            xstyle={appStyles.grid}
          >
            {workspace.projects.map((project) => {
              const seconds = workspace.sessions.reduce(
                (total, session) =>
                  total +
                  (session.project_id === project.id
                    ? session.duration_seconds
                    : 0),
                0,
              )

              const tasks = workspace.tasks.filter(
                (task) => task.project_id === project.id && !task.completed,
              ).length

              return (
                <Stack key={project.id} xstyle={appStyles.section}>
                  <HStack xstyle={appStyles.spread}>
                    <Heading>{project.name}</Heading>
                    <Text xstyle={[appStyles.small, appStyles.muted]}>
                      {project.archived ? "Archived" : "Active"}
                    </Text>
                  </HStack>
                  <HStack xstyle={appStyles.row}>
                    <Text>{formatFocusTime(seconds)} focused</Text>
                    <Text xstyle={appStyles.muted}>
                      {tasks} open {tasks === 1 ? "task" : "tasks"}
                    </Text>
                  </HStack>
                  <HStack xstyle={appStyles.row}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(project)
                        setOpen(true)
                      }}
                    >
                      <PencilIcon size={16} aria-hidden="true" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleArchive(project)}
                    >
                      <ArchiveIcon size={16} aria-hidden="true" />{" "}
                      {project.archived ? "Restore" : "Archive"}
                    </Button>
                    <ConfirmAction
                      title="Delete project"
                      description={`Remove ${project.name} from your projects. Saved focus history will remain. Tasks will have no project.`}
                      onConfirm={() =>
                        deleteProject({
                          id: project.id,
                          expected: project,
                          expected_workspace: workspace,
                        })
                      }
                    >
                      Delete
                    </ConfirmAction>
                  </HStack>
                </Stack>
              )
            })}
          </Box>
        )}
      </Stack>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit project" : "Add project"}
            </DialogTitle>
          </DialogHeader>
          <ProjectForm
            key={editing?.id ?? "new"}
            project={editing}
            onSaved={() => setOpen(false)}
          />
        </DialogPopup>
      </Dialog>
    </Box>
  )
}

const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a project name").max(500),
  color: projectColorSchema,
})

export function ProjectForm({
  project,
  onSaved,
}: {
  project: Project | null
  onSaved: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  const defaults: Pick<Project, "name" | "color"> = {
    name: project?.name ?? "",
    color: project?.color ?? "green",
  }

  const form = useForm({
    defaultValues: defaults,
    validators: { onBlur: projectFormSchema, onSubmit: projectFormSchema },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        await saveProject({
          expected: project,
          project: {
            id: project?.id ?? crypto.randomUUID(),
            name: value.name.trim(),
            color: value.color,
            archived: project?.archived ?? false,
          },
        })
        onSaved()
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The project could not be saved",
        )
      }
    },
  })

  return (
    <Form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        const element = event.currentTarget
        await form.handleSubmit()
        element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      }}
    >
      <Stack>
        <form.Field name="name">
          {(field) => (
            <Field invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor="project-name">Project name</FieldLabel>
              <Input
                id="project-name"
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby="project-name-error"
                maxLength={500}
              />
              <FieldMessages
                id="project-name-error"
                errors={field.state.meta.errors}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="color">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="project-color">Project color</FieldLabel>
              <NativeSelect
                id="project-color"
                value={field.state.value}
                onChange={(event) => {
                  const result = projectColorSchema.safeParse(
                    event.target.value,
                  )

                  if (result.success) field.handleChange(result.data)
                }}
                onBlur={field.handleBlur}
              >
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="orange">Orange</option>
                <option value="red">Red</option>
                <option value="yellow">Yellow</option>
                <option value="gray">Gray</option>
              </NativeSelect>
            </Field>
          )}
        </form.Field>
        {error && (
          <Text role="alert" xstyle={appStyles.error}>
            {error}
          </Text>
        )}
        <HStack xstyle={appStyles.actions}>
          <Button variant="outline" onClick={onSaved}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(pending) => (
              <Button type="submit" loading={pending}>
                Save project
              </Button>
            )}
          </form.Subscribe>
        </HStack>
      </Stack>
    </Form>
  )
}
