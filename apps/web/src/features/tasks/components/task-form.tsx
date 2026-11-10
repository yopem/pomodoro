import type { ChangeEvent, FormEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { useRef, useState } from "react"
import { z } from "zod"

import type { Project, Task } from "@/features/focus/schema"

import { FieldMessages } from "@/components/field-messages"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
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
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { saveTask, useWorkspaceMutationOwner } from "@/features/focus/store"

const titleSchema = z
  .string()
  .trim()
  .min(1, "Enter a task title")
  .max(500, "Use at most 500 characters")

const noteSchema = z.string().max(10000, "Use at most 10,000 characters")

const estimateSchema = z
  .string()
  .regex(/^[0-9]+$/, "Enter a whole number")
  .refine(
    (value) => Number(value) >= 1 && Number(value) <= 10000,
    "Enter a number from 1 to 10,000",
  )

const titleValidators = { onBlur: titleSchema, onSubmit: titleSchema }

const estimateValidators = { onBlur: estimateSchema, onSubmit: estimateSchema }

const noteValidators = { onBlur: noteSchema, onSubmit: noteSchema }

function selectSubmitting(state: { isSubmitting: boolean }) {
  return state.isSubmitting
}

export function TaskForm({
  openingId,
  task,
  currentTask,
  projects,
  onClose,
}: {
  openingId: string
  task: Task | null
  currentTask: Task | undefined
  projects: Project[]
  onClose: (id: string) => void
}) {
  const owner = useWorkspaceMutationOwner()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      title: task?.title ?? "",
      note: task?.note ?? "",
      estimate: String(task?.estimate ?? 1),
      project: task?.project_id ?? "",
    },
    onSubmitInvalid: () => {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      )
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        if (task && JSON.stringify(task) !== JSON.stringify(currentTask))
          throw new Error(
            "This task changed while you were editing. Close and reopen it before saving.",
          )
        await saveTask(
          {
            expected: task,
            task: {
              id: task?.id ?? crypto.randomUUID(),
              title: value.title.trim(),
              note: value.note,
              estimate: Number(value.estimate),
              project_id: value.project || null,
              actual: task?.actual ?? 0,
              completed: task?.completed ?? false,
            },
          },
          { owner },
        )
        onClose(openingId)
        toastManager.add({
          title: task ? "Task updated" : "Task added",
          type: "success",
        })
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not save the task",
        )
      }
    },
  })

  const [events] = useState(function createTaskFormEvents() {
    function close() {
      onClose(openingId)
    }

    function changeOpen(open: boolean) {
      if (!open) close()
    }

    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      event.stopPropagation()
      void form.handleSubmit()
    }

    function changeTitle(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("title", event.currentTarget.value)
    }

    function changeEstimate(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("estimate", event.currentTarget.value)
    }

    function changeNote(event: ChangeEvent<HTMLTextAreaElement>) {
      form.setFieldValue("note", event.currentTarget.value)
    }

    function changeProject(value: string | null) {
      if (value !== null) form.setFieldValue("project", value)
    }

    return {
      close,
      changeOpen,
      submit,
      changeTitle,
      changeEstimate,
      changeNote,
      changeProject,
    }
  })

  return (
    <Dialog open onOpenChange={events.changeOpen}>
      <DialogPopup
        render={<form ref={formRef} noValidate onSubmit={events.submit} />}
      >
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>
            Plan the work and the focus intervals it may need.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Stack>
            <form.Field name="title" validators={titleValidators}>
              {(field) => {
                return (
                  <Field invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor="task-title">Task name</FieldLabel>
                    <Input
                      id="task-title"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeTitle}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length
                          ? "task-title-error"
                          : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldMessages
                        id="task-title-error"
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="estimate" validators={estimateValidators}>
              {(field) => {
                return (
                  <Field invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor="task-estimate">
                      Estimated focus sessions
                    </FieldLabel>
                    <Input
                      id="task-estimate"
                      name={field.name}
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeEstimate}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length
                          ? "task-estimate-error"
                          : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldMessages
                        id="task-estimate-error"
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="note" validators={noteValidators}>
              {(field) => {
                return (
                  <Field invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor="task-note">
                      Notes (optional)
                    </FieldLabel>
                    <Textarea
                      id="task-note"
                      name={field.name}
                      rows={3}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeNote}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length
                          ? "task-note-error"
                          : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldMessages
                        id="task-note-error"
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="project">
              {(field) => {
                const items = [
                  { value: "", label: "No project" },
                  ...projects
                    .filter(
                      (project) =>
                        !project.archived || project.id === task?.project_id,
                    )
                    .map((project) => ({
                      value: project.id,
                      label: `${project.name}${project.archived ? " (archived)" : ""}`,
                    })),
                ]

                return (
                  <Field>
                    <FieldLabel htmlFor="task-project">
                      Project (optional)
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={events.changeProject}
                    >
                      <SelectTrigger
                        id="task-project"
                        onBlur={field.handleBlur}
                      >
                        <SelectValue>
                          {items.find(
                            (item) => item.value === field.state.value,
                          )?.label ?? "No project"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectPopup>
                        {items.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                  </Field>
                )
              }}
            </form.Field>
            {error && <Text role="alert">{error}</Text>}
          </Stack>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={events.close}>
            Cancel
          </Button>
          <form.Subscribe selector={selectSubmitting}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                Save task
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
