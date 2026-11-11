import type { RegisteredRouter } from "@tanstack/react-router"
import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import { Link, useRouterState } from "@tanstack/react-router"
import { TimerIcon } from "lucide-react"

import { ThemeSwitcher } from "@/components/theme-switcher"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
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

function isErrorPage(state: RegisteredRouter["state"]) {
  return state.matches.some(
    (match) =>
      match.status === "error" ||
      match.status === "notFound" ||
      match._notFound,
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const routeId = useRouterState({ select: getRouteId })
  const errorPage = useRouterState({ select: isErrorPage })
  const fullscreen = useBrowserFullscreen()
  const compact = routeId === "/focus/" || (routeId === "/" && fullscreen)
  const snapshot = useFocusSnapshot((value) => value)
  const { controller, state } = useAccountController()

  if (routeId === "/auth/login/") return children

  return (
    <Stack>
      <Box
        render={<header hidden={compact || errorPage} />}
        variant="appHeader"
      >
        <Container variant="navigation">
          <HStack layout="spread">
            <Link
              to="/"
              {...stylex.props(styles.brand)}
              aria-label="Pomodoro timer"
            >
              <TimerIcon
                size={36}
                aria-hidden="true"
                {...stylex.props(styles.brandIcon)}
              />
              <Box render={<span>pomodoro</span>} variant="appBrandLabel" />
            </Link>
            <Box
              render={<nav aria-label="Main navigation" />}
              variant="appNavigation"
            >
              <Button
                variant={routeId === "/" ? "secondary" : "ghost"}
                size="sm"
                render={<Link to="/" activeOptions={exactMatch} />}
              >
                Timer
              </Button>
              <Button
                variant={routeId === "/projects/" ? "secondary" : "ghost"}
                size="sm"
                render={<Link to="/projects" />}
              >
                Projects
              </Button>
              <Button
                variant={routeId === "/templates/" ? "secondary" : "ghost"}
                size="sm"
                render={<Link to="/templates" />}
              >
                Templates
              </Button>
              <Button
                variant={routeId === "/reports/" ? "secondary" : "ghost"}
                size="sm"
                render={<Link to="/reports" />}
              >
                Reports
              </Button>
              <Button
                variant={routeId === "/settings/" ? "secondary" : "ghost"}
                size="sm"
                render={<Link to="/settings" />}
              >
                Settings
              </Button>
            </Box>
            <HStack layout="actions">
              <ThemeSwitcher key={snapshot.owner.generation} />
              <AccountControls controller={controller} state={state} />
            </HStack>
          </HStack>
        </Container>
      </Box>
      {snapshot.error && <Text role="alert">{snapshot.error}</Text>}
      {snapshot.storageWarning && (
        <Box render={<output>{snapshot.storageWarning}</output>} />
      )}
      {children}
      <Box render={<footer hidden={compact} />}>
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
    gap: `calc(${tokens["--spacing"]} * 2)`,
    minBlockSize: 44,
    color: tokens["--foreground"],
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: "-0.02em",
    flexShrink: 0,
  },
  brandIcon: {
    padding: `calc(${tokens["--spacing"]} * 2)`,
    borderRadius: tokens["--radius"],
    backgroundColor: tokens["--secondary"],
    color: tokens["--foreground"],
  },
})
