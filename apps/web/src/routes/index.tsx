import { createFileRoute } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Card, CardPanel } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import {
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
} from "@/components/ui/stat"
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
      <Box render={<main id="main" tabIndex={-1} />}>
        <Container variant="workspace">
          <Stack spacing="page">
            <Heading render={<h1>Focus timer</h1>} />
            <output>Loading your workspace…</output>
          </Stack>
        </Container>
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
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="workspace">
        <Stack spacing="page">
          <Stack spacing="compact">
            <Text variant="eyebrow">Your workspace</Text>
            <Heading render={<h1>Focus timer</h1>} />
            <Text tone="muted">Make space for the work that matters.</Text>
          </Stack>
          <Grid variant="workspace">
            <FocusTimer workspace={workspace} nowMs={nowMs} />
            <Card render={<section aria-labelledby="summary-heading" />}>
              <CardPanel render={<Stack />}>
                <Heading id="summary-heading">Today at a glance</Heading>
                <Stat>
                  <StatLabel>Focus recorded</StatLabel>
                  <StatValue>{formatFocusTime(today)}</StatValue>
                </Stat>
                <Stat>
                  <StatLabel>Remaining estimate</StatLabel>
                  <StatValue>{remaining} focus sessions</StatValue>
                </Stat>
                <Stat>
                  <StatLabel>Estimated finish</StatLabel>
                  <StatValue>
                    {finish === null
                      ? "No remaining estimates"
                      : (workspace.settings.hour_format === "12h"
                          ? finishTime12
                          : finishTime24
                        ).format(finish)}
                  </StatValue>
                  <StatDescription>
                    Assumes you continue without extra pauses.
                  </StatDescription>
                </Stat>
              </CardPanel>
            </Card>
          </Grid>
          <TaskList workspace={workspace} />
        </Stack>
      </Container>
    </Box>
  )
}
