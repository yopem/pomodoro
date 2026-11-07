import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { SettingsForm } from "@/features/settings/components/settings-form"
import { WorkspaceBackup } from "@/features/settings/components/workspace-backup"
import { appStyles } from "@/styles/app.stylex"

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
      <Stack xstyle={appStyles.page}>
        <Stack xstyle={appStyles.compact}>
          <Heading render={<h1>Settings</h1>} />
          <Text xstyle={appStyles.muted}>
            Choose how your focus sessions work.
          </Text>
        </Stack>
        <Text>
          Guest data is stored in this browser. Export a backup before clearing
          browser data.
        </Text>
        {message && <output>{message}</output>}
        {hydrated ? (
          <>
            <SettingsForm settings={workspace.settings} onSaved={setMessage} />
            <WorkspaceBackup workspace={workspace} identity={identity} />
          </>
        ) : (
          <Text>Loading settings…</Text>
        )}
      </Stack>
    </Box>
  )
}
