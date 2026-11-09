import { useState, useSyncExternalStore } from "react"

import type { Settings, Timer } from "@/features/focus/schema"

import { Button } from "@/components/ui/button"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import {
  getFocusAudioServerSnapshot,
  getFocusAudioSnapshot,
  subscribeFocusAudio,
} from "@/features/focus/audio"
import {
  enableTimerSound,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { useEventCallback } from "@/hooks/use-event-callback"

type AudioAvailability = ReturnType<
  typeof getFocusAudioSnapshot
>["availability"]

function soundStatus(wanted: boolean, availability: AudioAvailability) {
  if (!wanted) return "Sound is off."

  if (availability === "ready") return "Sound is ready in this tab."

  if (availability === "blocked")
    return "Sound is blocked in this tab. Try enabling it again."

  if (availability === "unsupported")
    return "Sound is unavailable in this browser."

  return "Enable sound in this tab."
}

export function TimerSound({
  timer,
  settings,
}: {
  timer: Timer
  settings: Settings
}) {
  const owner = useWorkspaceMutationOwner()

  const audio = useSyncExternalStore(
    subscribeFocusAudio,
    getFocusAudioSnapshot,
    getFocusAudioServerSnapshot,
  )

  const [requested, setRequested] = useState(false)

  const enable = useEventCallback(() => {
    setRequested(true)

    if (!enableTimerSound({ expected: timer }, { owner })) setRequested(false)
  })

  const active = timer.run_id !== null
  const alarmWanted = settings.alarm !== "none" && settings.alarm_volume > 0

  const backgroundWanted =
    timer.phase === "focus" &&
    settings.focus_sound !== "none" &&
    settings.focus_sound_volume > 0

  const wanted = alarmWanted || backgroundWanted
  const visible = active || audio.missed || requested
  const status = visible ? soundStatus(wanted, audio.availability) : ""

  const canEnable =
    active &&
    wanted &&
    audio.availability !== "unsupported" &&
    (audio.availability !== "ready" || requested)

  return (
    <Stack layout="centered" spacing="compact">
      {canEnable && (
        <Button variant="outline" size="xl" onClick={enable}>
          Enable sound
        </Button>
      )}
      <Text aria-live="polite" aria-atomic size="small" tone="muted">
        {status}
        {audio.missed &&
          alarmWanted &&
          " A timer alarm was missed in this tab."}
      </Text>
    </Stack>
  )
}
