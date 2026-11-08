"use client"

import type { ReactNode } from "react"

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react"

import { useEventCallback } from "@/hooks/use-event-callback"
import {
  MEDIA_QUERY,
  type ResolvedTheme,
  STORAGE_KEY,
  type Theme,
  type ThemeConfig,
  themeConfig,
} from "@/themes/theme"

function subscribeToSystemTheme(callback: () => void) {
  const media = matchMedia(MEDIA_QUERY)
  media.addEventListener("change", callback)

  return () => media.removeEventListener("change", callback)
}

function getSystemTheme() {
  return matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

function getServerTheme() {
  return "light" as const
}

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback)

  return () => window.removeEventListener("storage", callback)
}

function getServerPreference() {
  return null
}

export interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  themes?: ThemeConfig
  theme?: Theme
  forcedTheme?: ResolvedTheme
  ready?: boolean
  mirrorPreference?: boolean
  onThemeChange?: (theme: Theme) => void
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  themes = themeConfig,
  theme: controlledTheme,
  forcedTheme,
  ready: controlledReady = true,
  mirrorPreference = true,
  onThemeChange,
}: ThemeProviderProps) {
  const [preference, setThemeState] = useState<Theme | null>(null)

  function getStoredTheme() {
    try {
      const saved = localStorage.getItem(storageKey)

      if (saved === "light" || saved === "dark" || saved === "system")
        return saved
    } catch {
      return defaultTheme
    }

    return defaultTheme
  }

  const storedTheme = useSyncExternalStore(
    subscribeToStorage,
    getStoredTheme,
    getServerPreference,
  )

  const theme = controlledTheme ?? preference ?? storedTheme ?? defaultTheme

  const ready =
    controlledTheme === undefined ? storedTheme !== null : controlledReady

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerTheme,
  )

  const resolvedTheme =
    forcedTheme ?? (theme === "system" ? systemTheme : theme)

  useLayoutEffect(() => {
    if (controlledTheme === undefined || !controlledReady || !mirrorPreference)
      return

    try {
      localStorage.setItem(storageKey, controlledTheme)
    } catch {
      return
    }
  }, [controlledTheme, controlledReady, mirrorPreference, storageKey])

  useLayoutEffect(() => {
    if (!ready) return

    const root = document.documentElement

    root.classList.remove(...themes.classes.light, ...themes.classes.dark)
    root.classList.add(...themes.classes[resolvedTheme])
    root.dataset.theme = resolvedTheme

    return () => root.classList.remove(...themes.classes[resolvedTheme])
  }, [ready, resolvedTheme, themes])

  const setTheme = useEventCallback((nextTheme: Theme) => {
    if (controlledTheme !== undefined) {
      onThemeChange?.(nextTheme)

      return
    }

    try {
      localStorage.setItem(storageKey, nextTheme)
    } catch {
      setThemeState(nextTheme)

      return
    }

    setThemeState(nextTheme)
  })

  const [value, setValue] = useState({ resolvedTheme, setTheme, theme })

  if (value.resolvedTheme !== resolvedTheme || value.theme !== theme) {
    setValue({ resolvedTheme, setTheme, theme })
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) throw new Error("useTheme must be used within ThemeProvider")

  return value
}
