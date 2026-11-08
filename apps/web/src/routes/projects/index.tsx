import type { ChangeEvent, FormEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { createFileRoute } from "@tanstack/react-router"
import { ArchiveIcon, FolderIcon, PencilIcon, PlusIcon } from "lucide-react"
import { startTransition, useActionState, useState } from "react"
import { z } from "zod"

import type { Project, Workspace } from "@/features/focus/schema"
import type { WorkspaceOwner } from "@/features/focus/store"

import { ConfirmAction } from "@/components/confirm-action"
import { FieldMessages } from "@/components/field-messages"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import {
  Dialog,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { ColorIndicator } from "@/features/focus/color-indicator"
import { projectColorSchema } from "@/features/focus/schema"
import {
  deleteProject,
  saveProject,
  useFocusSnapshot,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { formatFocusTime } from "@/lib/focus-time"

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Pomodoro" },
      { name: "description", content: "Organize focus tasks by project." },
    ],
  }),
  component: ProjectsRoute,
})

export function ProjectsRoute() {
  const { workspace, hydrated } = useFocusSnapshot((value) => value)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const [events] = useState(function createProjectEvents() {
    function add() {
      setEditing(null)
      setOpen(true)
    }

    function close() {
      setOpen(false)
    }

    return { add, close }
  })

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="workspace">
        <Stack spacing="page">
          <HStack layout="pageHeader">
            <Stack spacing="compact">
              <Text variant="eyebrow">Make room for your work</Text>
              <Heading render={<h1>Projects</h1>} />
              <Text tone="muted">See where your focus goes.</Text>
            </Stack>
            <Button disabled={!hydrated} onClick={events.add}>
              <PlusIcon size={18} aria-hidden="true" /> Add project
            </Button>
          </HStack>
          {workspace.projects.length === 0 ? (
            <Card>
              <CardPanel>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <FolderIcon size={32} aria-hidden="true" />
                    </EmptyMedia>
                    <Heading>Your projects start here</Heading>
                    <EmptyDescription>
                      Add a project, then assign tasks to track its focus time.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardPanel>
            </Card>
          ) : (
            <Box render={<section aria-label="Project list" />}>
              <Grid variant="workspace">
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
                    <ProjectCard
                      key={project.id}
                      project={project}
                      workspace={workspace}
                      seconds={seconds}
                      tasks={tasks}
                      onEdit={setEditing}
                      onOpenChange={setOpen}
                    />
                  )
                })}
              </Grid>
            </Box>
          )}
        </Stack>
      </Container>
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
            onSaved={events.close}
          />
        </DialogPopup>
      </Dialog>
    </Box>
  )
}

async function removeProject(
  id: string,
  workspace: Workspace,
  owner: WorkspaceOwner,
) {
  const expected = workspace.projects.find((project) => project.id === id)

  if (!expected) throw new Error("The project could not be found")

  await deleteProject(
    { id, expected, expected_workspace: workspace },
    { owner },
  )
}

export function ProjectCard({
  project,
  workspace,
  seconds,
  tasks,
  onEdit,
  onOpenChange,
}: {
  project: Project
  workspace: Workspace
  seconds: number
  tasks: number
  onEdit: (project: Project) => void
  onOpenChange: (open: boolean) => void
}) {
  const owner = useWorkspaceMutationOwner()

  const [error, dispatch, pending] = useActionState(
    async (_previous: string | null, action: "edit" | "archive") => {
      if (action === "edit") {
        onEdit(project)
        onOpenChange(true)

        return null
      }

      try {
        await saveProject(
          {
            expected: project,
            project: { ...project, archived: !project.archived },
          },
          { owner },
        )

        return null
      } catch (cause) {
        return cause instanceof Error
          ? cause.message
          : "The project could not be saved"
      }
    },
    null,
  )

  const [events] = useState(function createProjectCardEvents() {
    function edit() {
      startTransition(() => dispatch("edit"))
    }

    function archive() {
      startTransition(() => dispatch("archive"))
    }

    return { edit, archive }
  })

  return (
    <Card>
      <CardPanel render={<Stack />}>
        <HStack layout="spread">
          <Heading>{project.name}</Heading>
          <Text size="small" tone="muted">
            {project.archived ? "Archived" : "Active"}
          </Text>
        </HStack>
        <HStack layout="row">
          <ColorIndicator color={project.color} />
          <Text>{project.color}</Text>
        </HStack>
        <HStack layout="row">
          <Text>{formatFocusTime(seconds)} focused</Text>
          <Text tone="muted">
            {tasks} open {tasks === 1 ? "task" : "tasks"}
          </Text>
        </HStack>
        <HStack layout="row">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={events.edit}
          >
            <PencilIcon size={16} aria-hidden="true" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={events.archive}
          >
            <ArchiveIcon size={16} aria-hidden="true" />{" "}
            {project.archived ? "Restore" : "Archive"}
          </Button>
          <ConfirmAction
            title="Delete project"
            description={`Remove ${project.name} from your projects. Saved focus history will remain. Tasks will have no project.`}
            targetId={project.id}
            data={workspace}
            owner={owner}
            onConfirm={removeProject}
          >
            Delete
          </ConfirmAction>
        </HStack>
        {error && (
          <Text role="alert" tone="destructive">
            {error}
          </Text>
        )}
      </CardPanel>
    </Card>
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
  const owner = useWorkspaceMutationOwner()
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
        await saveProject(
          {
            expected: project,
            project: {
              id: project?.id ?? crypto.randomUUID(),
              name: value.name.trim(),
              color: value.color,
              archived: project?.archived ?? false,
            },
          },
          { owner },
        )
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

  const [events] = useState(function createProjectFormEvents() {
    async function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const element = event.currentTarget
      await form.handleSubmit()
      element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }

    function changeName(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("name", event.currentTarget.value)
    }

    function changeColor(event: ChangeEvent<HTMLSelectElement>) {
      const result = projectColorSchema.safeParse(event.currentTarget.value)

      if (result.success) form.setFieldValue("color", result.data)
    }

    function cancel() {
      onSaved()
    }

    return { submit, changeName, changeColor, cancel }
  })

  return (
    <Form noValidate onSubmit={events.submit}>
      <Stack>
        <form.Field name="name">
          {(field) => (
            <Field invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor="project-name">Project name</FieldLabel>
              <Input
                id="project-name"
                name={field.name}
                value={field.state.value}
                onChange={events.changeName}
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
                onChange={events.changeColor}
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
          <Text role="alert" tone="destructive">
            {error}
          </Text>
        )}
        <HStack layout="actions">
          <Button variant="outline" onClick={events.cancel}>
            Cancel
          </Button>
          <form.Subscribe>
            {(state) => (
              <Button type="submit" loading={state.isSubmitting}>
                Save project
              </Button>
            )}
          </form.Subscribe>
        </HStack>
      </Stack>
    </Form>
  )
}
