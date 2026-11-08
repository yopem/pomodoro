import { useState, useSyncExternalStore } from "react"

import {
  closeFocusAudio,
  playFocusAlarm,
  syncFocusAudio,
  unlockFocusAudio,
} from "./audio"
import {
  focusNotificationPermission,
  showFocusNotification,
} from "./notifications"
import {
  createEmptyWorkspace,
  type Project,
  projectSchema,
  type Session,
  sessionSchema,
  type Settings,
  settingsSchema,
  type Task,
  taskSchema,
  type Template,
  templateSchema,
  type Timer,
  type Workspace,
  workspaceSchema,
} from "./schema"

export interface WorkspaceOwner {
  readonly identity: string | null
  readonly generation: number
}

interface MutationOwnership {
  owner: WorkspaceOwner
}

const initialOwner: WorkspaceOwner = Object.freeze({
  identity: null,
  generation: 0,
})

let activeOwner = initialOwner

export interface FocusSnapshot {
  owner: WorkspaceOwner
  identity: string | null
  workspace: Workspace
  hydrated: boolean
  error: string | null
  storageWarning: string | null
  nowMs: number
}

const initialSnapshot: FocusSnapshot = {
  owner: initialOwner,
  identity: null,
  workspace: createEmptyWorkspace(),
  hydrated: false,
  error: null,
  storageWarning: null,
  nowMs: 0,
}

let snapshot = initialSnapshot

let activeKey = "pomodoro:workspace:guest"

let interval: ReturnType<typeof setInterval> | undefined

const listeners = new Set<() => void>()

const completionListeners = new Set<(phase: Timer["phase"]) => void>()

function publish(next: Omit<FocusSnapshot, "identity" | "owner">) {
  snapshot = {
    ...next,
    identity: activeOwner.identity,
    owner: activeOwner,
  }

  try {
    syncFocusAudio({
      running:
        next.hydrated &&
        next.workspace.timer.phase === "focus" &&
        next.workspace.timer.deadline_ms !== null,
      settings: next.workspace.settings,
    })
  } catch {
    console.warn("Focus audio is unavailable")
  }

  for (const listener of listeners) listener()
}

function serializeWorkspace(workspace: Workspace) {
  const value = JSON.stringify(workspace)

  if (value.length > 20_000_000)
    throw new Error("Workspace exceeds the size limit")

  return value
}

function readWorkspace(key: string) {
  const value = window.localStorage.getItem(key)

  if (value === null) return null

  try {
    if (value.length > 20_000_000)
      throw new Error("Stored workspace exceeds the size limit")

    return workspaceSchema.parse(JSON.parse(value))
  } catch {
    throw new Error(
      "Stored workspace is invalid. Restore a valid backup before changing it.",
    )
  }
}

function storageChanged(event: StorageEvent) {
  if (event.key !== activeKey && event.key !== null) return

  try {
    const workspace = readWorkspace(activeKey)

    if (!workspace)
      throw new Error("The stored workspace was removed in another tab")
    publish({ ...snapshot, workspace, error: null, nowMs: Date.now() })
    void finishElapsedTimer()
  } catch (error) {
    publish({
      ...snapshot,
      error:
        error instanceof Error ? error.message : "Workspace operation failed",
    })
  }
}

function tick() {
  const nowMs = Date.now()

  if (snapshot.workspace.timer.deadline_ms !== null) {
    publish({ ...snapshot, nowMs })

    if (snapshot.workspace.timer.deadline_ms <= nowMs) void finishElapsedTimer()
    else void remindFocus()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", storageChanged)
    interval = setInterval(tick, 1000)

    try {
      const workspace = readWorkspace(activeKey) ?? createEmptyWorkspace()
      publish({
        workspace,
        hydrated: true,
        error: null,
        storageWarning: navigator.locks
          ? null
          : "Web Locks are unavailable. Changes are disabled to protect your data.",
        nowMs: Date.now(),
      })
      void finishElapsedTimer()
    } catch (error) {
      publish({
        ...snapshot,
        hydrated: true,
        error:
          error instanceof Error ? error.message : "Workspace operation failed",
        nowMs: Date.now(),
      })
    }
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", storageChanged)
      clearInterval(interval)
      interval = undefined
      closeFocusAudio()
    }
  }
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return initialSnapshot
}

export function useFocusSnapshot<T>(select: (value: FocusSnapshot) => T) {
  return useSyncExternalStore(
    subscribe,
    () => select(getSnapshot()),
    () => select(getServerSnapshot()),
  )
}

export function useWorkspaceMutationOwner() {
  const owner = useFocusSnapshot((value) => value.owner)
  const [initialOwner] = useState(owner)

  return initialOwner
}

export function subscribeTimerCompletion(
  listener: (phase: Timer["phase"]) => void,
) {
  completionListeners.add(listener)

  return () => {
    completionListeners.delete(listener)
  }
}

async function locked<T>(key: string, work: () => T | Promise<T>): Promise<T> {
  if (!navigator.locks)
    throw new Error("Web Locks are required to protect workspace data")

  return await navigator.locks.request(key, work)
}

async function withWorkspaceOwnership(
  { owner }: MutationOwnership,
  work: (key: string) => void,
) {
  if (typeof window === "undefined")
    throw new Error("The workspace is available in the browser only")
  const key = activeKey

  await locked(key, () => {
    if (owner !== activeOwner || key !== activeKey)
      throw new Error("The active workspace changed")
    work(key)
  })
}

async function mutate(
  change: (workspace: Workspace, nowMs: number) => void,
  ownership: MutationOwnership,
) {
  try {
    await withWorkspaceOwnership(ownership, (key) => {
      if (!snapshot.hydrated) throw new Error("Wait for the workspace to load")
      const stored = readWorkspace(key)

      if (
        !stored &&
        JSON.stringify(snapshot.workspace) !==
          JSON.stringify(createEmptyWorkspace())
      ) {
        throw new Error(
          "The stored workspace was removed. Restore a valid backup before changing it.",
        )
      }

      const workspace = stored ?? structuredClone(snapshot.workspace)
      const nowMs = Date.now()

      change(workspace, nowMs)
      const valid = workspaceSchema.parse(workspace)
      window.localStorage.setItem(key, serializeWorkspace(valid))
      publish({ ...snapshot, workspace: valid, error: null, nowMs })
    })
  } catch (error) {
    if (ownership.owner === activeOwner)
      publish({
        ...snapshot,
        error:
          error instanceof Error ? error.message : "Workspace operation failed",
      })
    throw error
  }
}

export async function setActiveWorkspace(input: {
  identity: string | null
  workspace?: unknown
  expected?: Workspace
}) {
  if (typeof window === "undefined")
    throw new Error("The workspace is available in the browser only")

  const key =
    input.identity === null
      ? "pomodoro:workspace:guest"
      : `pomodoro:workspace:account:${encodeURIComponent(input.identity)}`

  if (input.identity !== null && input.identity.trim() === "")
    throw new Error("Account identity is required")

  if (key !== activeKey) {
    closeFocusAudio()
    activeKey = key
    activeOwner = Object.freeze({
      identity: input.identity,
      generation: activeOwner.generation + 1,
    })
    publish({
      ...initialSnapshot,
      workspace: createEmptyWorkspace(),
      nowMs: Date.now(),
    })
  }

  const owner = activeOwner

  try {
    const incoming =
      input.workspace === undefined
        ? null
        : workspaceSchema.parse(input.workspace)

    const expected =
      input.expected === undefined
        ? undefined
        : workspaceSchema.parse(input.expected)

    await locked(key, () => {
      if (key !== activeKey || owner !== activeOwner)
        throw new Error("The active workspace changed")
      const stored = readWorkspace(key)

      if (
        expected !== undefined &&
        JSON.stringify(stored) !== JSON.stringify(expected)
      )
        throw new Error("Workspace changed before conflict resolution")

      if (
        stored &&
        incoming &&
        JSON.stringify(stored) !== JSON.stringify(incoming) &&
        expected === undefined
      ) {
        throw new Error(
          "Local and supplied workspaces differ. Resolve the sync conflict before switching.",
        )
      }

      const workspace =
        incoming && expected !== undefined
          ? incoming
          : (stored ?? incoming ?? createEmptyWorkspace())

      if (
        stored &&
        incoming &&
        expected !== undefined &&
        JSON.stringify(stored) !== JSON.stringify(incoming)
      ) {
        window.localStorage.setItem(`${key}:backup`, JSON.stringify(stored))
      }

      if (incoming && (!stored || expected !== undefined))
        window.localStorage.setItem(key, serializeWorkspace(workspace))
      activeKey = key
      publish({
        workspace,
        hydrated: true,
        error: null,
        storageWarning: navigator.locks
          ? null
          : "Web Locks are unavailable. Changes are disabled to protect your data.",
        nowMs: Date.now(),
      })
    })
  } catch (cause) {
    if (key === activeKey && owner === activeOwner) {
      publish({
        ...snapshot,
        hydrated: true,
        error:
          cause instanceof Error
            ? cause.message
            : "The workspace could not be loaded",
        storageWarning: navigator.locks
          ? null
          : "Web Locks are unavailable. Changes are disabled to protect your data.",
        nowMs: Date.now(),
      })
    }

    throw cause
  }

  if (owner === activeOwner) void finishElapsedTimer()
}

export async function getPendingGuestWorkspace() {
  if (typeof window === "undefined")
    throw new Error("The workspace is available in the browser only")

  return await locked("pomodoro:workspace:guest", () =>
    readWorkspace("pomodoro:workspace:guest"),
  )
}

export async function replaceActiveWorkspace(
  input: {
    expected: Workspace
    workspace: unknown
  },
  ownership: MutationOwnership,
) {
  const expected = workspaceSchema.parse(input.expected)
  const replacement = workspaceSchema.parse(input.workspace)
  await mutate((current) => {
    if (JSON.stringify(current) !== JSON.stringify(expected))
      throw new Error("Workspace changed before replacement")
    window.localStorage.setItem(`${activeKey}:backup`, JSON.stringify(current))
    Object.assign(current, replacement)
  }, ownership)
}

export async function importBackup(
  input: {
    text: string
    expected: Workspace | null
    identity: string | null
  },
  ownership: MutationOwnership,
) {
  if (typeof window === "undefined")
    throw new Error("The workspace is available in the browser only")

  if (input.text.length > 20_000_000)
    throw new Error("Backup exceeds the size limit")
  let parsed: unknown

  try {
    parsed = JSON.parse(input.text)
  } catch {
    throw new Error("Backup is not valid JSON")
  }

  const workspace = workspaceSchema.parse(parsed)

  const expected =
    input.expected === null ? null : workspaceSchema.parse(input.expected)

  if (input.identity?.trim() === "")
    throw new Error("Account identity is required")

  const key =
    input.identity === null
      ? "pomodoro:workspace:guest"
      : `pomodoro:workspace:account:${encodeURIComponent(input.identity)}`

  await withWorkspaceOwnership(ownership, (activeWorkspaceKey) => {
    if (key !== activeWorkspaceKey)
      throw new Error(
        "The active workspace changed. Review it before restoring a backup.",
      )
    const raw = window.localStorage.getItem(key)
    let stored: Workspace | null = null
    let corrupt = false

    try {
      stored = readWorkspace(key)
    } catch {
      corrupt = true
    }

    if (corrupt) {
      if (expected !== null || raw === null)
        throw new Error("Confirm recovery of the corrupt workspace")
      const recoveryKey = `${key}:corrupt`
      window.localStorage.setItem(recoveryKey, raw)
    } else if (
      expected === null ||
      JSON.stringify(stored ?? createEmptyWorkspace()) !==
        JSON.stringify(expected)
    ) {
      throw new Error("Workspace changed before backup restore")
    } else if (raw !== null) {
      window.localStorage.setItem(`${key}:backup`, raw)
    }

    window.localStorage.setItem(key, serializeWorkspace(workspace))
    activeKey = key
    publish({
      ...snapshot,
      workspace,
      hydrated: true,
      error: null,
      nowMs: Date.now(),
    })
  })

  if (ownership.owner === activeOwner) void finishElapsedTimer()
}

function phaseSeconds(workspace: Workspace, phase: Timer["phase"]) {
  const settings = workspace.settings

  if (phase === "focus") return 60 * settings.focus_minutes

  if (phase === "short_break") return 60 * settings.short_minutes

  return 60 * settings.long_minutes
}

function remaining(timer: Timer, nowMs: number) {
  return timer.deadline_ms === null
    ? timer.remaining_seconds
    : Math.max(0, (timer.deadline_ms - nowMs) / 1000)
}

function startTimerRun(workspace: Workspace, nowMs: number) {
  const timer = workspace.timer

  if (timer.deadline_ms !== null) return

  if (timer.remaining_seconds <= 0)
    throw new Error("Reset the timer before starting")
  timer.run_id ??= crypto.randomUUID()
  timer.started_at_ms ??= nowMs
  timer.deadline_ms = nowMs + Math.round(timer.remaining_seconds * 1000)
}

function recordFocus(workspace: Workspace, nowMs: number, completed: boolean) {
  const timer = workspace.timer

  if (timer.phase !== "focus" || !timer.run_id || timer.started_at_ms === null)
    return

  if (workspace.sessions.some((session) => session.id === timer.run_id)) return

  const seconds = Math.floor(
    (phaseSeconds(workspace, "focus") * 1000 -
      Math.round(remaining(timer, nowMs) * 1000)) /
      1000,
  )

  if (seconds <= 0) return

  const task = workspace.tasks.find(
    (item) => item.id === timer.selected_task_id,
  )

  const project = workspace.projects.find(
    (item) => item.id === task?.project_id,
  )

  workspace.sessions.push({
    id: timer.run_id,
    task_id: task?.id ?? null,
    task_title: task?.title ?? "Focus",
    project_id: project?.id ?? null,
    project_name: project?.name ?? "",
    started_at_ms: timer.started_at_ms,
    duration_seconds: seconds,
    completed,
  })

  if (completed && task) {
    if (task.actual === 4_294_967_295)
      throw new Error("Task count has reached its limit")
    task.actual += 1

    if (workspace.settings.auto_check_tasks && task.actual >= task.estimate)
      task.completed = true

    if (task.completed && workspace.settings.check_to_bottom) {
      workspace.tasks = [
        ...workspace.tasks.filter((item) => item.id !== task.id),
        task,
      ]
    }
  }
}

function advance(
  workspace: Workspace,
  nowMs: number,
  completed: boolean,
  autoStart: boolean,
) {
  const timer = workspace.timer
  const previous = timer.phase

  if (previous === "focus") {
    recordFocus(workspace, nowMs, completed)

    if (completed) {
      if (timer.completed_focus_count === 4_294_967_295)
        throw new Error("Focus count has reached its limit")
      timer.completed_focus_count += 1
    }

    timer.phase =
      completed &&
      timer.completed_focus_count % workspace.settings.long_break_interval === 0
        ? "long_break"
        : "short_break"
  } else {
    timer.phase = "focus"
  }

  timer.remaining_seconds = phaseSeconds(workspace, timer.phase)
  timer.deadline_ms = null
  timer.run_id = null
  timer.started_at_ms = null

  if (autoStart) startTimerRun(workspace, nowMs)
}

let reminding = false

async function remindFocus() {
  if (reminding || focusNotificationPermission() !== "granted") return
  const key = activeKey
  const owner = activeOwner
  reminding = true

  try {
    const notify = await locked(key, () => {
      if (owner !== activeOwner || key !== activeKey) return false
      const workspace = readWorkspace(key)

      if (!workspace) return false
      const { timer, settings } = workspace

      if (
        !settings.notifications ||
        settings.reminder_minutes === 0 ||
        timer.phase !== "focus" ||
        timer.deadline_ms === null ||
        timer.run_id === null
      )
        return false
      const nowMs = Date.now()

      if (
        timer.deadline_ms <= nowMs ||
        phaseSeconds(workspace, "focus") - remaining(timer, nowMs) <
          settings.reminder_minutes * 60
      )
        return false
      const reminderKey = `${key}:reminder`

      if (window.localStorage.getItem(reminderKey) === timer.run_id)
        return false
      window.localStorage.setItem(reminderKey, timer.run_id)

      return true
    })

    if (notify && owner === activeOwner)
      showFocusNotification({
        title: "Focus reminder",
        body: "Your focus timer is running.",
      })
  } catch (error) {
    if (owner === activeOwner)
      publish({
        ...snapshot,
        error:
          error instanceof Error ? error.message : "Workspace operation failed",
      })
  } finally {
    reminding = false
  }
}

function completeIfElapsed(workspace: Workspace, nowMs: number) {
  const timer = workspace.timer

  if (timer.deadline_ms === null || timer.deadline_ms > nowMs) return null
  const phase = timer.phase
  const settings = structuredClone(workspace.settings)

  const auto =
    phase === "focus" ? settings.auto_start_breaks : settings.auto_start_focus

  advance(workspace, nowMs, true, auto)

  return { phase, settings }
}

function deliverCompletion(completion: {
  phase: Timer["phase"]
  settings: Settings
}) {
  try {
    playFocusAlarm(completion.settings)
  } catch {
    console.warn("Focus alarm is unavailable")
  }

  if (completion.settings.notifications) {
    showFocusNotification({
      title: "Timer complete",
      body:
        completion.phase === "focus"
          ? "Focus time is complete."
          : "Break time is complete.",
    })
  }

  for (const listener of completionListeners) listener(completion.phase)
}

let completing = false

async function finishElapsedTimer() {
  if (completing || !snapshot.hydrated) return

  if (
    snapshot.workspace.timer.deadline_ms === null ||
    snapshot.workspace.timer.deadline_ms > Date.now()
  )
    return
  const owner = activeOwner

  completing = true
  let completion: ReturnType<typeof completeIfElapsed> = null

  try {
    await mutate(
      (workspace, nowMs) => {
        completion = completeIfElapsed(workspace, nowMs)
      },
      { owner },
    )

    if (completion && owner === activeOwner) deliverCompletion(completion)
  } catch {
    return
  } finally {
    completing = false
  }
}

async function changeTimer(
  change: (workspace: Workspace, nowMs: number) => void,
  ownership: MutationOwnership,
) {
  const { owner } = ownership
  const expected = JSON.stringify(snapshot.workspace.timer)
  let completion: ReturnType<typeof completeIfElapsed> = null
  await mutate((workspace, nowMs) => {
    if (JSON.stringify(workspace.timer) !== expected)
      throw new Error(
        "Timer changed in another tab. Review it before retrying.",
      )
    completion = completeIfElapsed(workspace, nowMs)

    if (!completion) change(workspace, nowMs)
  }, ownership)

  if (completion && owner === activeOwner) deliverCompletion(completion)
}

export async function startTimer(ownership: MutationOwnership) {
  if (ownership.owner === activeOwner) unlockFocusAudio()
  await changeTimer(
    (workspace, nowMs) => startTimerRun(workspace, nowMs),
    ownership,
  )
}

export async function pauseTimer(ownership: MutationOwnership) {
  await changeTimer((workspace, nowMs) => {
    const timer = workspace.timer

    if (timer.deadline_ms === null) return
    timer.remaining_seconds = remaining(timer, nowMs)
    timer.deadline_ms = null
  }, ownership)
}

export async function skipTimer(ownership: MutationOwnership) {
  await changeTimer(
    (workspace, nowMs) => advance(workspace, nowMs, false, false),
    ownership,
  )
}

export async function resetTimer(ownership: MutationOwnership) {
  await changeTimer((workspace, nowMs) => {
    recordFocus(workspace, nowMs, false)
    const timer = workspace.timer
    timer.remaining_seconds = phaseSeconds(workspace, timer.phase)
    timer.deadline_ms = null
    timer.run_id = null
    timer.started_at_ms = null
  }, ownership)
}

export async function selectPhase(
  input: { phase: Timer["phase"] },
  ownership: MutationOwnership,
) {
  await changeTimer((workspace, nowMs) => {
    recordFocus(workspace, nowMs, false)
    workspace.timer.phase = input.phase
    workspace.timer.remaining_seconds = phaseSeconds(workspace, input.phase)
    workspace.timer.deadline_ms = null
    workspace.timer.run_id = null
    workspace.timer.started_at_ms = null
  }, ownership)
}

export async function updateSettings(
  input: {
    settings: Settings
    expected: Settings
  },
  ownership: MutationOwnership,
) {
  const settings = settingsSchema.parse(input.settings)
  const expected = settingsSchema.parse(input.expected)
  await mutate((workspace) => {
    if (JSON.stringify(workspace.settings) !== JSON.stringify(expected))
      throw new Error("Settings changed. Review them before retrying.")

    if (
      workspace.timer.run_id !== null &&
      (workspace.settings.focus_minutes !== settings.focus_minutes ||
        workspace.settings.short_minutes !== settings.short_minutes ||
        workspace.settings.long_minutes !== settings.long_minutes)
    ) {
      throw new Error("Reset the current timer before changing durations")
    }

    workspace.settings = settings

    if (workspace.timer.run_id === null)
      workspace.timer.remaining_seconds = phaseSeconds(
        workspace,
        workspace.timer.phase,
      )
  }, ownership)
}

export async function saveTask(
  input: { task: Task; expected: Task | null },
  ownership: MutationOwnership,
) {
  const task = taskSchema.parse(input.task)

  const expected =
    input.expected === null ? null : taskSchema.parse(input.expected)

  await mutate((workspace) => {
    const current = workspace.tasks.find((item) => item.id === task.id) ?? null

    if (JSON.stringify(current) !== JSON.stringify(expected))
      throw new Error("Task changed. Review it before retrying.")

    if (
      task.project_id &&
      !workspace.projects.some(
        (project) => project.id === task.project_id && !project.archived,
      )
    )
      throw new Error("Select an active project")
    const index = workspace.tasks.findIndex((item) => item.id === task.id)

    if (index < 0) workspace.tasks.push(task)
    else workspace.tasks[index] = task

    if (task.completed && workspace.settings.check_to_bottom)
      workspace.tasks = [
        ...workspace.tasks.filter((item) => item.id !== task.id),
        task,
      ]
  }, ownership)
}

export async function deleteTask(
  input: { id: string; expected: Task },
  ownership: MutationOwnership,
) {
  const expected = taskSchema.parse(input.expected)
  await mutate((workspace) => {
    const current = workspace.tasks.find((item) => item.id === input.id)

    if (
      input.id !== expected.id ||
      JSON.stringify(current) !== JSON.stringify(expected)
    )
      throw new Error("Task changed. Review it before retrying.")

    if (workspace.timer.run_id && workspace.timer.selected_task_id === input.id)
      throw new Error("Reset or finish the selected task timer first")
    workspace.tasks = workspace.tasks.filter((task) => task.id !== input.id)

    if (workspace.timer.selected_task_id === input.id)
      workspace.timer.selected_task_id = null
  }, ownership)
}

export async function selectTask(
  input: { id: string | null },
  ownership: MutationOwnership,
) {
  await mutate((workspace) => {
    if (workspace.timer.run_id && workspace.timer.selected_task_id !== input.id)
      throw new Error(
        "Reset or finish the current timer before selecting another task",
      )

    if (
      input.id &&
      !workspace.tasks.some((task) => task.id === input.id && !task.completed)
    )
      throw new Error("Select an unfinished task")
    workspace.timer.selected_task_id = input.id
  }, ownership)
}

export async function reorderTasks(
  input: {
    ids: string[]
    expected: string[]
  },
  ownership: MutationOwnership,
) {
  await mutate((workspace) => {
    if (
      JSON.stringify(workspace.tasks.map((task) => task.id)) !==
      JSON.stringify(input.expected)
    )
      throw new Error("Task order changed. Review it before retrying.")

    if (
      input.ids.length !== workspace.tasks.length ||
      new Set(input.ids).size !== input.ids.length
    )
      throw new Error("Task order must include every task once")
    const tasks = new Map(workspace.tasks.map((task) => [task.id, task]))
    workspace.tasks = input.ids.map((id) => {
      const task = tasks.get(id)

      if (!task) throw new Error("Task order contains an unknown ID")

      return task
    })
  }, ownership)
}

export async function saveProject(
  input: {
    project: Project
    expected: Project | null
  },
  ownership: MutationOwnership,
) {
  const project = projectSchema.parse(input.project)

  const expected =
    input.expected === null ? null : projectSchema.parse(input.expected)

  await mutate((workspace) => {
    const current =
      workspace.projects.find((item) => item.id === project.id) ?? null

    if (JSON.stringify(current) !== JSON.stringify(expected))
      throw new Error("Project changed. Review it before retrying.")
    const index = workspace.projects.findIndex((item) => item.id === project.id)

    if (index < 0) workspace.projects.push(project)
    else workspace.projects[index] = project
  }, ownership)
}

export async function deleteProject(
  input: {
    id: string
    expected: Project
    expected_workspace: Workspace
  },
  ownership: MutationOwnership,
) {
  const expected = projectSchema.parse(input.expected)
  const expectedWorkspace = workspaceSchema.parse(input.expected_workspace)
  await mutate((workspace) => {
    if (JSON.stringify(workspace) !== JSON.stringify(expectedWorkspace))
      throw new Error(
        "Workspace changed. Review project removal before retrying.",
      )
    const current = workspace.projects.find((item) => item.id === input.id)

    if (
      input.id !== expected.id ||
      JSON.stringify(current) !== JSON.stringify(expected)
    )
      throw new Error("Project changed. Review it before retrying.")
    workspace.projects = workspace.projects.filter(
      (project) => project.id !== input.id,
    )

    for (const task of workspace.tasks)
      if (task.project_id === input.id) task.project_id = null

    for (const template of workspace.templates)
      for (const task of template.tasks)
        if (task.project_id === input.id) task.project_id = null
  }, ownership)
}

export async function saveTemplate(
  input: {
    template: Template
    expected: Template | null
  },
  ownership: MutationOwnership,
) {
  const template = templateSchema.parse(input.template)

  const expected =
    input.expected === null ? null : templateSchema.parse(input.expected)

  await mutate((workspace) => {
    const current =
      workspace.templates.find((item) => item.id === template.id) ?? null

    if (JSON.stringify(current) !== JSON.stringify(expected))
      throw new Error("Template changed. Review it before retrying.")

    for (const task of template.tasks)
      if (
        task.project_id &&
        !workspace.projects.some(
          (project) => project.id === task.project_id && !project.archived,
        )
      )
        throw new Error("Select an active project")

    const index = workspace.templates.findIndex(
      (item) => item.id === template.id,
    )

    if (index < 0) workspace.templates.push(template)
    else workspace.templates[index] = template
  }, ownership)
}

export async function deleteTemplate(
  input: {
    id: string
    expected: Template
  },
  ownership: MutationOwnership,
) {
  const expected = templateSchema.parse(input.expected)
  await mutate((workspace) => {
    const current = workspace.templates.find((item) => item.id === input.id)

    if (
      input.id !== expected.id ||
      JSON.stringify(current) !== JSON.stringify(expected)
    )
      throw new Error("Template changed. Review it before retrying.")
    workspace.templates = workspace.templates.filter(
      (item) => item.id !== input.id,
    )
  }, ownership)
}

export async function applyTemplate(
  input: { id: string },
  ownership: MutationOwnership,
) {
  await mutate((workspace) => {
    const template = workspace.templates.find((item) => item.id === input.id)

    if (!template) throw new Error("Template not found")

    for (const item of template.tasks) {
      const project = workspace.projects.find(
        (project) => project.id === item.project_id && !project.archived,
      )

      workspace.tasks.push({
        ...item,
        project_id: project?.id ?? null,
        id: crypto.randomUUID(),
        actual: 0,
        completed: false,
      })
    }
  }, ownership)
}

export async function saveSession(
  input: {
    session: Session
    expected: Session | null
  },
  ownership: MutationOwnership,
) {
  const session = sessionSchema.parse(input.session)

  const expected =
    input.expected === null ? null : sessionSchema.parse(input.expected)

  await mutate((workspace) => {
    if (workspace.timer.run_id === session.id)
      throw new Error("The active timer owns this session ID")

    const current =
      workspace.sessions.find((item) => item.id === session.id) ?? null

    if (JSON.stringify(current) !== JSON.stringify(expected))
      throw new Error("Session changed. Review it before retrying.")
    const index = workspace.sessions.findIndex((item) => item.id === session.id)

    if (index < 0) workspace.sessions.push(session)
    else workspace.sessions[index] = session
  }, ownership)
}

export async function deleteSession(
  input: { id: string; expected: Session },
  ownership: MutationOwnership,
) {
  const expected = sessionSchema.parse(input.expected)
  await mutate((workspace) => {
    const current = workspace.sessions.find((item) => item.id === input.id)

    if (
      input.id !== expected.id ||
      JSON.stringify(current) !== JSON.stringify(expected)
    )
      throw new Error("Session changed. Review it before retrying.")
    workspace.sessions = workspace.sessions.filter(
      (item) => item.id !== input.id,
    )
  }, ownership)
}
