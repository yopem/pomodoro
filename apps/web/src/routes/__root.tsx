import "@/styles/styles.css"
import type { QueryClient } from "@tanstack/react-query"
import type { RegisteredRouter } from "@tanstack/react-router"
import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
  useRouterState,
} from "@tanstack/react-router"

import type { Timer } from "@/features/focus/schema"

import { AppShell } from "@/components/app-shell"
import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { useFocusSnapshot } from "@/features/focus/store"
import { formatTimerClock, timerPhaseLabels } from "@/features/timer/countdown"
import { stylexProps } from "@/lib/stylex"
import { rootStyles, tokens } from "@/styles/tokens.stylex"
import { getRootThemeProps, ThemeScript } from "@/themes/theme"
import { ThemeProvider } from "@/themes/theme-provider"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "description",
        content: "Plan tasks, focus in intervals, and track your time.",
      },
      { name: "robots", content: "noindex, nofollow" },
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

  const workspaceGeneration = useFocusSnapshot(
    (value) => value.owner.generation,
  )

  return (
    <QueryClientProvider client={queryClient}>
      <a href="#main" {...stylex.props(styles.skipLink)}>
        Skip to content
      </a>
      <AppShell>
        <Outlet key={workspaceGeneration} />
      </AppShell>
    </QueryClientProvider>
  )
}

function documentTitleMode(state: RegisteredRouter["state"]) {
  const match = state.matches.at(-1)

  if (
    state.matches.some((route) =>
      route.meta?.some((meta) => meta !== undefined && "title" in meta),
    )
  )
    return "route"

  if (match?.status === "error") return "fallback"

  if (match?.routeId === "/" || match?.routeId === "/focus/") return "timer"

  return "fallback"
}

export function DocumentTitle({
  timer,
  nowMs,
  hydrated,
}: {
  timer: Timer
  nowMs: number
  hydrated: boolean
}) {
  const mode = useRouterState({ select: documentTitleMode })

  if (mode === "route") return null

  let title = "Pomodoro — Focus timer"

  if (mode === "timer" && hydrated) {
    const paused = timer.run_id !== null && timer.deadline_ms === null

    title = `${paused ? "Paused · " : ""}${formatTimerClock(timer, nowMs)} · ${timerPhaseLabels[timer.phase]} — Pomodoro`
  }

  return <title>{title}</title>
}

export function RootDocument({ children }: { children: ReactNode }) {
  const { workspace, hydrated, error, nowMs } = useFocusSnapshot(
    (value) => value,
  )

  const nonce = useRouter().options.ssr?.nonce
  const { settings, timer } = workspace

  return (
    <html
      lang="en"
      data-type="software"
      data-theme="light"
      suppressHydrationWarning
      {...getRootThemeProps()}
    >
      <head>
        <ThemeScript nonce={nonce} />
        <HeadContent />
        <DocumentTitle timer={timer} nowMs={nowMs} hydrated={hydrated} />
      </head>
      <body {...stylexProps(undefined, rootStyles.body)}>
        <ThemeProvider
          theme={settings.theme}
          ready={hydrated}
          mirrorPreference={error === null}
          forcedTheme={
            settings.dark_while_running && timer.deadline_ms !== null
              ? "dark"
              : undefined
          }
        >
          {children}
        </ThemeProvider>
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
