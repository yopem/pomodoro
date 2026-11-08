import { Link, useRouter } from "@tanstack/react-router"
import { useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Text } from "@/components/ui/text"

function subscribeFullscreen(listener: () => void) {
  document.addEventListener("fullscreenchange", listener)

  return () => document.removeEventListener("fullscreenchange", listener)
}

function getFullscreen() {
  return document.fullscreenElement !== null
}

function getServerFullscreen() {
  return false
}

export function FocusBrowserControls() {
  const router = useRouter()

  const fullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreen,
    getServerFullscreen,
  )

  const [error, setError] = useState<string | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [pending, setPending] = useState(false)

  const [events] = useState(function createEvents() {
    let fullscreenPending = false

    async function toggleFullscreen() {
      if (fullscreenPending) return

      setError(null)

      if (
        !document.fullscreenEnabled ||
        !document.documentElement.requestFullscreen ||
        !document.exitFullscreen
      ) {
        setError("Full screen is not supported or is unavailable.")

        return
      }

      fullscreenPending = true
      setPending(true)

      try {
        if (document.fullscreenElement) await document.exitFullscreen()
        else await document.documentElement.requestFullscreen()
      } catch {
        setError("Full screen could not be changed. Check browser permissions.")
      } finally {
        fullscreenPending = false
        setPending(false)
      }
    }

    function openFocusWindow() {
      setPopupBlocked(false)
      setError(null)

      try {
        const href = router.buildLocation({ to: "/focus" }).href

        const opened = window.open(
          href,
          "pomodoro-focus",
          "popup,width=640,height=780",
        )

        if (!opened) setPopupBlocked(true)
      } catch {
        setPopupBlocked(true)
      }
    }

    return { toggleFullscreen, openFocusWindow }
  })

  return (
    <HStack wrap>
      <Button
        variant="outline"
        aria-disabled={pending}
        onClick={events.toggleFullscreen}
      >
        {fullscreen ? "Exit full screen" : "Full screen"}
      </Button>
      <Button variant="outline" onClick={events.openFocusWindow}>
        Focus window
      </Button>
      {error && <Text role="alert">{error}</Text>}
      {popupBlocked && (
        <Text role="alert">
          The focus window could not open.{" "}
          <Link to="/focus">Open focus here</Link>.
        </Text>
      )}
    </HStack>
  )
}
