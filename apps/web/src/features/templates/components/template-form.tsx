import type { ChangeEvent, FormEvent, MouseEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { useRef, useState } from "react"
import { z } from "zod"

import type { Project, Template } from "@/features/focus/schema"

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
import { NativeSelect } from "@/components/ui/native-select"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { Textarea } from "@/components/ui/textarea"
import { saveTemplate } from "@/features/focus/store"

const nameSchema = z.string().trim().min(1, "Enter a name").max(500)

const noteSchema = z.string().max(10000)

const estimateSchema = z.number().int().min(1).max(10000)

const nameValidators = { onBlur: nameSchema, onSubmit: nameSchema }

const noteValidators = { onBlur: noteSchema, onSubmit: noteSchema }

const estimateValidators = { onBlur: estimateSchema, onSubmit: estimateSchema }

interface TemplateFormProps {
  template: Template
  projects: Project[]
  expected: Template | null
  onOpenChange: (open: boolean) => void
}

export function useTemplateForm({
  template,
  expected,
  onOpenChange,
}: Pick<TemplateFormProps, "template" | "expected" | "onOpenChange">) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)

  const [taskKeys, setTaskKeys] = useState(() =>
    template.tasks.map(() => crypto.randomUUID()),
  )

  const form = useForm({
    defaultValues: template,
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
        await saveTemplate({ template: value, expected })
        onOpenChange(false)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not save the template",
        )
      }
    },
  })

  const [events] = useState(function createTemplateEvents() {
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      void form.handleSubmit()
    }

    function changeName(event: ChangeEvent<HTMLInputElement>) {
      form.setFieldValue("name", event.currentTarget.value)
    }

    function changeTaskText(
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) {
      const match = /^template-task-(\d+)-(title|note)$/.exec(
        event.currentTarget.id,
      )

      if (!match) return

      const index = Number(match[1])

      if (match[2] === "title")
        form.setFieldValue(`tasks[${index}].title`, event.currentTarget.value)
      else form.setFieldValue(`tasks[${index}].note`, event.currentTarget.value)
    }

    function changeEstimate(event: ChangeEvent<HTMLInputElement>) {
      const match = /^template-task-(\d+)-estimate$/.exec(
        event.currentTarget.id,
      )

      if (match)
        form.setFieldValue(
          `tasks[${Number(match[1])}].estimate`,
          event.currentTarget.valueAsNumber,
        )
    }

    function changeProject(event: ChangeEvent<HTMLSelectElement>) {
      const match = /^template-task-(\d+)-project$/.exec(event.currentTarget.id)

      if (match)
        form.setFieldValue(
          `tasks[${Number(match[1])}].project_id`,
          event.currentTarget.value || null,
        )
    }

    function removeTask(event: MouseEvent<HTMLButtonElement>) {
      const index = Number(event.currentTarget.value)
      setTaskKeys((keys) => keys.filter((_, itemIndex) => itemIndex !== index))
      void form.removeFieldValue("tasks", index)
    }

    function addTask() {
      setTaskKeys((keys) => [...keys, crypto.randomUUID()])
      form.pushFieldValue("tasks", {
        title: "",
        note: "",
        estimate: 1,
        project_id: null,
      })
    }

    function cancel() {
      onOpenChange(false)
    }

    return {
      cancel,
      submit,
      changeName,
      changeTaskText,
      changeEstimate,
      changeProject,
      removeTask,
      addTask,
    }
  })

  return { form, events, formRef, error, taskKeys }
}

export function TemplateForm(props: TemplateFormProps) {
  const { form, events, formRef, error, taskKeys } = useTemplateForm(props)
  const { projects, onOpenChange } = props

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Template</DialogTitle>
          <DialogDescription>
            Save a named collection of tasks.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} noValidate onSubmit={events.submit}>
          <DialogPanel>
            <Stack>
              <form.Field name="name" validators={nameValidators}>
                {(field) => (
                  <Field invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor="template-name">
                      Template name
                    </FieldLabel>
                    <Input
                      id="template-name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeName}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length
                          ? "template-name-error"
                          : undefined
                      }
                    />
                    <FieldMessages
                      id="template-name-error"
                      errors={field.state.meta.errors}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="tasks" mode="array">
                {(tasks) => (
                  <Stack>
                    {tasks.state.value.map((_, index) => (
                      <fieldset key={taskKeys[index]}>
                        <legend>Task {index + 1}</legend>
                        <Stack>
                          <form.Field
                            name={`tasks[${index}].title`}
                            validators={nameValidators}
                          >
                            {(field) => (
                              <Field
                                invalid={field.state.meta.errors.length > 0}
                              >
                                <FieldLabel
                                  htmlFor={`template-task-${index}-title`}
                                >
                                  Task {index + 1} title
                                </FieldLabel>
                                <Input
                                  id={`template-task-${index}-title`}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={events.changeTaskText}
                                  aria-invalid={
                                    field.state.meta.errors.length > 0
                                  }
                                  aria-describedby={
                                    field.state.meta.errors.length
                                      ? `template-task-${index}-title-error`
                                      : undefined
                                  }
                                />
                                <FieldMessages
                                  id={`template-task-${index}-title-error`}
                                  errors={field.state.meta.errors}
                                />
                              </Field>
                            )}
                          </form.Field>
                          <form.Field
                            name={`tasks[${index}].note`}
                            validators={noteValidators}
                          >
                            {(field) => (
                              <Field
                                invalid={field.state.meta.errors.length > 0}
                              >
                                <FieldLabel
                                  htmlFor={`template-task-${index}-note`}
                                >
                                  Task {index + 1} note
                                </FieldLabel>
                                <Textarea
                                  id={`template-task-${index}-note`}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={events.changeTaskText}
                                  aria-invalid={
                                    field.state.meta.errors.length > 0
                                  }
                                  aria-describedby={
                                    field.state.meta.errors.length
                                      ? `template-task-${index}-note-error`
                                      : undefined
                                  }
                                />
                                <FieldMessages
                                  id={`template-task-${index}-note-error`}
                                  errors={field.state.meta.errors}
                                />
                              </Field>
                            )}
                          </form.Field>
                          <form.Field
                            name={`tasks[${index}].estimate`}
                            validators={estimateValidators}
                          >
                            {(field) => (
                              <Field
                                invalid={field.state.meta.errors.length > 0}
                              >
                                <FieldLabel
                                  htmlFor={`template-task-${index}-estimate`}
                                >
                                  Task {index + 1} estimated sessions
                                </FieldLabel>
                                <Input
                                  id={`template-task-${index}-estimate`}
                                  type="number"
                                  min={1}
                                  max={10000}
                                  value={
                                    Number.isNaN(field.state.value)
                                      ? ""
                                      : field.state.value
                                  }
                                  onBlur={field.handleBlur}
                                  onChange={events.changeEstimate}
                                  aria-invalid={
                                    field.state.meta.errors.length > 0
                                  }
                                  aria-describedby={
                                    field.state.meta.errors.length
                                      ? `template-task-${index}-estimate-error`
                                      : undefined
                                  }
                                />
                                <FieldMessages
                                  id={`template-task-${index}-estimate-error`}
                                  errors={field.state.meta.errors}
                                />
                              </Field>
                            )}
                          </form.Field>
                          <form.Field name={`tasks[${index}].project_id`}>
                            {(field) => (
                              <Field>
                                <FieldLabel
                                  htmlFor={`template-task-${index}-project`}
                                >
                                  Task {index + 1} project
                                </FieldLabel>
                                <NativeSelect
                                  id={`template-task-${index}-project`}
                                  value={field.state.value ?? ""}
                                  onBlur={field.handleBlur}
                                  onChange={events.changeProject}
                                >
                                  <option value="">No project</option>
                                  {projects
                                    .filter((project) => !project.archived)
                                    .map((project) => (
                                      <option
                                        key={project.id}
                                        value={project.id}
                                      >
                                        {project.name}
                                      </option>
                                    ))}
                                </NativeSelect>
                              </Field>
                            )}
                          </form.Field>
                          <Button
                            type="button"
                            variant="outline"
                            value={index}
                            onClick={events.removeTask}
                          >
                            Remove task {index + 1}
                          </Button>
                        </Stack>
                      </fieldset>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={events.addTask}
                    >
                      Add task
                    </Button>
                  </Stack>
                )}
              </form.Field>
              {error && <Text role="alert">{error}</Text>}
            </Stack>
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={events.cancel}>
              Cancel
            </Button>
            <form.Subscribe>
              {(state) => (
                <Button type="submit" loading={state.isSubmitting}>
                  Save template
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
