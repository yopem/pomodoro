import { z } from "zod"

const id = z.string().uuid()

const count = z.number().int().min(0).max(4_294_967_295)

const estimate = z.number().int().min(1).max(10_000)

const title = z.string().trim().min(1).max(500)

const note = z.string().max(10_000)

const timestamp = z
  .number()
  .int()
  .min(-8_640_000_000_000_000)
  .max(8_640_000_000_000_000)

const minutes = z.number().int().min(1).max(180)

export const projectColorSchema = z.enum([
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "gray",
])

export const taskSchema = z.strictObject({
  id,
  title,
  note,
  estimate,
  actual: count,
  completed: z.boolean(),
  project_id: id.nullable(),
})

export const projectSchema = z.strictObject({
  id,
  name: title,
  color: projectColorSchema,
  archived: z.boolean(),
})

export const templateTaskSchema = z.strictObject({
  title,
  note,
  estimate,
  project_id: id.nullable(),
})

export const templateSchema = z.strictObject({
  id,
  name: title,
  tasks: z.array(templateTaskSchema).max(10_000),
})

export const sessionSchema = z.strictObject({
  id,
  task_id: id.nullable(),
  task_title: title,
  project_id: id.nullable(),
  project_name: z.string().max(500),
  started_at_ms: timestamp,
  duration_seconds: count.min(1),
  completed: z.boolean(),
})

export const settingsSchema = z.strictObject({
  focus_minutes: minutes,
  short_minutes: minutes,
  long_minutes: minutes,
  long_break_interval: z.number().int().min(1).max(10_000),
  auto_start_breaks: z.boolean(),
  auto_start_focus: z.boolean(),
  auto_check_tasks: z.boolean(),
  check_to_bottom: z.boolean(),
  alarm: z.enum(["none", "bell", "chime"]),
  alarm_volume: z.number().int().min(0).max(100),
  alarm_repeat: z.number().int().min(1).max(10),
  focus_sound: z.enum(["none", "rain", "white_noise"]),
  focus_sound_volume: z.number().int().min(0).max(100),
  week_start: z.enum(["sunday", "monday", "saturday"]),
  hour_format: z.enum(["12h", "24h"]),
  dark_while_running: z.boolean(),
  theme: z.enum(["system", "light", "dark"]),
  reminder_minutes: z.number().int().min(0).max(180),
  notifications: z.boolean(),
})

export const timerSchema = z
  .strictObject({
    phase: z.enum(["focus", "short_break", "long_break"]),
    remaining_seconds: count,
    deadline_ms: timestamp.nullable(),
    run_id: id.nullable(),
    started_at_ms: timestamp.nullable(),
    completed_focus_count: count,
    selected_task_id: id.nullable(),
  })
  .superRefine((timer, ctx) => {
    if (timer.deadline_ms !== null && timer.run_id === null) {
      ctx.addIssue({
        code: "custom",
        message: "A running timer needs a run ID",
      })
    }

    if ((timer.run_id === null) !== (timer.started_at_ms === null)) {
      ctx.addIssue({
        code: "custom",
        message: "A timer run needs an ID and start time",
      })
    }
  })

export const workspaceSchema = z
  .strictObject({
    schema_version: z.literal(1),
    tasks: z.array(taskSchema).max(10_000),
    projects: z.array(projectSchema).max(10_000),
    templates: z.array(templateSchema).max(10_000),
    sessions: z.array(sessionSchema).max(100_000),
    settings: settingsSchema,
    timer: timerSchema,
  })
  .superRefine((workspace, ctx) => {
    for (const key of ["tasks", "projects", "templates", "sessions"] as const) {
      const ids = workspace[key].map((item) => item.id)

      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: "custom", path: [key], message: "Duplicate IDs" })
      }
    }

    if (
      workspace.timer.run_id !== null &&
      workspace.sessions.some(
        (session) => session.id === workspace.timer.run_id,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Active timer ID already belongs to a session",
      })
    }

    const projects = new Set(workspace.projects.map((project) => project.id))

    for (const task of [
      ...workspace.tasks,
      ...workspace.templates.flatMap((template) => template.tasks),
    ]) {
      if (task.project_id !== null && !projects.has(task.project_id)) {
        ctx.addIssue({
          code: "custom",
          message: "Task refers to an unknown project",
        })
      }
    }

    if (
      workspace.timer.selected_task_id !== null &&
      !workspace.tasks.some(
        (task) => task.id === workspace.timer.selected_task_id,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Timer refers to an unknown task",
      })
    }
  })

export type Task = z.infer<typeof taskSchema>

export type Project = z.infer<typeof projectSchema>

export type Template = z.infer<typeof templateSchema>

export type Session = z.infer<typeof sessionSchema>

export type Settings = z.infer<typeof settingsSchema>

export type Timer = z.infer<typeof timerSchema>

export type Workspace = z.infer<typeof workspaceSchema>

export function createEmptyWorkspace(): Workspace {
  return {
    schema_version: 1,
    tasks: [],
    projects: [],
    templates: [],
    sessions: [],
    settings: {
      focus_minutes: 25,
      short_minutes: 5,
      long_minutes: 15,
      long_break_interval: 4,
      auto_start_breaks: false,
      auto_start_focus: false,
      auto_check_tasks: false,
      check_to_bottom: false,
      alarm: "bell",
      alarm_volume: 50,
      alarm_repeat: 1,
      focus_sound: "none",
      focus_sound_volume: 50,
      week_start: "monday",
      hour_format: "24h",
      dark_while_running: false,
      theme: "system",
      reminder_minutes: 0,
      notifications: false,
    },
    timer: {
      phase: "focus",
      remaining_seconds: 1500,
      deadline_ms: null,
      run_id: null,
      started_at_ms: null,
      completed_focus_count: 0,
      selected_task_id: null,
    },
  }
}
