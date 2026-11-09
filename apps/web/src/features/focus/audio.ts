import type { Settings } from "./schema"

type Availability = "needs-gesture" | "ready" | "blocked" | "unsupported"

type AudioSnapshot = Readonly<{ availability: Availability; missed: boolean }>

interface SyncInput {
  running: boolean
  settings: Settings
}

const initialSnapshot: AudioSnapshot = Object.freeze({
  availability: "needs-gesture",
  missed: false,
})

let snapshot = initialSnapshot

let context: AudioContext | undefined

let stateListener: (() => void) | undefined

let generation = 0

let attempt = 0

let latestInput: SyncInput | undefined

let background: AudioBufferSourceNode | undefined

let backgroundNodes: AudioNode[] = []

let backgroundKey = ""

let alarms: { source: AudioScheduledSourceNode; gain: GainNode }[] = []

const listeners = new Set<() => void>()

function updateSnapshot(availability: Availability, missed = snapshot.missed) {
  if (snapshot.availability === availability && snapshot.missed === missed)
    return
  snapshot = Object.freeze({ availability, missed })

  for (const listener of listeners) listener()
}

export function subscribeFocusAudio(listener: () => void) {
  listeners.add(listener)

  if (typeof window !== "undefined" && !("AudioContext" in window))
    updateSnapshot("unsupported")

  return () => {
    listeners.delete(listener)
  }
}

export function getFocusAudioSnapshot() {
  return snapshot
}

export function getFocusAudioServerSnapshot() {
  return initialSnapshot
}

function disconnect(node: AudioNode) {
  try {
    node.disconnect()
  } catch {
    console.warn("Focus audio cleanup failed")
  }
}

function stop(node: AudioScheduledSourceNode) {
  try {
    node.stop()
  } catch {
    console.warn("Focus audio cleanup failed")
  }
}

function stopBackground() {
  if (background) {
    stop(background)
    disconnect(background)
  }

  for (const node of backgroundNodes) disconnect(node)
  background = undefined
  backgroundNodes = []
  backgroundKey = ""
}

function stopAlarms() {
  const previous = alarms
  alarms = []

  for (const { source, gain } of previous) {
    source.onended = null
    stop(source)
    disconnect(source)
    disconnect(gain)
  }
}

function current(audio: AudioContext, lifecycle: number) {
  return context === audio && generation === lifecycle
}

function stateChanged(audio: AudioContext, lifecycle: number) {
  if (!current(audio, lifecycle)) return

  if (audio.state !== "running") {
    stopBackground()
    stopAlarms()

    if (snapshot.availability !== "blocked") updateSnapshot("needs-gesture")

    return
  }

  if (snapshot.availability === "blocked") return
  updateSnapshot("ready")

  if (current(audio, lifecycle) && latestInput) syncFocusAudio(latestInput)
}

export function unlockFocusAudio() {
  if (typeof window === "undefined" || !("AudioContext" in window)) {
    updateSnapshot("unsupported")

    return
  }

  try {
    if (context?.state === "closed") closeContext()

    if (!context) {
      const audio = new AudioContext()
      context = audio
      const lifecycle = ++generation
      stateListener = () => stateChanged(audio, lifecycle)
      audio.addEventListener("statechange", stateListener)
    }

    const audio = context
    const lifecycle = generation
    const currentAttempt = ++attempt

    if (audio.state === "running") {
      updateSnapshot("ready", false)

      if (
        current(audio, lifecycle) &&
        currentAttempt === attempt &&
        latestInput
      )
        syncFocusAudio(latestInput)

      return
    }

    updateSnapshot("needs-gesture")
    void audio.resume().then(
      () => {
        if (!current(audio, lifecycle) || currentAttempt !== attempt) return

        if (audio.state === "running") {
          updateSnapshot("ready", false)

          if (
            current(audio, lifecycle) &&
            currentAttempt === attempt &&
            latestInput
          )
            syncFocusAudio(latestInput)
        }
      },
      () => {
        if (current(audio, lifecycle) && currentAttempt === attempt)
          updateSnapshot("blocked")
      },
    )
  } catch {
    closeContext()
    updateSnapshot("blocked")
  }
}

export function syncFocusAudio(input: SyncInput) {
  latestInput = input
  const { settings, running } = input

  if (settings.alarm === "none" || settings.alarm_volume === 0) {
    stopAlarms()
    updateSnapshot(snapshot.availability, false)
  }

  const key = running
    ? `${settings.focus_sound}:${settings.focus_sound_volume}`
    : ""

  const audio = context

  if (audio && audio.state !== "running") {
    stopAlarms()

    if (snapshot.availability !== "blocked") updateSnapshot("needs-gesture")
  }

  if (
    !audio ||
    snapshot.availability === "blocked" ||
    audio.state !== "running" ||
    !running ||
    settings.focus_sound === "none" ||
    settings.focus_sound_volume === 0
  ) {
    stopBackground()

    return
  }

  if (background && key === backgroundKey) return
  stopBackground()

  try {
    const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate)
    const samples = buffer.getChannelData(0)

    for (let index = 0; index < samples.length; index += 1)
      samples[index] = Math.random() * 2 - 1
    const source = audio.createBufferSource()
    background = source
    const gain = audio.createGain()
    backgroundNodes.push(gain)
    source.buffer = buffer
    source.loop = true
    gain.gain.value = settings.focus_sound_volume / 500

    if (settings.focus_sound === "rain") {
      const filter = audio.createBiquadFilter()
      backgroundNodes.push(filter)
      filter.type = "lowpass"
      filter.frequency.value = 1200
      source.connect(filter).connect(gain)
    } else source.connect(gain)
    gain.connect(audio.destination)

    if (audio.state !== "running") {
      stopBackground()
      updateSnapshot("needs-gesture")

      return
    }

    source.start()
    backgroundKey = key
  } catch {
    stopBackground()
    updateSnapshot("blocked")
  }
}

export function playFocusAlarm(settings: Settings) {
  if (settings.alarm === "none" || settings.alarm_volume === 0) return
  const audio = context

  if (audio?.state !== "running" || snapshot.availability === "blocked") {
    updateSnapshot(snapshot.availability, true)

    return
  }

  try {
    const now = audio.currentTime

    for (let index = 0; index < settings.alarm_repeat; index += 1) {
      const source = audio.createOscillator()
      let gain: GainNode

      try {
        gain = audio.createGain()
      } catch (error) {
        stop(source)
        disconnect(source)
        throw error
      }

      alarms.push({ source, gain })
      const start = now + index * 0.8
      source.type = "sine"
      source.frequency.value = settings.alarm === "bell" ? 880 : 660

      if (settings.alarm === "chime")
        source.frequency.setValueAtTime(990, start + 0.15)
      gain.gain.setValueAtTime(settings.alarm_volume / 500, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
      source.connect(gain).connect(audio.destination)

      if (audio.state !== "running") {
        stopAlarms()
        updateSnapshot("needs-gesture", true)

        return
      }

      source.onended = () => {
        disconnect(source)
        disconnect(gain)
        alarms = alarms.filter((entry) => entry.source !== source)
      }

      source.start(start)
      source.stop(start + 0.6)
    }
  } catch {
    stopAlarms()
    updateSnapshot("blocked", true)
  }
}

function closeContext() {
  const previous = context
  const listener = stateListener
  context = undefined
  stateListener = undefined
  generation += 1
  attempt += 1

  if (previous && listener) {
    try {
      previous.removeEventListener("statechange", listener)
    } catch {
      console.warn("Focus audio cleanup failed")
    }
  }

  stopBackground()
  stopAlarms()

  if (previous && previous.state !== "closed") {
    try {
      void previous.close().catch(() => {
        console.warn("Focus audio could not close")
      })
    } catch {
      console.warn("Focus audio could not close")
    }
  }
}

export function closeFocusAudio() {
  latestInput = undefined
  closeContext()
  updateSnapshot("needs-gesture", false)
}
