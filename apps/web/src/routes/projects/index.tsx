import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Pomodoro" },
      { name: "description", content: "Organize focus tasks by project." },
    ],
  }),
})
