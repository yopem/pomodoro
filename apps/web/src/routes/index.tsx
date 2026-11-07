import { createFileRoute } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { estimateFinish } from "@/features/focus/estimate"
import {
  localDateRange,
  sessionsInRange,
  summarizeSessions,
} from "@/features/focus/reports"
import { useFocusSnapshot } from "@/features/focus/store"
import { TaskList } from "@/features/tasks/components/task-list"
import { FocusTimer } from "@/features/timer/components/focus-timer"
import { formatFocusTime } from "@/lib/focus-time"
import { appStyles } from "@/styles/app.stylex"

const finishTime12 = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
})

const finishTime24 = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
})

export const Route = createFileRoute("/")({ component: TimerRoute })

export function TimerRoute() {
  const { workspace, hydrated, nowMs } = useFocusSnapshot((state) => state)

  if (!hydrated) {
    return (
      <Box render={<main id="main" />}>
        <Stack xstyle={appStyles.page}>
          <Heading render={<h1>Focus timer</h1>} />
          <Box render={<output>Loading your workspace…</output>} />
        </Stack>
      </Box>
    )
  }

  const finish = estimateFinish({ workspace, nowMs })

  const range = localDateRange({
    date: new Date(nowMs),
    period: "day",
    weekStart: workspace.settings.week_start,
  })

  const today = summarizeSessions(
    sessionsInRange(workspace.sessions, range),
  ).totalSeconds

  const remaining = workspace.tasks
    .filter((task) => !task.completed)
    .reduce(
      (total, task) => total + Math.max(0, task.estimate - task.actual),
      0,
    )

  return (
    <Box render={<main id="main" />}>
      <Stack xstyle={appStyles.page}>
        <Box>
          <Text xstyle={appStyles.eyebrow}>Your workspace</Text>
          <Heading render={<h1>Focus timer</h1>} />
          <Text xstyle={appStyles.muted}>
            Make space for the work that matters.
          </Text>
        </Box>
        <Box xstyle={appStyles.grid}>
          <FocusTimer workspace={workspace} nowMs={nowMs} />
          <Box
            render={<section aria-labelledby="summary-heading" />}
            xstyle={appStyles.section}
          >
            <Stack>
              <Heading id="summary-heading">Today at a glance</Heading>
              <Box>
                <Text xstyle={appStyles.eyebrow}>Focus recorded</Text>
                <Text>{formatFocusTime(today)}</Text>
              </Box>
              <Box>
                <Text xstyle={appStyles.eyebrow}>Remaining estimate</Text>
                <Text>{remaining} focus sessions</Text>
              </Box>
              <Box>
                <Text xstyle={appStyles.eyebrow}>Estimated finish</Text>
                <Text>
                  {finish === null
                    ? "No remaining estimates"
                    : (workspace.settings.hour_format === "12h"
                        ? finishTime12
                        : finishTime24
                      ).format(finish)}
                </Text>
                <Text xstyle={appStyles.muted}>
                  Assumes you continue without extra pauses.
                </Text>
              </Box>
            </Stack>
          </Box>
        </Box>
        <TaskList workspace={workspace} />
      </Stack>
    </Box>
  )
}
