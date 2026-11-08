import { publicConfig } from "@pomodoro/env/client"
import { createFileRoute } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Card, CardPanel } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
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
import { FocusBrowserControls } from "@/features/timer/components/browser-focus-controls"
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

export const Route = createFileRoute("/")({
  head: () => {
    const canonical =
      publicConfig.isProduction && publicConfig.publicOrigin
        ? new URL("/", publicConfig.publicOrigin).href
        : undefined

    const description = "Plan tasks, focus in intervals, and track your time."

    return {
      meta: [
        { name: "description", content: description },
        {
          name: "robots",
          content: canonical ? "index, follow" : "noindex, nofollow",
        },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "Pomodoro — Focus timer" },
        { property: "og:description", content: description },
        ...(canonical ? [{ property: "og:url", content: canonical }] : []),
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: "Pomodoro — Focus timer" },
        { name: "twitter:description", content: description },
      ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
    }
  },
  component: TimerRoute,
})

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
          <HStack layout="pageHeader">
            <Stack spacing="compact">
              <Heading render={<h1>Focus timer</h1>} />
              <Text tone="muted">
                Work in {workspace.settings.focus_minutes}-minute intervals.
              </Text>
            </Stack>
            <FocusBrowserControls />
          </HStack>
          <Grid variant="focus">
            <Stack spacing="page">
              <FocusTimer workspace={workspace} nowMs={nowMs} />
              <Card render={<section aria-label="Today's focus summary" />}>
                <CardPanel>
                  <Grid variant="metrics">
                    <Stat>
                      <StatLabel>Focus today</StatLabel>
                      <StatValue size="compact">
                        {formatFocusTime(today)}
                      </StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>Sessions left</StatLabel>
                      <StatValue size="compact">{remaining}</StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>Estimated finish</StatLabel>
                      <StatValue size="compact">
                        {finish === null
                          ? "—"
                          : (workspace.settings.hour_format === "12h"
                              ? finishTime12
                              : finishTime24
                            ).format(finish)}
                      </StatValue>
                      <StatDescription>
                        {finish === null
                          ? "No remaining estimates"
                          : "Includes planned breaks"}
                      </StatDescription>
                    </Stat>
                  </Grid>
                </CardPanel>
              </Card>
            </Stack>
            <TaskList workspace={workspace} />
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}
