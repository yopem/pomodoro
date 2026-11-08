import { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { getGlobalStartContext } from "@tanstack/react-start"
import { z } from "zod"

import { routeTree } from "@/routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient()
  const context = getGlobalStartContext()

  const nonce = context
    ? z.object({ nonce: z.string() }).parse(context).nonce
    : undefined

  return createRouter({
    ssr: { nonce },
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
  })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
