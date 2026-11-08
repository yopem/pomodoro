import type { Timer } from "@/features/focus/schema"

export const timerPhaseLabels = {
  focus: "Focus",
  short_break: "Short break",
  long_break: "Long break",
}

export function formatTimerClock(timer: Timer, nowMs: number) {
  const remaining = Math.max(
    0,
    Math.ceil(
      timer.deadline_ms === null
        ? timer.remaining_seconds
        : (timer.deadline_ms - nowMs) / 1000,
    ),
  )

  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`
}
