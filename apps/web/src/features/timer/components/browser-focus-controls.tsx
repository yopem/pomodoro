import { Link, useRouter } from "@tanstack/react-router"
import { AppWindowIcon, MaximizeIcon, MinimizeIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Text } from "@/components/ui/text"
import { useBrowserFullscreen } from "@/features/timer/hooks/use-browser-fullscreen"

export function FocusBrowserControls() {
  const router = useRouter()

  const fullscreen = useBrowserFullscreen()

  const [error, setError] = useState<string | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [pending, setPending] = useState(false)

  const [{ toggleFullscreen, listenForFullscreenEscape, openFocusWindow }] =
    useState(function createEvents() {
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
          setError(
            "Full screen could not be changed. Check browser permissions.",
          )
        } finally {
          fullscreenPending = false
          setPending(false)
        }
      }

      function dismissFullscreen(event: KeyboardEvent) {
        if (
          event.key === "Escape" &&
          !event.defaultPrevented &&
          document.fullscreenElement
        ) {
          event.preventDefault()
          void toggleFullscreen()
        }
      }

      function listenForFullscreenEscape(element: HTMLDivElement | null) {
        if (!element) return

        document.addEventListener("keydown", dismissFullscreen)

        return () => document.removeEventListener("keydown", dismissFullscreen)
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

      return { toggleFullscreen, listenForFullscreenEscape, openFocusWindow }
    })

  return (
    <HStack wrap ref={listenForFullscreenEscape}>
      <Button
        variant="outline"
        size="icon"
        aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        title={fullscreen ? "Exit full screen" : "Full screen"}
        aria-disabled={pending}
        onClick={toggleFullscreen}
      >
        {fullscreen ? (
          <MinimizeIcon size={16} aria-hidden="true" />
        ) : (
          <MaximizeIcon size={16} aria-hidden="true" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Focus window"
        title="Focus window"
        onClick={openFocusWindow}
      >
        <AppWindowIcon size={16} aria-hidden="true" />
      </Button>
      {error && (
        <Text role="alert">
          {error} <Link to="/focus">Open focus view instead</Link>.
        </Text>
      )}
      {popupBlocked && (
        <Text role="alert">
          The focus window could not open.{" "}
          <Link to="/focus">Open focus here</Link>.
        </Text>
      )}
    </HStack>
  )
}
