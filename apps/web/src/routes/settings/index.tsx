import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Pomodoro" },
      {
        name: "description",
        content: "Manage your timer and workspace preferences.",
      },
    ],
  }),
})
