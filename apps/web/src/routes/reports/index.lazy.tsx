import { createLazyFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useState } from "react"

import type { Session } from "@/features/focus/schema"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Dialog } from "@/components/ui/dialog"
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
import { ReportFilters } from "@/features/reports/components/report-filters"
import { ReportHistory } from "@/features/reports/components/report-history"
import { SessionEditor } from "@/features/reports/components/session-editor"
import { formatFocusTime } from "@/lib/focus-time"
import { localDateText } from "@/lib/local-date"

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const rangeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone,
})

export const Route = createLazyFileRoute("/reports/")({
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

  const [editing, setEditing] = useState<{
    id: string
    session: Session | null
  } | null>(null)

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

  const [editorEvents] = useState(function createEditorEvents() {
    function addFocus() {
      setEditing({ id: crypto.randomUUID(), session: null })
    }

    function editFocus(session: Session) {
      setEditing({ id: crypto.randomUUID(), session })
    }

    function closeEditor(id: string) {
      setEditing((current) => (current?.id === id ? null : current))
    }

    function changeOpen(open: boolean) {
      if (!open) setEditing(null)
    }

    return { addFocus, editFocus, closeEditor, changeOpen }
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

  const streak = currentStreak({
    sessions: workspace.sessions,
    now: new Date(nowMs),
  })

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
              <Heading render={<h1>Focus reports</h1>} />
              <Text tone="muted">Review your focus time and history.</Text>
            </Stack>
            <HStack layout="row">
              <CsvExport sessions={projectSessions} range={range} />
              <Button onClick={editorEvents.addFocus}>
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
          <Card render={<section aria-label="Focus summary" />}>
            <CardPanel>
              <HStack layout="spread">
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
                  value={`${streak} ${streak === 1 ? "day" : "days"}`}
                />
              </HStack>
            </CardPanel>
          </Card>
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
            onEdit={editorEvents.editFocus}
          />
        </Stack>
      </Container>
      <Dialog open={editing !== null} onOpenChange={editorEvents.changeOpen}>
        {editing && (
          <SessionEditor
            key={editing.id}
            openingId={editing.id}
            session={editing.session}
            projects={workspace.projects}
            date={dateText}
            onClose={editorEvents.closeEditor}
          />
        )}
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
    <Stat>
      <StatLabel>{label}</StatLabel>
      <StatValue>{value}</StatValue>
    </Stat>
  )
}
