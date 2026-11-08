import { createFileRoute, Link } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Container } from "@/components/ui/container"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { FocusTimer } from "@/features/timer/components/focus-timer"

export const Route = createFileRoute("/focus/")({
  head: () => ({ meta: [{ title: "Focus — Pomodoro" }] }),
  component: FocusRoute,
})

export function FocusRoute() {
  const { workspace, hydrated, nowMs, error } = useFocusSnapshot(
    (state) => state,
  )

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="workspace">
        <Stack spacing="page">
          <Heading render={<h1>Focus timer</h1>} />
          <Link to="/">Return to workspace</Link>
          {error && <Text role="alert">{error}</Text>}
          {!hydrated ? (
            <output>Loading your workspace…</output>
          ) : (
            <FocusTimer workspace={workspace} nowMs={nowMs} />
          )}
        </Stack>
      </Container>
    </Box>
  )
}
