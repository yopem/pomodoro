import { localDateText } from "@/lib/local-date"

import type { Session, Settings, Workspace } from "./schema"

export interface DateRange {
  startMs: number
  endMs: number
}

export interface CsvOptions extends DateRange {
  includeTask: boolean
  unit: "minutes" | "hours"
  delimiter: "comma" | "tab"
}

export function sessionsInRange(
  sessions: readonly Session[],
  range: DateRange,
) {
  if (
    !Number.isSafeInteger(range.startMs) ||
    !Number.isSafeInteger(range.endMs) ||
    range.startMs >= range.endMs
  ) {
    throw new Error("The date range must have a valid start before its end")
  }

  return sessions.filter(
    (session) =>
      session.started_at_ms >= range.startMs &&
      session.started_at_ms < range.endMs,
  )
}

export function summarizeSessions(sessions: readonly Session[]) {
  const projects = new Map<
    string,
    { projectId: string | null; projectName: string; seconds: number }
  >()

  let totalSeconds = 0

  for (const session of sessions) {
    totalSeconds += session.duration_seconds
    const key = JSON.stringify([session.project_id, session.project_name])
    const project = projects.get(key)

    if (project) {
      project.seconds += session.duration_seconds
    } else {
      projects.set(key, {
        projectId: session.project_id,
        projectName: session.project_name,
        seconds: session.duration_seconds,
      })
    }
  }

  return { totalSeconds, projects: Array.from(projects.values()) }
}

export function localDateRange(input: {
  date: Date
  period: "day" | "week" | "month" | "year"
  weekStart: Settings["week_start"]
}): DateRange {
  const start = new Date(input.date)
  start.setHours(0, 0, 0, 0)

  if (!Number.isFinite(start.getTime())) throw new Error("Invalid date")

  if (input.period === "week") {
    const firstDay = { monday: 1, saturday: 6, sunday: 0 }[input.weekStart]

    start.setDate(start.getDate() - ((start.getDay() - firstDay + 7) % 7))
  } else if (input.period === "month") {
    start.setDate(1)
  } else if (input.period === "year") {
    start.setMonth(0, 1)
  }

  const end = new Date(start)

  if (input.period === "day") end.setDate(end.getDate() + 1)

  if (input.period === "week") end.setDate(end.getDate() + 7)

  if (input.period === "month") end.setMonth(end.getMonth() + 1)

  if (input.period === "year") end.setFullYear(end.getFullYear() + 1)

  return { startMs: start.getTime(), endMs: end.getTime() }
}

export function activityDays(sessions: readonly Session[]) {
  const days = new Set<string>()

  for (const session of sessions) {
    const date = new Date(session.started_at_ms)
    days.add(localDateText(date))
  }

  return days.size
}

export function currentStreak(input: {
  sessions: readonly Session[]
  now: Date
}) {
  const days = new Set(
    input.sessions.map((session) => {
      const date = new Date(session.started_at_ms)

      return localDateText(date)
    }),
  )

  const date = new Date(input.now)
  date.setHours(0, 0, 0, 0)

  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date")

  if (!days.has(localDateText(date))) date.setDate(date.getDate() - 1)
  let streak = 0

  while (days.has(localDateText(date))) {
    streak += 1
    date.setDate(date.getDate() - 1)
  }

  return streak
}

function csvCell(value: string, separator: string) {
  let index = 0

  while (index < value.length) {
    const char = value.charAt(index)
    const code = value.charCodeAt(index)

    if (!/\s/u.test(char) && code > 31 && code !== 127) break
    index += 1
  }

  const safe =
    "=+-@".includes(value.charAt(index)) && index < value.length
      ? `'${value}`
      : value

  return safe.includes(separator) || /["\r\n]/u.test(safe)
    ? `"${safe.replaceAll('"', '""')}"`
    : safe
}

export function exportSessionsCsv(
  sessions: readonly Session[],
  options: CsvOptions,
) {
  const separator = options.delimiter === "tab" ? "\t" : ","

  const rows: string[][] = [
    [
      "Date",
      "Project",
      ...(options.includeTask ? ["Task"] : []),
      options.unit === "hours" ? "Hours" : "Minutes",
    ],
  ]

  for (const session of sessionsInRange(sessions, options)) {
    const date = new Date(session.started_at_ms)

    if (!Number.isFinite(date.getTime()))
      throw new Error("Session date is outside the supported range")
    const dateText = localDateText(date)

    const value =
      session.duration_seconds / (options.unit === "hours" ? 3600 : 60)

    rows.push([
      dateText,
      session.project_name,
      ...(options.includeTask ? [session.task_title] : []),
      String(value),
    ])
  }

  return rows
    .map((row) => row.map((cell) => csvCell(cell, separator)).join(separator))
    .join("\r\n")
}

export function exportBackup(workspace: Workspace) {
  return JSON.stringify(workspace, null, 2)
}
