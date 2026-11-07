import type { MouseEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import { startTransition, useActionState, useState } from "react"

import type { Timer, Workspace } from "@/features/focus/schema"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import {
  pauseTimer,
  resetTimer,
  selectPhase,
  skipTimer,
  startTimer,
} from "@/features/focus/store"
import { ConfirmAction } from "@/features/timer/components/confirm-action"
import { appStyles } from "@/styles/app.stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  timer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 24,
    paddingBlock: { default: 48, "@media (max-width: 640px)": 32 },
  },
  phases: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    border: 0,
    margin: 0,
    padding: 0,
    minInlineSize: 0,
  },
  countdown: {
    fontFamily: tokens["--font-mono"],
    fontVariantNumeric: "tabular-nums",
    fontSize: "clamp(4rem, 12vw, 8rem)",
    fontWeight: 600,
    letterSpacing: "-0.06em",
    lineHeight: 1,
  },
  current: { color: tokens["--success-foreground"], overflowWrap: "anywhere" },
})

const phases: { value: Timer["phase"]; label: string }[] = [
  { value: "focus", label: "Focus" },
  { value: "short_break", label: "Short break" },
  { value: "long_break", label: "Long break" },
]

type Interruption =
  | { kind: "reset" }
  | { kind: "skip" }
  | { kind: "phase"; phase: Timer["phase"] }

export function FocusTimer({
  workspace,
  nowMs,
}: {
  workspace: Workspace
  nowMs: number
}) {
  const { timer, settings, tasks } = workspace
  const [pending, setPending] = useState<Interruption | null>(null)

  const [error, dispatch, busy] = useActionState(
    async (
      _error: string | null,
      command: Interruption | "toggle" | "confirm",
    ) => {
      let interruption: Interruption | null = null

      if (command === "confirm") {
        interruption = pending
        setPending(null)
      } else if (command !== "toggle") {
        if (command.kind === "phase" && command.phase === timer.phase)
          return null

        if (timer.phase === "focus" && timer.run_id !== null) {
          setPending(command)

          return null
        }

        interruption = command
      }

      try {
        if (command === "toggle") {
          if (timer.deadline_ms === null) await startTimer()
          else await pauseTimer()
        } else if (interruption?.kind === "reset") await resetTimer()
        else if (interruption?.kind === "skip") await skipTimer()
        else if (interruption?.kind === "phase")
          await selectPhase({ phase: interruption.phase })

        return null
      } catch (cause) {
        return cause instanceof Error
          ? cause.message
          : "Could not update the timer"
      }
    },
    null,
  )

  const [events] = useState(function createTimerEvents() {
    function request(event: MouseEvent<HTMLButtonElement>) {
      const value = event.currentTarget.value

      startTransition(() => {
        if (value === "toggle") dispatch("toggle")
        else if (value === "reset" || value === "skip")
          dispatch({ kind: value })
        else if (
          value === "focus" ||
          value === "short_break" ||
          value === "long_break"
        )
          dispatch({ kind: "phase", phase: value })
      })
    }

    function confirm() {
      startTransition(() => dispatch("confirm"))
    }

    function openChange(open: boolean) {
      if (!open) setPending(null)
    }

    return { request, confirm, openChange }
  })

  const remaining =
    timer.deadline_ms === null
      ? Math.ceil(timer.remaining_seconds)
      : Math.max(0, Math.ceil((timer.deadline_ms - nowMs) / 1000))

  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`
  const selected = tasks.find((task) => task.id === timer.selected_task_id)

  const currentCycle =
    timer.completed_focus_count % settings.long_break_interval

  let actionLabel = "Change phase"

  if (pending?.kind === "reset") actionLabel = "Reset timer"
  else if (pending?.kind === "skip") actionLabel = "Skip session"

  return (
    <Box
      render={<section aria-label="Focus timer" />}
      xstyle={appStyles.section}
    >
      <Box render={<div {...stylex.props(styles.timer)} />}>
        <Box
          render={
            <fieldset
              aria-label="Timer phase"
              {...stylex.props(styles.phases)}
            />
          }
        >
          {phases.map((phase) => (
            <Button
              key={phase.value}
              value={phase.value}
              variant={timer.phase === phase.value ? "default" : "ghost"}
              size="xl"
              aria-pressed={timer.phase === phase.value}
              disabled={busy}
              onClick={events.request}
            >
              {phase.label}
            </Button>
          ))}
        </Box>
        <Box
          render={
            <div
              aria-label={`${clock} remaining`}
              {...stylex.props(styles.countdown)}
            />
          }
        >
          {clock}
        </Box>
        <Box render={<p {...stylex.props(styles.current)} />}>
          {selected ? `Focusing on ${selected.title}` : "No task selected"}
        </Box>
        <Box render={<div {...stylex.props(styles.phases)} />}>
          <Button
            size="xl"
            value="toggle"
            disabled={busy}
            onClick={events.request}
          >
            {timer.deadline_ms === null
              ? timer.run_id
                ? "Resume"
                : "Start"
              : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="xl"
            value="reset"
            disabled={busy}
            onClick={events.request}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            size="xl"
            value="skip"
            disabled={busy}
            onClick={events.request}
          >
            Skip
          </Button>
        </Box>
        <Text xstyle={appStyles.muted}>
          Focus sessions in this cycle: {currentCycle} /{" "}
          {settings.long_break_interval} · {timer.completed_focus_count}{" "}
          completed
        </Text>
        {error && (
          <Text role="alert" xstyle={appStyles.error}>
            {error}
          </Text>
        )}
      </Box>
      <ConfirmAction
        open={pending !== null}
        onOpenChange={events.openChange}
        title="Interrupt this focus session?"
        description="Elapsed focus time is saved as an incomplete session. It will not count as a completed focus session."
        action={actionLabel}
        onConfirm={events.confirm}
      />
    </Box>
  )
}
