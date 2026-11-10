import type { RegisteredRouter } from "@tanstack/react-router"
import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import { Link, useRouterState } from "@tanstack/react-router"
import { TimerIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { Container } from "@/components/ui/container"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { AccountControls } from "@/features/account/components/account-controls"
import { useAccountController } from "@/features/account/sync"
import { useFocusSnapshot } from "@/features/focus/store"
import { PwaUpdates } from "@/features/pwa/updates"
import { useBrowserFullscreen } from "@/features/timer/hooks/use-browser-fullscreen"
import { tokens } from "@/styles/tokens.stylex"

const exactMatch = { exact: true }

function getRouteId(state: RegisteredRouter["state"]) {
  return state.matches.at(-1)?.routeId
}

export function AppShell({ children }: { children: ReactNode }) {
  const routeId = useRouterState({ select: getRouteId })
  const fullscreen = useBrowserFullscreen()
  const compact = routeId === "/focus/" || (routeId === "/" && fullscreen)
  const login = routeId === "/login/"
  const snapshot = useFocusSnapshot((value) => value)
  const { controller, state } = useAccountController()

  return (
    <Stack>
      <Box render={<header hidden={compact} />} variant="appHeader">
        <Container variant="navigation">
          <HStack layout="spread">
            <Link
              to="/"
              {...stylex.props(styles.brand)}
              aria-label="Pomodoro timer"
            >
              <TimerIcon size={24} aria-hidden="true" />
              <Box render={<span>pomodoro</span>} />
            </Link>
            {login ? (
              <Link to="/" {...stylex.props(styles.navLink)}>
                Back to timer
              </Link>
            ) : (
              <>
                <Box
                  render={<nav aria-label="Main navigation" />}
                  variant="appNavigation"
                >
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
                </Box>
                <AccountControls controller={controller} state={state} />
              </>
            )}
          </HStack>
        </Container>
      </Box>
      {snapshot.error && <Text role="alert">{snapshot.error}</Text>}
      {snapshot.storageWarning && (
        <Box render={<output>{snapshot.storageWarning}</output>} />
      )}
      {children}
      <Box render={<footer hidden={compact || login} />}>
        <Container variant="navigation">
          <Stack>
            <PwaUpdates />
          </Stack>
        </Container>
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
    letterSpacing: "-0.04em",
    flexShrink: 0,
  },
  navLink: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: 44,
    fontSize: 13,
    fontWeight: 500,
    paddingInline: 8,
    whiteSpace: "nowrap",
    borderRadius: tokens["--radius-md"],
    backgroundColor: {
      default: "transparent",
      ":hover": tokens["--muted"],
      ":is([data-status=active])": tokens["--accent"],
    },
    color: {
      default: tokens["--muted-foreground"],
      ":hover": tokens["--foreground"],
      ":is([data-status=active])": tokens["--foreground"],
    },
    textDecoration: "none",
    transitionProperty: "color, background-color",
    transitionDuration: {
      default: "150ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
  },
})
