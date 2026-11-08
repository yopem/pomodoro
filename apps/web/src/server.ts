import { publicConfig } from "@pomodoro/env/client"
import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

export default createServerEntry({
  async fetch(request, options) {
    const url = new URL(request.url)
    const path = url.pathname
    const requestId = crypto.randomUUID()
    const bytes = crypto.getRandomValues(new Uint8Array(18))
    const nonce = btoa(String.fromCharCode(...bytes))

    const backendPath =
      path === "/api" ||
      path.startsWith("/api/") ||
      path === "/auth" ||
      path.startsWith("/auth/") ||
      path === "/openapi.json" ||
      path === "/health" ||
      path === "/ready"

    const response = backendPath
      ? Response.json(
          { error: "Backend route is unavailable", request_id: requestId },
          { status: 404 },
        )
      : await handler.fetch(request, {
          ...options,
          context: { ...options?.context, nonce },
        })

    const headers = new Headers(response.headers)

    const analyticsOrigins =
      publicConfig.analyticsEnabled === "true"
        ? [
            publicConfig.gaMeasurementId
              ? "https://www.googletagmanager.com"
              : "",
            publicConfig.umamiScriptUrl
              ? new URL(publicConfig.umamiScriptUrl).origin
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        : ""

    headers.set("X-Request-ID", requestId)
    headers.set("X-Content-Type-Options", "nosniff")
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    )
    headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' ${analyticsOrigins}`,
        `style-src 'self' 'nonce-${nonce}'`,
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data: https://www.google-analytics.com",
        "font-src 'self'",
        `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com ${publicConfig.umamiScriptUrl ? new URL(publicConfig.umamiScriptUrl).origin : ""}`,
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
      ].join("; "),
    )
    headers.set("Cache-Control", "no-store")

    const publicUrl = new URL(publicConfig.publicOrigin ?? request.url)

    if (publicUrl.protocol === "https:") {
      headers.set("Strict-Transport-Security", "max-age=31536000")
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
})
