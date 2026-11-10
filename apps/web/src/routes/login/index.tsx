import { createFileRoute } from "@tanstack/react-router"
import { ArrowRightIcon, LockKeyholeIcon, TimerIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"

export const Route = createFileRoute("/login/")({
  head: () => ({
    meta: [
      { title: "Log in — Pomodoro" },
      {
        name: "description",
        content: "Log in to sync your Pomodoro workspace across devices.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginRoute,
})

export function LoginRoute() {
  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="workspace">
        <Box variant="loginLayout">
          <Box
            variant="loginStory"
            render={<aside aria-label="About Pomodoro" />}
          >
            <HStack>
              <Box variant="loginMark">
                <TimerIcon size={28} aria-hidden="true" />
              </Box>
              <Text variant="label">Pomodoro</Text>
            </HStack>
            <Stack spacing="relaxed">
              <Text variant="statement">{"One task.\nOne interval."}</Text>
              <Text tone="muted">
                Plan your tasks, focus in intervals, and keep track of the time
                you put in.
              </Text>
            </Stack>
            <Text size="small" tone="muted">
              Your tasks and focus history, together.
            </Text>
          </Box>
          <Box
            variant="loginPanel"
            render={<section aria-labelledby="login-heading" />}
          >
            <Stack spacing="compact">
              <Text variant="eyebrow">Your workspace</Text>
              <Heading
                id="login-heading"
                render={<h1>Log in to Pomodoro</h1>}
              />
              <Text tone="muted">
                Pick up where you left off. Sync your tasks and focus history
                across devices.
              </Text>
            </Stack>
            <Stack spacing="relaxed">
              <form action="/auth/login" method="get">
                <Grid>
                  <Button size="xl" type="submit">
                    Continue with Yopem{" "}
                    <ArrowRightIcon size={18} aria-hidden="true" />
                  </Button>
                </Grid>
              </form>
              <HStack>
                <LockKeyholeIcon size={16} aria-hidden="true" />
                <Text size="small" tone="muted">
                  Sign in on Yopem. We’ll bring you back here when you’re done.
                </Text>
              </HStack>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
