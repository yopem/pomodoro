import type { MouseEvent } from "react"

import * as stylex from "@stylexjs/stylex"
import {
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
} from "lucide-react"
import { startTransition, useActionState, useState } from "react"

import type { Timer, Workspace } from "@/features/focus/schema"
import type { WorkspaceOwner } from "@/features/focus/store"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { colorStyles } from "@/features/focus/color-indicator"
import {
  enableTimerSound,
  pauseTimer,
  phaseSeconds,
  resetTimer,
  selectPhase,
  skipTimer,
  startTimer,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { ConfirmAction } from "@/features/timer/components/confirm-action"
import { TimerNotificationStatus } from "@/features/timer/components/notification-status"
import { TimerSound } from "@/features/timer/components/timer-sound"
import { formatTimerClock, timerPhaseLabels } from "@/features/timer/countdown"
import { useEventCallback } from "@/hooks/use-event-callback"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  timer: {
    marginBlock: { default: 24, "@media (max-width: 640px)": 8 },
  },
  phases: {
    border: 0,
    margin: 0,
    padding: 0,
    minInlineSize: 0,
  },
  ring: {
    position: "absolute",
    inset: -12,
    inlineSize: "calc(100% + 24px)",
    blockSize: "calc(100% + 24px)",
    pointerEvents: "none",
    transform: "rotate(-90deg)",
  },
  countdown: {
    fontFamily: tokens["--font-sans"],
    fontVariantNumeric: "tabular-nums",
    fontSize: {
      default: "clamp(3.5rem, 6vw, 5.5rem)",
      "@media (max-width: 640px)": "clamp(2.75rem, 17vw, 5rem)",
    },
    fontWeight: 400,
    letterSpacing: "-0.05em",
    lineHeight: 1,
  },
})

const phases = Object.entries(timerPhaseLabels)

type Interruption =
  | { kind: "reset" }
  | { kind: "skip" }
  | { kind: "phase"; phase: Timer["phase"] }

type TimerRequest = (Interruption | { kind: "start" } | { kind: "pause" }) & {
  expected: Timer
  owner: WorkspaceOwner
  id: string
}

interface TimerDialog {
  request: TimerRequest
  open: boolean
}

export function TimerConfirmation({
  request,
  open,
  dispatch,
  setPending,
}: {
  request: TimerRequest
  open: boolean
  dispatch: (request: TimerRequest) => void
  setPending: React.Dispatch<React.SetStateAction<TimerDialog | null>>
}) {
  const [events] = useState(function createConfirmationEvents() {
    function clear() {
      setPending((current) =>
        current?.request === request ? { request, open: false } : current,
      )
    }

    function confirm() {
      clear()
      startTransition(() => dispatch(request))
    }

    function openChange(open: boolean) {
      if (!open) clear()
    }

    return { confirm, openChange }
  })

  let action = "Change phase"

  if (request.kind === "reset") action = "Reset timer"
  else if (request.kind === "skip") action = "Skip session"

  return (
    <ConfirmAction
      open={open}
      onOpenChange={events.openChange}
      title="Interrupt this focus session?"
      description="Elapsed focus time is saved as an incomplete session. It will not count as a completed focus session."
      action={action}
      onConfirm={events.confirm}
    />
  )
}

export function FocusTimer({
  workspace,
  nowMs,
}: {
  workspace: Workspace
  nowMs: number
}) {
  const owner = useWorkspaceMutationOwner()
  const { timer, settings, tasks } = workspace
  const [pending, setPending] = useState<TimerDialog | null>(null)

  const [error, dispatch, busy] = useActionState(
    async (_error: string | null, request: TimerRequest) => {
      const { expected, owner } = request

      try {
        if (request.kind === "start") await startTimer({ expected }, { owner })
        else if (request.kind === "pause")
          await pauseTimer({ expected }, { owner })
        else if (request.kind === "reset")
          await resetTimer({ expected }, { owner })
        else if (request.kind === "skip")
          await skipTimer({ expected }, { owner })
        else await selectPhase({ expected, phase: request.phase }, { owner })

        return null
      } catch (cause) {
        return cause instanceof Error
          ? cause.message
          : "Could not update the timer"
      }
    },
    null,
  )

  const request = useEventCallback((event: MouseEvent<HTMLButtonElement>) => {
    const value = event.currentTarget.value
    let command: Interruption | { kind: "start" } | { kind: "pause" }

    if (value === "toggle")
      command = { kind: timer.deadline_ms === null ? "start" : "pause" }
    else if (value === "reset" || value === "skip") command = { kind: value }
    else if (
      value === "focus" ||
      value === "short_break" ||
      value === "long_break"
    ) {
      if (value === timer.phase) return
      command = { kind: "phase", phase: value }
    } else return

    const captured: TimerRequest = Object.freeze({
      ...command,
      expected: Object.freeze({ ...timer }),
      owner,
      id: crypto.randomUUID(),
    })

    if (
      command.kind !== "start" &&
      command.kind !== "pause" &&
      timer.phase === "focus" &&
      timer.run_id !== null
    ) {
      setPending({ request: captured, open: true })

      return
    }

    if (command.kind === "start")
      enableTimerSound(
        { expected: captured.expected },
        { owner: captured.owner },
      )

    startTransition(() => dispatch(captured))
  })

  const clock = formatTimerClock(timer, nowMs)

  const remainingSeconds =
    timer.deadline_ms === null
      ? timer.remaining_seconds
      : (timer.deadline_ms - nowMs) / 1000

  const progress = Math.min(
    100,
    Math.max(
      0,
      (1 - remainingSeconds / phaseSeconds(workspace, timer.phase)) * 100,
    ),
  )

  const selected = tasks.find((task) => task.id === timer.selected_task_id)

  const phaseColor = {
    focus: settings.focus_color,
    short_break: settings.short_color,
    long_break: settings.long_color,
  }[timer.phase]

  const currentCycle =
    timer.completed_focus_count % settings.long_break_interval

  return (
    <Card render={<section aria-label="Focus timer" />}>
      <CardPanel>
        <Stack layout="centered" spacing="relaxed" xstyle={styles.timer}>
          <fieldset aria-label="Timer phase" {...stylex.props(styles.phases)}>
            <HStack layout="centered">
              {phases.map(([value, label]) => (
                <Button
                  key={value}
                  value={value}
                  variant={timer.phase === value ? "default" : "ghost"}
                  size="sm"
                  aria-pressed={timer.phase === value}
                  disabled={busy}
                  onClick={request}
                >
                  {label}
                </Button>
              ))}
            </HStack>
          </fieldset>
          <Box variant="focusDial" render={<section aria-label="Countdown" />}>
            <svg
              viewBox="0 0 344 344"
              aria-hidden="true"
              {...stylex.props(styles.ring, colorStyles[phaseColor])}
            >
              <circle
                cx="172"
                cy="172"
                r="160"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - progress}
              />
            </svg>
            <Text variant="note" tone="muted">
              {timerPhaseLabels[timer.phase]}
            </Text>
            <output
              role="timer"
              aria-live="off"
              aria-label={`${clock} remaining`}
              {...stylex.props(styles.countdown, colorStyles[phaseColor])}
            >
              {clock}
            </output>
            <Text variant="note" tone="muted">
              {timer.deadline_ms !== null
                ? "In progress"
                : "Ready when you are"}
            </Text>
          </Box>
          <HStack layout="centered">
            <Button size="lg" value="toggle" disabled={busy} onClick={request}>
              {timer.deadline_ms === null ? (
                <PlayIcon size={16} aria-hidden="true" />
              ) : (
                <PauseIcon size={16} aria-hidden="true" />
              )}
              {timer.deadline_ms === null
                ? timer.run_id
                  ? "Resume"
                  : "Start"
                : "Pause"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              value="reset"
              disabled={busy}
              onClick={request}
            >
              <RotateCcwIcon size={16} aria-hidden="true" /> Reset
            </Button>
            <Button
              variant="outline"
              size="lg"
              value="skip"
              disabled={busy}
              onClick={request}
            >
              <SkipForwardIcon size={16} aria-hidden="true" /> Skip
            </Button>
          </HStack>
          <Text size="small" tone="muted">
            Cycle {currentCycle} / {settings.long_break_interval} ·{" "}
            {timer.completed_focus_count} completed
          </Text>
          <Box variant="focusTask" render={<header />}>
            <Text variant="label">
              {selected ? selected.title : "Choose a task to focus on"}
            </Text>
          </Box>
          {error && (
            <Text role="alert" tone="destructive">
              {error}
            </Text>
          )}
        </Stack>
        <TimerSound timer={timer} settings={settings} />
        <TimerNotificationStatus enabled={settings.notifications} />
      </CardPanel>
      {pending && (
        <TimerConfirmation
          key={pending.request.id}
          request={pending.request}
          open={pending.open}
          dispatch={dispatch}
          setPending={setPending}
        />
      )}
    </Card>
  )
}
