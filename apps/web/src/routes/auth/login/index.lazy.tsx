import * as stylex from "@stylexjs/stylex"
import { createLazyFileRoute } from "@tanstack/react-router"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
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
      <Card xstyle={styles.card}>
        <CardPanel>
          <Stack spacing="relaxed" layout="centered">
            <Stack spacing="compact" layout="centered">
              <Heading render={<h1>Welcome</h1>} />
              <Text tone="muted">Use your Yopem account to continue</Text>
            </Stack>
            <Button variant="outline" size="lg" onClick={startLogin}>
              Log in with Yopem
            </Button>
          </Stack>
        </CardPanel>
      </Card>
    </Box>
  )
}

const styles = stylex.create({
  card: { inlineSize: "min(100%, 420px)" },
})
