import { publicConfig } from "@pomodoro/env/client"
import { useSyncExternalStore } from "react"
import { registerSW } from "virtual:pwa-register"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"

interface UpdateSnapshot {
  available: boolean
  error: string | null
}

const initial: UpdateSnapshot = { available: false, error: null }

let snapshot = initial

let registered = false

let updateWorker: ((reloadPage?: boolean) => Promise<void>) | undefined

const listeners = new Set<() => void>()

function notify(next: typeof initial) {
  snapshot = next

  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  if (
    !registered &&
    publicConfig.isProduction &&
    "serviceWorker" in navigator
  ) {
    registered = true
    updateWorker = registerSW({
      immediate: false,
      onNeedRefresh() {
        notify({ available: true, error: null })
      },
      onRegisterError() {
        notify({ available: false, error: "Offline setup is unavailable" })
      },
    })
  }

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return initial
}

async function update() {
  try {
    await updateWorker?.(true)
  } catch (error) {
    notify({
      available: true,
      error:
        error instanceof Error
          ? error.message
          : "The update could not be installed",
    })
  }
}

export function PwaUpdates() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (state.error) return <Box render={<output>{state.error}</output>} />

  if (!state.available) return null

  return (
    <HStack wrap>
      <Box
        render={
          <output>
            An app update is ready. Save open forms and pause your timer before
            reloading.
          </output>
        }
      />
      <Button variant="outline" onClick={update}>
        Update and reload
      </Button>
    </HStack>
  )
}
