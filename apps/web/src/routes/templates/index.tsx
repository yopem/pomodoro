import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/templates/")({
  head: () => ({
    meta: [
      { title: "Templates — Pomodoro" },
      {
        name: "description",
        content: "Create and reuse collections of focus tasks.",
      },
    ],
  }),
})
