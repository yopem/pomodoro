import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: TimerRoute })

export function TimerRoute() {
  return (
    <main id="main">
      <h1>Focus timer</h1>
    </main>
  )
}
