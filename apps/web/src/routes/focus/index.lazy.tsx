import { createLazyFileRoute, Link } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { FocusTimer } from "@/features/timer/components/focus-timer"
import { FocusTimerSkeleton } from "@/features/timer/components/timer-loading"

export const Route = createLazyFileRoute("/focus/")({
  component: FocusRoute,
})

export function FocusRoute() {
  const { workspace, hydrated, nowMs, error } = useFocusSnapshot(
    (state) => state,
  )

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="focus">
        <Stack spacing="page">
          <HStack layout="pageHeader">
            <Heading render={<h1>Focus timer</h1>} />
            <Button variant="ghost" size="lg" render={<Link to="/" />}>
              Return to workspace
            </Button>
          </HStack>
          {error && <Text role="alert">{error}</Text>}
          {!hydrated ? (
            <Stack aria-busy="true">
              <output aria-live="polite">Loading your workspace…</output>
              <FocusTimerSkeleton />
            </Stack>
          ) : (
            <FocusTimer workspace={workspace} nowMs={nowMs} />
          )}
        </Stack>
      </Container>
    </Box>
  )
}
