import { createLazyFileRoute } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"

export const Route = createLazyFileRoute("/auth/login/")({
  component: LoginRoute,
})

function startLogin() {
  window.location.assign("/auth/authorize")
}

export function LoginRoute() {
  return (
    <Box variant="loginPage" render={<main id="main" tabIndex={-1} />}>
      <Heading render={<h1>Welcome</h1>} />
      <Text>Use your Yopem account to continue</Text>
      <Button variant="outline" size="lg" onClick={startLogin}>
        Log in with Yopem
      </Button>
    </Box>
  )
}
