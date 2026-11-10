import type { ChangeEvent, FormEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { z } from "zod"

import type { Project, Session } from "@/features/focus/schema"

import { DatePicker } from "@/components/date-picker"
import { FieldMessages } from "@/components/field-messages"
import { Button } from "@/components/ui/button"
import {
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { HStack } from "@/components/ui/hstack"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { saveSession, useWorkspaceMutationOwner } from "@/features/focus/store"
import { localDateText } from "@/lib/local-date"

function isSubmitting(state: { isSubmitting: boolean }) {
  return state.isSubmitting
}

const entrySchema = z
  .object({
    date: z.iso.date(),
    title: z.string().trim().min(1, "Enter a task name").max(500),
    minutes: z.number().int().min(1, "Enter at least 1 minute").max(1440),
    project: z.union([z.literal(""), z.uuid()]),
    start: z.union([
      z.literal(""),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    ]),
    end: z.union([
      z.literal(""),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    ]),
  })
  .superRefine((value, context) => {
    if (value.end && (!value.start || value.end <= value.start)) {
      context.addIssue({
        code: "custom",
        path: ["end"],
        message: "End time must be after the start time on the same day",
      })
    }
  })

function sessionProjectItems(
  projects: readonly Project[],
  session: Session | null,
) {
  return [
    { value: "", label: "No project" },
    ...projects
      .values()
      .filter(
        (project) => !project.archived || project.id === session?.project_id,
      )
      .map((project) => ({ value: project.id, label: project.name }))
      .toArray(),
  ]
}

export function SessionEditor({
  openingId,
  session,
  projects,
  date,
  onClose,
}: {
  openingId: string
  session: Session | null
  projects: readonly Project[]
  date: string
  onClose: (id: string) => void
}) {
  const projectItems = sessionProjectItems(projects, session)

  const owner = useWorkspaceMutationOwner()
  const [error, setError] = useState<string | null>(null)
  const initialDate = session ? new Date(session.started_at_ms) : null

  const initialTime = initialDate
    ? `${String(initialDate.getHours()).padStart(2, "0")}:${String(initialDate.getMinutes()).padStart(2, "0")}`
    : ""

  const form = useForm({
    defaultValues: {
      date: initialDate ? localDateText(initialDate) : date,
      title: session?.task_title ?? "",
      minutes: session
        ? Math.max(1, Math.round(session.duration_seconds / 60))
        : 25,
      project: session?.project_id ?? "",
      start: initialTime,
      end: "",
    },
    validators: { onBlur: entrySchema, onSubmit: entrySchema },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        const start = new Date(`${value.date}T${value.start || "12:00"}:00`)

        if (
          !Number.isFinite(start.getTime()) ||
          localDateText(start) !== value.date
        )
          throw new Error("Enter a valid local date and time")

        if (
          value.start &&
          `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}` !==
            value.start
        )
          throw new Error("This local time does not exist in your time zone")
        const end = value.end ? new Date(`${value.date}T${value.end}:00`) : null

        const duration = end
          ? Math.round((end.getTime() - start.getTime()) / 1000)
          : value.minutes * 60

        const project = projects.find((item) => item.id === value.project)
        await saveSession(
          {
            expected: session,
            session: {
              id: session?.id ?? crypto.randomUUID(),
              task_id: session?.task_id ?? null,
              task_title: value.title.trim(),
              project_id: project?.id ?? null,
              project_name: project?.name ?? "",
              started_at_ms: start.getTime(),
              duration_seconds: duration,
              completed: session?.completed ?? false,
            },
          },
          { owner },
        )
        onClose(openingId)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The focus record could not be saved",
        )
      }
    },
  })

  const [events] = useState(function createSessionEvents() {
    async function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const element = event.currentTarget
      await form.handleSubmit()
      element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }

    function changeDate(value: string) {
      form.setFieldValue("date", value)
    }

    function changeTitle(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("title", event.currentTarget.value)
    }

    function changeProject(value: string | null) {
      if (value !== null) form.setFieldValue("project", value)
    }

    function changeStart(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("start", event.currentTarget.value)
    }

    function changeEnd(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("end", event.currentTarget.value)
    }

    function changeMinutes(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("minutes", Number(event.currentTarget.value))
    }

    function cancel() {
      onClose(openingId)
    }

    return {
      submit,
      changeDate,
      changeTitle,
      changeProject,
      changeStart,
      changeEnd,
      changeMinutes,
      cancel,
    }
  })

  return (
    <DialogPopup render={<Form noValidate onSubmit={events.submit} />}>
      <DialogHeader>
        <DialogTitle>
          {session ? "Edit focus record" : "Add focus time"}
        </DialogTitle>
      </DialogHeader>
      <DialogPanel>
        <Stack>
          <form.Field name="date">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="session-date">Date</FieldLabel>
                <DatePicker
                  id="session-date"
                  clearable
                  value={field.state.value}
                  onChange={events.changeDate}
                  onBlur={field.handleBlur}
                  invalid={field.state.meta.errors.length > 0}
                  describedBy="session-date-error"
                />
                <FieldMessages
                  id="session-date-error"
                  errors={field.state.meta.errors}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="title">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="session-title">Task name</FieldLabel>
                <Input
                  id="session-title"
                  value={field.state.value}
                  onChange={events.changeTitle}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby="session-title-error"
                  maxLength={500}
                />
                <FieldMessages
                  id="session-title-error"
                  errors={field.state.meta.errors}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="project">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="session-project">Project</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={events.changeProject}
                  items={projectItems}
                >
                  <SelectTrigger id="session-project" onBlur={field.handleBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {projectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            )}
          </form.Field>
          <HStack layout="row">
            <form.Field name="start">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="session-start">
                    Start time (optional)
                  </FieldLabel>
                  <Input
                    id="session-start"
                    type="time"
                    value={field.state.value}
                    onChange={events.changeStart}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="end">
              {(field) => (
                <Field invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor="session-end">
                    End time (optional)
                  </FieldLabel>
                  <Input
                    id="session-end"
                    type="time"
                    value={field.state.value}
                    onChange={events.changeEnd}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby="session-end-error"
                  />
                  <FieldMessages
                    id="session-end-error"
                    errors={field.state.meta.errors}
                  />
                </Field>
              )}
            </form.Field>
          </HStack>
          <form.Field name="minutes">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="session-minutes">Focus minutes</FieldLabel>
                <Input
                  id="session-minutes"
                  type="number"
                  min={1}
                  max={1440}
                  value={field.state.value}
                  onChange={events.changeMinutes}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby="session-minutes-help session-minutes-error"
                />
                <Text id="session-minutes-help" size="small" tone="muted">
                  Start and end times override minutes when both are set.
                </Text>
                <FieldMessages
                  id="session-minutes-error"
                  errors={field.state.meta.errors}
                />
              </Field>
            )}
          </form.Field>
          {error && (
            <Text role="alert" tone="destructive">
              {error}
            </Text>
          )}
        </Stack>
      </DialogPanel>
      <DialogFooter>
        <Button variant="outline" onClick={events.cancel}>
          Cancel
        </Button>
        <form.Subscribe selector={isSubmitting}>
          {(pending) => (
            <Button type="submit" loading={pending}>
              Save focus record
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </DialogPopup>
  )
}
