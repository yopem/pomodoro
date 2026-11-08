import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Container } from "@/components/ui/container"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { SettingsForm } from "@/features/settings/components/settings-form"
import { WorkspaceBackup } from "@/features/settings/components/workspace-backup"

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Pomodoro" },
      {
        name: "description",
        content: "Manage your timer and workspace preferences.",
      },
    ],
  }),
  component: SettingsRoute,
})

export function SettingsRoute() {
  const { workspace, hydrated, identity } = useFocusSnapshot(
    (snapshot) => snapshot,
  )

  const [message, setMessage] = useState<string | null>(null)

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="workspace">
        <Stack spacing="page">
          <Stack spacing="compact">
            <Heading render={<h1>Settings</h1>} />
            <Text tone="muted">Choose how your focus sessions work.</Text>
          </Stack>
          <Text>
            Guest data is stored in this browser. Export a backup before
            clearing browser data.
          </Text>
          {message && <output>{message}</output>}
          {hydrated ? (
            <Grid variant="focus">
              <SettingsForm
                settings={workspace.settings}
                onSaved={setMessage}
              />
              <WorkspaceBackup workspace={workspace} identity={identity} />
            </Grid>
          ) : (
            <Text>Loading settings…</Text>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
