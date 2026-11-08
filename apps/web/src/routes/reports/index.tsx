import { createFileRoute } from "@tanstack/react-router"

import { reportSearchSchema } from "@/features/reports/schema"

export const Route = createFileRoute("/reports/")({
  validateSearch: reportSearchSchema,
  head: () => ({
    meta: [
      { title: "Focus reports — Pomodoro" },
      {
        name: "description",
        content:
          "Review your focus time by day, week, month, year, and project.",
      },
    ],
  }),
})
