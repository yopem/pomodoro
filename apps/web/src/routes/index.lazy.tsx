import * as stylex from "@stylexjs/stylex"
import { createLazyFileRoute } from "@tanstack/react-router"
import { Clock3Icon, FlagIcon, TargetIcon } from "lucide-react"

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
import { useBrowserFullscreen } from "@/features/timer/hooks/use-browser-fullscreen"
import { formatFocusTime } from "@/lib/focus-time"

const styles = stylex.create({
  workspace: {
    maxInlineSize: 1280,
  },
})

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

export const Route = createLazyFileRoute("/")({
  component: TimerRoute,
})

export function TimerRoute() {
  const { workspace, hydrated, nowMs } = useFocusSnapshot((state) => state)
  const fullscreen = useBrowserFullscreen()

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
      <Container
        variant={fullscreen ? "focus" : "workspace"}
        xstyle={!fullscreen && styles.workspace}
      >
        <Stack spacing="page">
          <HStack layout="pageHeader">
            <Stack spacing="compact">
              <Text variant="eyebrow" hidden={fullscreen}>
                YOUR FOCUS WORKSPACE
              </Text>
              <Heading render={<h1>Focus timer</h1>} />
              <Text tone="muted" hidden={fullscreen}>
                One task. One {workspace.settings.focus_minutes}-minute
                interval.
              </Text>
            </Stack>
            <FocusBrowserControls />
          </HStack>
          <Grid variant={fullscreen ? "default" : "focus"}>
            <Stack spacing="page">
              <FocusTimer workspace={workspace} nowMs={nowMs} />
              <Box
                hidden={fullscreen}
                variant="dailyOverview"
                render={<section aria-label="Daily overview" />}
              >
                <Stack>
                  <HStack layout="spread">
                    <Text variant="label">Today at a glance</Text>
                    <Text size="small" tone="muted">
                      Your session plan
                    </Text>
                  </HStack>
                  <Card render={<section aria-label="Today's focus summary" />}>
                    <CardPanel>
                      <Grid variant="metrics">
                        <Stat>
                          <TargetIcon size={18} aria-hidden="true" />
                          <StatLabel>Focus today</StatLabel>
                          <StatValue size="compact">
                            {formatFocusTime(today)}
                          </StatValue>
                        </Stat>
                        <Stat>
                          <FlagIcon size={18} aria-hidden="true" />
                          <StatLabel>Sessions left</StatLabel>
                          <StatValue size="compact">{remaining}</StatValue>
                        </Stat>
                        <Stat>
                          <Clock3Icon size={18} aria-hidden="true" />
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
              </Box>
            </Stack>
            <Box hidden={fullscreen}>
              <TaskList workspace={workspace} />
            </Box>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}
