import { MoonIcon, SunIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { updateSettings, useFocusSnapshot } from "@/features/focus/store"
import { useEventCallback } from "@/hooks/use-event-callback"
import { useTheme } from "@/themes/theme-provider"

export function ThemeSwitcher() {
  const { resolvedTheme } = useTheme()

  const { workspace, owner, hydrated, error } = useFocusSnapshot(
    (value) => value,
  )

  const [saving, setSaving] = useState(false)

  const { settings, timer } = workspace

  const forcedDark = settings.dark_while_running && timer.deadline_ms !== null

  const label = forcedDark
    ? "Dark theme is enabled while the timer runs"
    : resolvedTheme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme"

  const toggleTheme = useEventCallback(async function toggleTheme() {
    setSaving(true)

    try {
      await updateSettings(
        {
          settings: {
            ...settings,
            theme: resolvedTheme === "dark" ? "light" : "dark",
          },
          expected: settings,
        },
        { owner },
      )
    } catch {
      // The workspace store publishes the save error in the app shell.
      return
    } finally {
      setSaving(false)
    }
  })

  const [events] = useState(() => ({ toggleTheme }))

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      disabled={!hydrated || error !== null || forcedDark}
      loading={saving}
      onClick={events.toggleTheme}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon size={18} aria-hidden="true" />
      ) : (
        <MoonIcon size={18} aria-hidden="true" />
      )}
    </Button>
  )
}
