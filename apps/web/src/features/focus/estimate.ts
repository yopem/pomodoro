import type { Workspace } from "./schema"

export function estimateFinish(input: { workspace: Workspace; nowMs: number }) {
  const { workspace, nowMs } = input

  if (!Number.isSafeInteger(nowMs)) throw new Error("Invalid current time")
  const pending = workspace.tasks.filter((task) => !task.completed)

  let intervals = pending.reduce(
    (total, task) => total + Math.max(0, task.estimate - task.actual),
    0,
  )

  if (intervals === 0) return null
  const timer = workspace.timer
  let seconds = 0

  const currentRemaining =
    timer.deadline_ms === null
      ? timer.remaining_seconds
      : Math.max(0, Math.ceil((timer.deadline_ms - nowMs) / 1000))

  if (timer.phase !== "focus") seconds += currentRemaining

  const currentFocus =
    timer.phase === "focus" &&
    timer.run_id !== null &&
    pending.some(
      (task) =>
        task.id === timer.selected_task_id && task.actual < task.estimate,
    )

  if (currentFocus) {
    seconds += currentRemaining
    intervals -= 1
  }

  const breaks = Math.max(0, intervals - 1 + (currentFocus ? 1 : 0))
  const count = timer.completed_focus_count
  const interval = workspace.settings.long_break_interval

  const longBreaks =
    Math.floor((count + breaks) / interval) - Math.floor(count / interval)

  seconds += intervals * workspace.settings.focus_minutes * 60
  seconds +=
    60 *
    (longBreaks * workspace.settings.long_minutes +
      (breaks - longBreaks) * workspace.settings.short_minutes)

  return nowMs + seconds * 1000
}
