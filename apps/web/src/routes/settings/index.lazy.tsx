import { createLazyFileRoute, Link } from "@tanstack/react-router"
import {
  DatabaseBackupIcon,
  PaletteIcon,
  SlidersHorizontalIcon,
  TimerIcon,
  Volume2Icon,
} from "lucide-react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { SettingsForm } from "@/features/settings/components/settings-form"
import { SettingsSkeleton } from "@/features/settings/components/settings-loading"
import { WorkspaceBackup } from "@/features/settings/components/workspace-backup"

export const Route = createLazyFileRoute("/settings/")({
  component: SettingsRoute,
})

const sections = [
  { id: "settings-timer", label: "Timer", icon: TimerIcon },
  { id: "settings-sound", label: "Sound", icon: Volume2Icon },
  { id: "settings-appearance", label: "Appearance", icon: PaletteIcon },
  { id: "settings-behavior", label: "Automation", icon: SlidersHorizontalIcon },
  { id: "settings-backup", label: "Backup", icon: DatabaseBackupIcon },
]

export function SettingsRoute() {
  const { workspace, hydrated, identity, owner } = useFocusSnapshot(
    (snapshot) => snapshot,
  )

  return (
    <Box render={<main id="main" tabIndex={-1} />}>
      <Container variant="workspace">
        <Stack spacing="page">
          <Stack spacing="compact">
            <Heading render={<h1>Settings</h1>} />
            {hydrated ? (
              <Text tone="muted">
                {identity === null
                  ? "Preferences and backups for work saved in this browser."
                  : "Preferences and backups for your account workspace."}
              </Text>
            ) : (
              <output aria-live="polite">Loading settings…</output>
            )}
          </Stack>
          {hydrated ? (
            <Grid variant="settings">
              <Box
                variant="settingsNavigation"
                render={<nav aria-label="Settings sections" />}
              >
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    render={<Link to="/settings" hash={section.id} />}
                  >
                    <section.icon size={18} aria-hidden="true" />
                    {section.label}
                  </Button>
                ))}
              </Box>
              <Stack spacing="relaxed">
                <SettingsForm
                  key={`settings-${owner.generation}`}
                  settings={workspace.settings}
                />
                <WorkspaceBackup
                  key={`backup-${owner.generation}`}
                  workspace={workspace}
                  identity={identity}
                />
              </Stack>
            </Grid>
          ) : (
            <SettingsSkeleton />
          )}
        </Stack>
      </Container>
    </Box>
  )
}
