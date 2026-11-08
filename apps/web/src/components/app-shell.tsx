import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { TimerIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { PwaUpdates } from "@/features/pwa/updates"
import { tokens } from "@/styles/tokens.stylex"

const exactMatch = { exact: true }

export function AppShell({ children }: { children: ReactNode }) {
  const snapshot = useFocusSnapshot((value) => value)

  return (
    <Stack>
      <Box render={<header />}>
        <HStack wrap>
          <Link
            to="/"
            {...stylex.props(styles.brand)}
            aria-label="Pomodoro timer"
          >
            <TimerIcon size={24} aria-hidden="true" />
            <Box render={<span>pomodoro</span>} />
          </Link>
          <Box render={<nav aria-label="Main navigation" />}>
            <HStack wrap>
              <Link
                to="/"
                activeOptions={exactMatch}
                {...stylex.props(styles.navLink)}
              >
                Timer
              </Link>
              <Link to="/projects" {...stylex.props(styles.navLink)}>
                Projects
              </Link>
              <Link to="/templates" {...stylex.props(styles.navLink)}>
                Templates
              </Link>
              <Link to="/reports" {...stylex.props(styles.navLink)}>
                Reports
              </Link>
              <Link to="/settings" {...stylex.props(styles.navLink)}>
                Settings
              </Link>
            </HStack>
          </Box>
          <Text>Guest mode</Text>
        </HStack>
      </Box>
      {snapshot.error && <Text role="alert">{snapshot.error}</Text>}
      {snapshot.storageWarning && (
        <Box render={<output>{snapshot.storageWarning}</output>} />
      )}
      {children}
      <Box render={<footer />}>
        <Stack>
          <PwaUpdates />
          <Text>Export a backup in Settings.</Text>
        </Stack>
      </Box>
    </Stack>
  )
}

const styles = stylex.create({
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    minBlockSize: 44,
    color: tokens["--foreground"],
    textDecoration: "none",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.06em",
  },
  navLink: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: 44,
    fontSize: 14,
    fontWeight: 500,
    color: {
      default: tokens["--muted-foreground"],
      ":hover": tokens["--foreground"],
      ":is([data-status=active])": tokens["--foreground"],
    },
    textDecoration: "none",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 2,
    borderBlockEndColor: {
      default: "transparent",
      ":is([data-status=active])": tokens["--primary"],
    },
    transitionProperty: "color, border-color",
    transitionDuration: {
      default: "150ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
  },
})
