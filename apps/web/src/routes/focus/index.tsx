import { createFileRoute, Link } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { FocusTimer } from "@/features/timer/components/focus-timer"

export const Route = createFileRoute("/focus/")({
  head: () => ({
    meta: [
      { name: "description", content: "Use the timer in a small window." },
    ],
  }),
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
            <Button variant="ghost" size="xl" render={<Link to="/" />}>
              Return to workspace
            </Button>
          </HStack>
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
