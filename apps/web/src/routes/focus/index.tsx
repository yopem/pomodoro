import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/focus/")({
  head: () => ({
    meta: [
      { name: "description", content: "Use the timer in a small window." },
    ],
  }),
})
