import type { MouseEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { startTransition, useActionState, useState } from "react"
import { z } from "zod"

import { DatePicker } from "@/components/date-picker"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { HStack } from "@/components/ui/hstack"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { localDateRange } from "@/features/focus/reports"
import { periodSchema, reportSearchSchema } from "@/features/reports/schema"
import { localDateText } from "@/lib/local-date"

type FilterChange =
  | { kind: "period"; value: string }
  | { kind: "date"; value: string }
  | { kind: "project"; value: string }

type FilterAction = FilterChange | { kind: "move"; direction: number }

const filterFormSchema = z.object({
  kind: z.enum(["period", "date", "project"]),
  period: periodSchema,
  date: z.iso.date(),
  project: z.union([reportSearchSchema.shape.project, z.literal("")]),
})

function selectIsSubmitting(state: { isSubmitting: boolean }) {
  return state.isSubmitting
}

function reportProjectItems(projectNames: Map<string, string>) {
  return [
    { value: "", label: "All projects" },
    { value: "none", label: "No project" },
    ...Array.from(projectNames, ([value, label]) => ({ value, label })),
  ]
}

export function ReportFilters({
  dateText,
  rangeLabel,
  projectNames,
  weekStart,
}: {
  dateText: string
  rangeLabel: string
  projectNames: Map<string, string>
  weekStart: Parameters<typeof localDateRange>[0]["weekStart"]
}) {
  const search = useSearch({ from: "/reports/" })
  const navigate = useNavigate({ from: "/reports/" })
  const projectItems = reportProjectItems(projectNames)

  async function updateReportFilter(action: FilterAction) {
    if (action.kind === "move") {
      await navigate({
        search: (previous) => {
          const range = localDateRange({
            date: new Date(`${previous.date ?? dateText}T12:00:00`),
            period: previous.period,
            weekStart,
          })

          const next = new Date(range.startMs)

          if (previous.period === "day")
            next.setDate(next.getDate() + action.direction)

          if (previous.period === "week")
            next.setDate(next.getDate() + 7 * action.direction)

          if (previous.period === "month")
            next.setMonth(next.getMonth() + action.direction)

          if (previous.period === "year")
            next.setFullYear(next.getFullYear() + action.direction)

          return { ...previous, date: localDateText(next), page: 1 }
        },
      })
    } else if (action.kind === "period") {
      const result = periodSchema.safeParse(action.value)

      if (result.success)
        await navigate({
          search: (previous) => ({
            ...previous,
            period: result.data,
            page: 1,
          }),
        })
    } else if (action.kind === "date") {
      const result = z.iso.date().safeParse(action.value)

      if (result.success)
        await navigate({
          search: (previous) => ({
            ...previous,
            date: result.data,
            page: 1,
          }),
        })
    } else {
      const result = reportSearchSchema.shape.project.safeParse(
        action.value || undefined,
      )

      if (result.success)
        await navigate({
          search: (previous) => ({
            ...previous,
            project: result.data,
            page: 1,
          }),
        })
    }
  }

  const defaults: z.input<typeof filterFormSchema> = {
    kind: "date",
    period: search.period,
    date: dateText,
    project: search.project ?? "",
  }

  const form = useForm({
    defaultValues: defaults,
    validators: { onSubmit: filterFormSchema },
    onSubmit: async ({ value }) => {
      await updateReportFilter({
        kind: value.kind,
        value: value[value.kind] ?? "",
      })
    },
  })

  const [error, dispatch, pending] = useActionState(
    async (_previous: string | null, action: FilterAction) => {
      try {
        if (action.kind === "move") {
          await updateReportFilter(action)
        } else {
          // The URL owns committed filters; each queued change gets a draft.
          form.reset({
            ...defaults,
            kind: action.kind,
            [action.kind]: action.value,
          })
          await form.handleSubmit()
        }

        return null
      } catch {
        return "Could not update the report filters. Try again."
      }
    },
    null,
  )

  const [events] = useState(function createFilterEvents() {
    function period(event: MouseEvent<HTMLButtonElement>) {
      const value = event.currentTarget.value
      startTransition(() => dispatch({ kind: "period", value }))
    }

    function date(value: string) {
      startTransition(() => dispatch({ kind: "date", value }))
    }

    function project(value: string | null) {
      if (value !== null)
        startTransition(() => dispatch({ kind: "project", value }))
    }

    function previous() {
      startTransition(() => dispatch({ kind: "move", direction: -1 }))
    }

    function next() {
      startTransition(() => dispatch({ kind: "move", direction: 1 }))
    }

    return { period, date, project, previous, next }
  })

  return (
    <form.Subscribe selector={selectIsSubmitting}>
      {(submitting) => (
        <Card render={<section aria-label="Report filters" />}>
          <CardPanel>
            <Stack>
              <HStack layout="row">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous period"
                  onClick={events.previous}
                  disabled={pending || submitting}
                >
                  <ArrowLeftIcon size={18} aria-hidden="true" />
                </Button>
                <Text>{rangeLabel}</Text>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next period"
                  onClick={events.next}
                  disabled={pending || submitting}
                >
                  <ArrowRightIcon size={18} aria-hidden="true" />
                </Button>
              </HStack>
              <HStack layout="spread">
                <form.Field name="period">
                  {(field) => (
                    <Box render={<fieldset aria-label="Report period" />}>
                      <HStack wrap>
                        {periodSchema.options.map((period) => (
                          <Button
                            key={period}
                            value={period}
                            variant={
                              search.period === period ? "default" : "ghost"
                            }
                            aria-pressed={search.period === period}
                            onClick={events.period}
                            onBlur={field.handleBlur}
                            disabled={pending || submitting}
                          >
                            {period[0]?.toUpperCase()}
                            {period.slice(1)}
                          </Button>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </form.Field>
                <HStack layout="row">
                  <form.Field name="date">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="report-date">Date</FieldLabel>
                        <DatePicker
                          id="report-date"
                          value={dateText}
                          onChange={events.date}
                          onBlur={field.handleBlur}
                          disabled={pending || submitting}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="project">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="report-project">
                          Project
                        </FieldLabel>
                        <Select
                          value={search.project ?? ""}
                          onValueChange={events.project}
                          disabled={pending || submitting}
                          items={projectItems}
                        >
                          <SelectTrigger
                            id="report-project"
                            onBlur={field.handleBlur}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectPopup>
                            <SelectItem value="">All projects</SelectItem>
                            <SelectItem value="none">No project</SelectItem>
                            {Array.from(projectNames, ([id, name]) => (
                              <SelectItem key={id} value={id}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectPopup>
                        </Select>
                      </Field>
                    )}
                  </form.Field>
                </HStack>
              </HStack>
              {error && <Text role="alert">{error}</Text>}
            </Stack>
          </CardPanel>
        </Card>
      )}
    </form.Subscribe>
  )
}
