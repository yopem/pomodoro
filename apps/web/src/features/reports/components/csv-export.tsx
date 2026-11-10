import type { FormEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { DownloadIcon } from "lucide-react"
import { useState } from "react"
import { z } from "zod"

import type { DateRange } from "@/features/focus/reports"
import type { Session } from "@/features/focus/schema"

import { DatePicker } from "@/components/date-picker"
import { FieldMessages } from "@/components/field-messages"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Stack } from "@/components/ui/stack"
import { Switch } from "@/components/ui/switch"
import { Text } from "@/components/ui/text"
import { exportSessionsCsv } from "@/features/focus/reports"
import { downloadText } from "@/lib/download"
import { localDateText } from "@/lib/local-date"

const unitItems = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
]

const delimiterItems = [
  { value: "comma", label: "Comma" },
  { value: "tab", label: "Tab" },
]

const exportSchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
    includeTask: z.boolean(),
    unit: z.enum(["minutes", "hours"]),
    delimiter: z.enum(["comma", "tab"]),
  })
  .refine((value) => value.from <= value.to, {
    path: ["to"],
    message: "Choose an end date on or after the start date",
  })

export function CsvExport({
  sessions,
  range,
}: {
  sessions: readonly Session[]
  range: DateRange
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <DownloadIcon size={18} aria-hidden="true" /> Download report
      </DialogTrigger>
      {open && (
        <CsvExportForm
          sessions={sessions}
          range={range}
          onOpenChange={setOpen}
        />
      )}
    </Dialog>
  )
}

export function CsvExportForm({
  sessions,
  range,
  onOpenChange,
}: {
  sessions: readonly Session[]
  range: DateRange
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null)

  const defaults: z.infer<typeof exportSchema> = {
    from: localDateText(new Date(range.startMs)),
    to: localDateText(new Date(range.endMs - 1)),
    includeTask: true,
    unit: "minutes",
    delimiter: "comma",
  }

  const form = useForm({
    defaultValues: defaults,
    validators: { onBlur: exportSchema, onSubmit: exportSchema },
    onSubmit: ({ value }) => {
      setError(null)

      try {
        const start = new Date(`${value.from}T00:00:00`)
        const end = new Date(`${value.to}T00:00:00`)
        end.setDate(end.getDate() + 1)

        const content = exportSessionsCsv(sessions, {
          startMs: start.getTime(),
          endMs: end.getTime(),
          includeTask: value.includeTask,
          unit: value.unit,
          delimiter: value.delimiter,
        })

        downloadText({
          content: `\uFEFF${content}`,
          filename: `focus-${value.from}-${value.to}.csv`,
          contentType: "text/csv;charset=utf-8",
        })
        onOpenChange(false)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The report could not be downloaded",
        )
      }
    },
  })

  const [events] = useState(function createExportEvents() {
    async function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const element = event.currentTarget
      await form.handleSubmit()
      element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }

    function changeFrom(value: string) {
      form.setFieldValue("from", value)
    }

    function changeTo(value: string) {
      form.setFieldValue("to", value)
    }

    function changeUnit(value: string | null) {
      if (value === null) return
      form.setFieldValue("unit", value === "hours" ? "hours" : "minutes")
    }

    function changeDelimiter(value: string | null) {
      if (value === null) return
      form.setFieldValue("delimiter", value === "tab" ? "tab" : "comma")
    }

    function cancel() {
      onOpenChange(false)
    }

    return { submit, changeFrom, changeTo, changeUnit, changeDelimiter, cancel }
  })

  return (
    <DialogPopup render={<Form noValidate onSubmit={events.submit} />}>
      <DialogHeader>
        <DialogTitle>Download focus report</DialogTitle>
      </DialogHeader>
      <DialogPanel>
        <Stack>
          <form.Field name="from">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="export-from">From</FieldLabel>
                <DatePicker
                  id="export-from"
                  clearable
                  value={field.state.value}
                  onChange={events.changeFrom}
                  onBlur={field.handleBlur}
                  invalid={field.state.meta.errors.length > 0}
                  describedBy="export-from-error"
                />
                <FieldMessages
                  id="export-from-error"
                  errors={field.state.meta.errors}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="to">
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="export-to">Through</FieldLabel>
                <DatePicker
                  id="export-to"
                  clearable
                  value={field.state.value}
                  onChange={events.changeTo}
                  onBlur={field.handleBlur}
                  invalid={field.state.meta.errors.length > 0}
                  describedBy="export-to-error"
                />
                <FieldMessages
                  id="export-to-error"
                  errors={field.state.meta.errors}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="includeTask">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="export-task">
                  Include task names
                </FieldLabel>
                <Switch
                  id="export-task"
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="unit">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="export-unit">Focus time unit</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={events.changeUnit}
                  items={unitItems}
                >
                  <SelectTrigger id="export-unit" onBlur={field.handleBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectPopup>
                </Select>
              </Field>
            )}
          </form.Field>
          <form.Field name="delimiter">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="export-delimiter">Delimiter</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={events.changeDelimiter}
                  items={delimiterItems}
                >
                  <SelectTrigger
                    id="export-delimiter"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="comma">Comma</SelectItem>
                    <SelectItem value="tab">Tab</SelectItem>
                  </SelectPopup>
                </Select>
              </Field>
            )}
          </form.Field>
          <Text size="small" tone="muted">
            Exports use your local dates and the current project filter.
            Spreadsheet formulas in names are escaped.
          </Text>
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
        <Button type="submit">Download CSV</Button>
      </DialogFooter>
    </DialogPopup>
  )
}
