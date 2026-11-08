import createClient from "openapi-fetch"

import type { paths } from "./schema.gen"

function requestWithTimeout(request: Request) {
  return fetch(request, {
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
  })
}

export function createBrowserApiClient() {
  if (globalThis.window === undefined) {
    throw new Error("The API client requires a browser")
  }

  return createClient<paths>({
    baseUrl: window.location.origin,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    fetch: requestWithTimeout,
  })
}
