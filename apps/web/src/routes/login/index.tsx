import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon, ArrowRightIcon, TimerIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardPanel } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Heading } from "@/components/ui/heading"
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
      <Container variant="focus">
        <Stack spacing="page">
          <Button variant="ghost" render={<Link to="/" />}>
            <ArrowLeftIcon size={16} aria-hidden="true" /> Back to timer
          </Button>
          <Card>
            <CardHeader>
              <Stack spacing="relaxed">
                <TimerIcon size={32} aria-hidden="true" />
                <Stack spacing="compact">
                  <Text variant="eyebrow">Your Pomodoro workspace</Text>
                  <Heading render={<h1>Log in to Pomodoro</h1>} />
                  <Text tone="muted">
                    Keep your tasks and focus history in sync across devices.
                  </Text>
                </Stack>
              </Stack>
            </CardHeader>
            <CardPanel>
              <Stack spacing="relaxed">
                <form action="/auth/login" method="get">
                  <Button size="xl" type="submit">
                    Continue to sign in
                    <ArrowRightIcon size={16} aria-hidden="true" />
                  </Button>
                </form>
                <Text size="small" tone="muted">
                  Sign in securely with Yopem. You will return to your workspace
                  when you finish.
                </Text>
              </Stack>
            </CardPanel>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
