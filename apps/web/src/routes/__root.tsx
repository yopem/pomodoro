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
      <a href="#main">Skip to content</a>
      <Outlet />
    </QueryClientProvider>
  )
}

export function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-type="software">
      <head>
        <HeadContent />
      </head>
      <body>
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

export function RouteNotFound() {
  return (
    <main id="main">
      <h1>Page not found</h1>
      <Link to="/">Return to timer</Link>
    </main>
  )
}
