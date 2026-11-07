import type { Settings } from "./schema"

let context: AudioContext | undefined

let background: AudioBufferSourceNode | undefined

let backgroundNodes: AudioNode[] = []

let backgroundKey = ""

let alarmNodes: AudioScheduledSourceNode[] = []

export function unlockFocusAudio() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return
  context ??= new AudioContext()

  if (context.state === "suspended")
    void context.resume().catch(() => {
      console.warn("Focus audio is unavailable")
    })
}

export function syncFocusAudio(input: {
  running: boolean
  settings: Settings
}) {
  const { settings, running } = input

  if (settings.alarm === "none" || settings.alarm_volume === 0) {
    for (const node of alarmNodes) node.stop()
    alarmNodes = []
  }

  const key = running
    ? `${settings.focus_sound}:${settings.focus_sound_volume}`
    : ""

  if (
    key === backgroundKey &&
    (background ||
      !context ||
      !running ||
      settings.focus_sound === "none" ||
      settings.focus_sound_volume === 0)
  )
    return
  background?.stop()
  background?.disconnect()

  for (const node of backgroundNodes) node.disconnect()
  backgroundNodes = []
  background = undefined
  backgroundKey = key

  if (
    !context ||
    !running ||
    settings.focus_sound === "none" ||
    settings.focus_sound_volume === 0
  )
    return

  const buffer = context.createBuffer(
    1,
    context.sampleRate * 2,
    context.sampleRate,
  )

  const samples = buffer.getChannelData(0)

  for (let index = 0; index < samples.length; index += 1)
    samples[index] = Math.random() * 2 - 1
  const source = context.createBufferSource()
  const gain = context.createGain()
  source.buffer = buffer
  source.loop = true
  gain.gain.value = settings.focus_sound_volume / 500

  if (settings.focus_sound === "rain") {
    const filter = context.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 1200
    source.connect(filter).connect(gain)
    backgroundNodes.push(filter)
  } else {
    source.connect(gain)
  }

  gain.connect(context.destination)
  backgroundNodes.push(gain)
  source.start()
  background = source
}

export function playFocusAlarm(settings: Settings) {
  if (!context || settings.alarm === "none" || settings.alarm_volume === 0)
    return
  const audio = context
  const now = audio.currentTime

  for (let index = 0; index < settings.alarm_repeat; index += 1) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    const start = now + index * 0.8
    oscillator.type = "sine"
    oscillator.frequency.value = settings.alarm === "bell" ? 880 : 660

    if (settings.alarm === "chime")
      oscillator.frequency.setValueAtTime(990, start + 0.15)
    gain.gain.setValueAtTime(settings.alarm_volume / 500, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.6)
    alarmNodes.push(oscillator)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
      alarmNodes = alarmNodes.filter((node) => node !== oscillator)
    }
  }
}

export function closeFocusAudio() {
  background?.stop()
  background?.disconnect()

  for (const node of backgroundNodes) node.disconnect()
  backgroundNodes = []
  background = undefined
  backgroundKey = ""

  for (const node of alarmNodes) node.stop()
  alarmNodes = []
  const previous = context
  context = undefined

  if (previous)
    void previous.close().catch(() => {
      console.warn("Focus audio could not close")
    })
}
