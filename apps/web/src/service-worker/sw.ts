import { clientsClaim } from "workbox-core"
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching"
import { z } from "zod"

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (
    string | { url: string; revision?: string | null; integrity?: string }
  )[]
}

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

clientsClaim()

const updateMessage = z.object({ type: z.literal("SKIP_WAITING") })

self.addEventListener("message", (event) => {
  if (updateMessage.safeParse(event.data).success) void self.skipWaiting()
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  const backend =
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname === "/openapi.json"

  if (
    event.request.mode !== "navigate" ||
    url.origin !== self.location.origin ||
    backend
  )
    return

  event.respondWith(
    fetch(event.request).catch(async () => {
      const fallback = await matchPrecache("/offline.html")

      return fallback ?? Response.error()
    }),
  )
})
