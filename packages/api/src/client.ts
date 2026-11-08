import createClient from "openapi-fetch"

import type { paths } from "./schema.gen"

export function createBrowserApiClient() {
  if (globalThis.window === undefined) {
    throw new Error("The API client requires a browser")
  }

  return createClient<paths>({
    baseUrl: window.location.origin,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  })
}
