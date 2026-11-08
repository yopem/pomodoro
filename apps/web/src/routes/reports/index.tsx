import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useState } from "react"

import type { Session } from "@/features/focus/schema"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import {
  Dialog,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Progress } from "@/components/ui/progress"
import { Stack } from "@/components/ui/stack"
import { Stat, StatLabel, StatValue } from "@/components/ui/stat"
import { Text } from "@/components/ui/text"
import {
  activityDays,
  currentStreak,
  localDateRange,
  sessionsInRange,
  summarizeSessions,
} from "@/features/focus/reports"
import { useFocusSnapshot } from "@/features/focus/store"
import { CsvExport } from "@/features/reports/components/csv-export"
import { FocusTimeline } from "@/features/reports/components/focus-timeline"
import {
  ReportFilters,
  reportSearchSchema,
} from "@/features/reports/components/report-filters"
import { ReportHistory } from "@/features/reports/components/report-history"
import { SessionEditor } from "@/features/reports/components/session-editor"
import { formatFocusTime } from "@/lib/focus-time"
import { localDateText } from "@/lib/local-date"

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const rangeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone,
})

export const Route = createFileRoute("/reports/")({
  validateSearch: reportSearchSchema,
  head: () => ({
    meta: [
      { title: "Focus reports — Pomodoro" },
      {
        name: "description",
        content:
          "Review your focus time by day, week, month, year, and project.",
      },
    ],
  }),
  component: ReportsRoute,
})

function selectProjectSessions(
  sessions: Session[],
  project: string | undefined,
) {
  return {
    sessions,
    project,
    filtered: sessions.filter(
      (session) =>
        !project ||
        (project === "none"
          ? session.project_id === null
          : session.project_id === project),
    ),
  }
}

export function ReportsRoute() {
  const { workspace, hydrated, nowMs } = useFocusSnapshot((value) => value)
  const search = Route.useSearch()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Session | null>(null)

  const [projectSelection, setProjectSelection] = useState(() =>
    selectProjectSessions(workspace.sessions, search.project),
  )

  let selected = projectSelection

  if (
    selected.sessions !== workspace.sessions ||
    selected.project !== search.project
  ) {
    selected = selectProjectSessions(workspace.sessions, search.project)
    setProjectSelection(selected)
  }

  const [addFocus] = useState(function createAddFocus() {
    return function addFocus() {
      setEditing(null)
      setEditorOpen(true)
    }
  })

  if (!hydrated)
    return (
      <Box render={<main id="main" tabIndex={-1} />}>
        <Container variant="workspace">
          <Stack spacing="page">
            <Heading render={<h1>Reports</h1>} />
            <output>Loading your focus history…</output>
          </Stack>
        </Container>
      </Box>
    )

  const dateText = search.date ?? localDateText(new Date(nowMs))
  const anchorDate = new Date(`${dateText}T12:00:00`)

  const range = localDateRange({
    date: anchorDate,
    period: search.period,
    weekStart: workspace.settings.week_start,
  })

  const projectSessions = selected.filtered

  const sessions = sessionsInRange(projectSessions, range)
  const summary = summarizeSessions(sessions)
  const sorted = sessions.toSorted((a, b) => b.started_at_ms - a.started_at_ms)
  const pages = Math.max(1, Math.ceil(sorted.length / 20))
  const page = Math.min(search.page, pages)
  const history = sorted.slice((page - 1) * 20, page * 20)

  const projectNames = new Map(
    workspace.projects.map((project) => [project.id, project.name]),
  )

  for (const session of workspace.sessions)
    if (session.project_id && !projectNames.has(session.project_id))
      projectNames.set(
        session.project_id,
        session.project_name || "Removed project",
      )

  const rangeLabel = rangeFormatter.formatRange(
    new Date(range.startMs),
    new Date(range.endMs - 1),
  )

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="workspace">
        <Stack spacing="page">
          <HStack layout="pageHeader">
            <Stack spacing="compact">
              <Text variant="eyebrow">A record of your attention</Text>
              <Heading render={<h1>Focus reports</h1>} />
              <Text tone="muted">
                Small sessions add up. Here is your actual time.
              </Text>
            </Stack>
            <HStack layout="row">
              <CsvExport sessions={projectSessions} range={range} />
              <Button onClick={addFocus}>
                <PlusIcon size={18} aria-hidden="true" /> Add focus time
              </Button>
            </HStack>
          </HStack>
          <ReportFilters
            dateText={dateText}
            rangeLabel={rangeLabel}
            projectNames={projectNames}
            weekStart={workspace.settings.week_start}
          />
          <Box render={<section aria-label="Focus summary" />}>
            <HStack wrap>
              <ReportMetric
                label="Time focused"
                value={formatFocusTime(summary.totalSeconds)}
              />
              <ReportMetric
                label="Active days in this period"
                value={String(activityDays(sessions))}
              />
              <ReportMetric
                label="Current daily streak"
                value={`${currentStreak({ sessions: workspace.sessions, now: new Date(nowMs) })} days`}
              />
            </HStack>
          </Box>
          <Box render={<section aria-label="Focus charts" />}>
            <Grid variant="workspace">
              <Card>
                <CardPanel>
                  <Stack>
                    <Heading>Focus over time</Heading>
                    <FocusTimeline
                      sessions={sessions}
                      rangeStart={range.startMs}
                      rangeEnd={range.endMs}
                      period={search.period}
                    />
                  </Stack>
                </CardPanel>
              </Card>
              <Card>
                <CardPanel>
                  <Stack>
                    <Heading>Time by project</Heading>
                    {summary.projects.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyDescription>
                            Your first focus session will appear here.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      summary.projects.map((project) => (
                        <Stack
                          key={`${project.projectId}:${project.projectName}`}
                          spacing="compact"
                        >
                          <HStack layout="spread">
                            <Text>{project.projectName || "No project"}</Text>
                            <Text format="numeric">
                              {formatFocusTime(project.seconds)}
                            </Text>
                          </HStack>
                          <Progress
                            value={project.seconds}
                            max={Math.max(1, summary.totalSeconds)}
                            aria-label={`${project.projectName || "No project"}: ${formatFocusTime(project.seconds)}`}
                          />
                        </Stack>
                      ))
                    )}
                  </Stack>
                </CardPanel>
              </Card>
            </Grid>
          </Box>
          <ReportHistory
            history={history}
            total={sorted.length}
            page={page}
            pages={pages}
            rangeLabel={rangeLabel}
            hourFormat={workspace.settings.hour_format}
            onEdit={setEditing}
            onOpenChange={setEditorOpen}
          />
        </Stack>
      </Container>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit focus record" : "Add focus time"}
            </DialogTitle>
          </DialogHeader>
          <SessionEditor
            key={editing?.id ?? "new"}
            session={editing}
            projects={workspace.projects}
            date={dateText}
            onOpenChange={setEditorOpen}
          />
        </DialogPopup>
      </Dialog>
    </Box>
  )
}

export function ReportMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Card>
      <CardPanel>
        <Stat>
          <StatLabel>{label}</StatLabel>
          <StatValue>{value}</StatValue>
        </Stat>
      </CardPanel>
    </Card>
  )
}
