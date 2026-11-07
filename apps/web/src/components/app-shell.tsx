import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { TimerIcon } from "lucide-react"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { appStyles } from "@/styles/app.stylex"
import {
  darkTheme,
  lightTheme,
  themeMarker,
  tokens,
} from "@/styles/tokens.stylex"

function subscribeSystemTheme(listener: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)")
  query.addEventListener("change", listener)
  return () => query.removeEventListener("change", listener)
}

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function serverIsDark() {
  return false
}

export function AppShell({ children }: { children: ReactNode }) {
  const snapshot = useFocusSnapshot((value) => value)
  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    systemIsDark,
    serverIsDark,
  )
  const { settings, timer } = snapshot.workspace
  const dark =
    settings.theme === "dark" ||
    (settings.theme === "system" && systemDark) ||
    (settings.dark_while_running && timer.deadline_ms !== null)

  return (
    <Stack
      xstyle={[
        themeMarker,
        dark ? darkTheme : lightTheme,
        styles.shell,
      ]}
    >
      <header {...stylex.props(styles.header)}>
        <HStack xstyle={styles.headerInner}>
          <Link to="/" {...stylex.props(styles.brand)} aria-label="Pomodoro timer">
            <TimerIcon size={24} aria-hidden="true" />
            <span>pomodoro</span>
          </Link>
          <nav aria-label="Main navigation" {...stylex.props(styles.nav)}>
            <Link to="/" activeOptions={{ exact: true }} {...stylex.props(styles.navLink)}>
              Timer
            </Link>
            <Link to="/projects" {...stylex.props(styles.navLink)}>Projects</Link>
            <Link to="/templates" {...stylex.props(styles.navLink)}>Templates</Link>
            <Link to="/reports" {...stylex.props(styles.navLink)}>Reports</Link>
            <Link to="/settings" {...stylex.props(styles.navLink)}>Settings</Link>
          </nav>
          <Button variant="outline" render={<a href="/auth/login" />}>
            Sign in
          </Button>
        </HStack>
      </header>
      {snapshot.error && (
        <Text role="alert" xstyle={[styles.notice, appStyles.error]}>
          {snapshot.error}
        </Text>
      )}
      {snapshot.storageWarning && (
        <Text role="status" xstyle={styles.notice}>
          {snapshot.storageWarning}
        </Text>
      )}
      {children}
      <footer {...stylex.props(styles.footer)}>
        <Text xstyle={[appStyles.small, appStyles.muted]}>
          Your time, without the noise.
        </Text>
        <Text xstyle={[appStyles.small, appStyles.muted]}>
          Guest work stays on this device. Export a backup in Settings.
        </Text>
      </footer>
    </Stack>
  )
}

const styles = stylex.create({
  shell: {
    minBlockSize: "100dvh",
    gap: 0,
    color: tokens["--foreground"],
    backgroundColor: tokens["--background"],
  },
  header: {
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    backgroundColor: tokens["--card"],
  },
  headerInner: {
    maxInlineSize: 1160,
    marginInline: "auto",
    minBlockSize: 88,
    paddingInline: { default: 32, "@media (max-width: 640px)": 20 },
    paddingBlock: 16,
    flexWrap: "wrap",
    gap: 24,
  },
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
  nav: {
    display: "flex",
    flexWrap: "wrap",
    gap: { default: 20, "@media (max-width: 640px)": 12 },
    marginInlineEnd: "auto",
    order: { default: 0, "@media (max-width: 640px)": 1 },
    inlineSize: { default: "auto", "@media (max-width: 640px)": "100%" },
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
      "[data-status=active]": tokens["--foreground"],
    },
    textDecoration: "none",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 2,
    borderBlockEndColor: {
      default: "transparent",
      "[data-status=active]": tokens["--primary"],
    },
    transitionProperty: "color, border-color",
    transitionDuration: {
      default: "150ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
  },
  notice: {
    maxInlineSize: 1096,
    marginInline: "auto",
    marginBlockStart: 16,
    paddingInline: 20,
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    maxInlineSize: 1160,
    inlineSize: "100%",
    marginInline: "auto",
    marginBlockStart: "auto",
    paddingInline: { default: 32, "@media (max-width: 640px)": 20 },
    paddingBlock: 28,
  },
})
