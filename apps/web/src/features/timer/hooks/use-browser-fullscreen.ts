import { useSyncExternalStore } from "react"

function subscribeFullscreen(listener: () => void) {
  document.addEventListener("fullscreenchange", listener)

  return () => document.removeEventListener("fullscreenchange", listener)
}

function getFullscreen() {
  return Boolean(document.fullscreenElement)
}

function getServerFullscreen() {
  return false
}

export function useBrowserFullscreen() {
  return useSyncExternalStore(
    subscribeFullscreen,
    getFullscreen,
    getServerFullscreen,
  )
}
