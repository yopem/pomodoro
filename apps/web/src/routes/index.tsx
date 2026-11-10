import { publicConfig } from "@pomodoro/env/client"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  head: () => {
    const canonical =
      publicConfig.isProduction && publicConfig.publicOrigin
        ? new URL("/", publicConfig.publicOrigin).href
        : undefined

    const title = "Pomodoro Timer - Focus, Tasks & Breaks"

    const description =
      "Plan tasks with a Pomodoro timer, work in focus intervals, and take regular breaks. Track completed sessions and review your focus time in daily reports."

    const image = canonical
      ? new URL("/icon-512.png", canonical).href
      : undefined

    return {
      meta: [
        { name: "description", content: description },
        {
          name: "robots",
          content: canonical ? "index, follow" : "noindex, nofollow",
        },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "Pomodoro" },
        ...(canonical ? [{ property: "og:url", content: canonical }] : []),
        ...(image
          ? [
              { property: "og:image", content: image },
              { property: "og:image:width", content: "512" },
              { property: "og:image:height", content: "512" },
              { property: "og:image:alt", content: "Pomodoro app icon" },
              { name: "twitter:image", content: image },
              { name: "twitter:image:alt", content: "Pomodoro app icon" },
            ]
          : []),
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
      scripts: canonical
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Pomodoro",
                url: canonical,
                description,
                applicationCategory: "ProductivityApplication",
                operatingSystem: "Web browser",
              }).replaceAll("<", "\\u003c"),
            },
          ]
        : [],
    }
  },
})
