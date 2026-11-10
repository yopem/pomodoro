import { createFileRoute } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"

export const Route = createFileRoute("/auth/login/")({
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
    <Box variant="loginPage" render={<main id="main" tabIndex={-1} />}>
      <Heading render={<h1>Welcome</h1>} />
      <Text>Use your Yopem account to continue</Text>
      <form action="/auth/authorize" method="get">
        <Button variant="outline" size="lg" type="submit">
          Log in with Yopem
        </Button>
      </form>
    </Box>
  )
}
