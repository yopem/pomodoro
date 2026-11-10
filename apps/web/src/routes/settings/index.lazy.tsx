import * as stylex from "@stylexjs/stylex"
import { createLazyFileRoute, Link } from "@tanstack/react-router"
import {
  DatabaseBackupIcon,
  PaletteIcon,
  SlidersHorizontalIcon,
  TimerIcon,
  Volume2Icon,
} from "lucide-react"

import { Box } from "@/components/ui/box"
import { Container } from "@/components/ui/container"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { SettingsForm } from "@/features/settings/components/settings-form"
import { SettingsSkeleton } from "@/features/settings/components/settings-loading"
import { WorkspaceBackup } from "@/features/settings/components/workspace-backup"
import { tokens } from "@/styles/tokens.stylex"

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
                  <Link
                    key={section.id}
                    to="/settings"
                    hash={section.id}
                    {...stylex.props(styles.sectionLink)}
                  >
                    <section.icon size={18} aria-hidden="true" />
                    {section.label}
                  </Link>
                ))}
              </Box>
              <Stack spacing="page">
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

const styles = stylex.create({
  sectionLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minBlockSize: 44,
    paddingInline: 12,
    borderRadius: tokens["--radius-md"],
    color: {
      default: tokens["--muted-foreground"],
      ":hover": tokens["--foreground"],
    },
    backgroundColor: { default: "transparent", ":hover": tokens["--accent"] },
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
  },
})
