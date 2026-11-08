import { publicConfig } from "@pomodoro/env/client"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  head: () => {
    const canonical =
      publicConfig.isProduction && publicConfig.publicOrigin
        ? new URL("/", publicConfig.publicOrigin).href
        : undefined

    const description = "Plan tasks, focus in intervals, and track your time."

    return {
      meta: [
        { name: "description", content: description },
        {
          name: "robots",
          content: canonical ? "index, follow" : "noindex, nofollow",
        },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "Pomodoro — Focus timer" },
        { property: "og:description", content: description },
        ...(canonical ? [{ property: "og:url", content: canonical }] : []),
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: "Pomodoro — Focus timer" },
        { name: "twitter:description", content: description },
      ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
    }
  },
})
