import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/auth/login/")({
  head: () => ({
    meta: [
      { title: "Log in — Pomodoro" },
      {
        name: "description",
        content: "Log in to sync your Pomodoro workspace across devices.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
})
