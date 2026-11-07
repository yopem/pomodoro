import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"

import { AppShell } from "@/components/app-shell"
import { stylexProps } from "@/lib/stylex"
import { lightTheme, rootStyles, themeMarker, tokens } from "@/styles/tokens.stylex"
import type { QueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { QueryClientProvider } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router"

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
      <a href="#main" {...stylex.props(styles.skipLink)}>Skip to content</a>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  )
}

export function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-type="software"
      data-theme="light"
      {...stylexProps(undefined, themeMarker, lightTheme, rootStyles.html)}
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
    <main id="main">
      <h1>This page could not load</h1>
      <p>Your saved work has not been removed.</p>
      <Link to="/">Return to timer</Link>
    </main>
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
    <main id="main">
      <h1>Page not found</h1>
      <Link to="/">Return to timer</Link>
    </main>
  )
}
