import "@/styles/styles.css"
import type { QueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import { useSyncExternalStore } from "react"

import { AppShell } from "@/components/app-shell"
import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { stylexProps } from "@/lib/stylex"
import {
  darkTheme,
  lightTheme,
  rootStyles,
  themeMarker,
  tokens,
} from "@/styles/tokens.stylex"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pomodoro — Focus timer" },
      {
        name: "description",
        content: "Plan tasks, focus in intervals, and track your time.",
      },
      { name: "page-type", content: "software" },
      { name: "site-kind", content: "software" },
      { name: "theme-color", content: "#173f35" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  component: RootContent,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  shellComponent: RootDocument,
})

export function RootContent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <QueryClientProvider client={queryClient}>
      <a href="#main" {...stylex.props(styles.skipLink)}>
        Skip to content
      </a>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  )
}

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

export function RootDocument({ children }: { children: ReactNode }) {
  const { settings, timer } = useFocusSnapshot((value) => value.workspace)

  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    systemIsDark,
    serverIsDark,
  )

  const dark =
    settings.theme === "dark" ||
    (settings.theme === "system" && systemDark) ||
    (settings.dark_while_running && timer.deadline_ms !== null)

  return (
    <html
      lang="en"
      data-type="software"
      data-theme={dark ? "dark" : "light"}
      {...stylexProps(
        undefined,
        themeMarker,
        dark ? darkTheme : lightTheme,
        rootStyles.html,
      )}
    >
      <head>
        <HeadContent />
      </head>
      <body {...stylexProps(undefined, rootStyles.body)}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

export function RouteError() {
  return (
    <Box render={<main id="main" />}>
      <Heading render={<h1>This page could not load</h1>} />
      <Text>Reload this page or return to the timer.</Text>
      <Link to="/">Return to timer</Link>
    </Box>
  )
}

const styles = stylex.create({
  skipLink: {
    position: "fixed",
    insetBlockStart: 12,
    insetInlineStart: 12,
    zIndex: 100,
    padding: 12,
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    transform: { default: "translateY(-200%)", ":focus": "translateY(0)" },
  },
})

export function RouteNotFound() {
  return (
    <Box render={<main id="main" />}>
      <Heading render={<h1>Page not found</h1>} />
      <Link to="/">Return to timer</Link>
    </Box>
  )
}
