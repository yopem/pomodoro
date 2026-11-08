import type { ChangeEvent, MouseEvent } from "react"

import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { startTransition, useActionState, useState } from "react"
import { z } from "zod"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { HStack } from "@/components/ui/hstack"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Text } from "@/components/ui/text"
import { localDateRange } from "@/features/focus/reports"
import { localDateText } from "@/lib/local-date"

export const periodSchema = z.enum(["day", "week", "month", "year"])

export const reportSearchSchema = z.object({
  period: periodSchema.default("week"),
  date: z.iso.date().optional(),
  project: z.union([z.uuid(), z.literal("none")]).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
})

type FilterAction =
  | { kind: "period"; value: string }
  | { kind: "date"; value: string }
  | { kind: "project"; value: string }
  | { kind: "move"; direction: number }

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

  const [error, dispatch, pending] = useActionState(
    async (_previous: string | null, action: FilterAction) => {
      try {
        if (action.kind === "move") {
          const range = localDateRange({
            date: new Date(`${search.date ?? dateText}T12:00:00`),
            period: search.period,
            weekStart,
          })

          const next = new Date(range.startMs)

          if (search.period === "day")
            next.setDate(next.getDate() + action.direction)

          if (search.period === "week")
            next.setDate(next.getDate() + 7 * action.direction)

          if (search.period === "month")
            next.setMonth(next.getMonth() + action.direction)

          if (search.period === "year")
            next.setFullYear(next.getFullYear() + action.direction)
          await navigate({
            search: (previous) => ({
              ...previous,
              date: localDateText(next),
              page: 1,
            }),
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

    function date(event: ChangeEvent<HTMLInputElement>) {
      const value = event.currentTarget.value
      startTransition(() => dispatch({ kind: "date", value }))
    }

    function project(event: ChangeEvent<HTMLSelectElement>) {
      const value = event.currentTarget.value
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
    <>
      <HStack layout="spread">
        <Box render={<fieldset aria-label="Report period" />}>
          <HStack wrap>
            {periodSchema.options.map((period) => (
              <Button
                key={period}
                value={period}
                variant={search.period === period ? "default" : "ghost"}
                aria-pressed={search.period === period}
                onClick={events.period}
                disabled={pending}
              >
                {period[0]?.toUpperCase()}
                {period.slice(1)}
              </Button>
            ))}
          </HStack>
        </Box>
        <HStack layout="row">
          <Field>
            <FieldLabel htmlFor="report-date">Date</FieldLabel>
            <Input
              id="report-date"
              type="date"
              value={dateText}
              onChange={events.date}
              disabled={pending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="report-project">Project</FieldLabel>
            <NativeSelect
              id="report-project"
              value={search.project ?? ""}
              onChange={events.project}
              disabled={pending}
            >
              <option value="">All projects</option>
              <option value="none">No project</option>
              {Array.from(projectNames, ([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </HStack>
      </HStack>
      <HStack layout="spread">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous period"
          onClick={events.previous}
          disabled={pending}
        >
          <ArrowLeftIcon size={18} aria-hidden="true" />
        </Button>
        <Text>{rangeLabel}</Text>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next period"
          onClick={events.next}
          disabled={pending}
        >
          <ArrowRightIcon size={18} aria-hidden="true" />
        </Button>
      </HStack>
      {error && <Text role="alert">{error}</Text>}
    </>
  )
}
