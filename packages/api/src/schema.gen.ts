export interface paths {
  "/api/session": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations["session"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/api/workspace": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations["load_workspace"]
    put: operations["save_workspace"]
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/api/workspace/import": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations["import_workspace"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/callback": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations["callback"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/login": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations["login"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/logout": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations["logout"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/health": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations["health"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/openapi.json": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations["openapi"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/ready": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations["ready"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    Alarm: "none" | "bell" | "chime"
    ErrorResponse: {
      error: string
      request_id: string | null
    }
    FocusSound: "none" | "rain" | "white_noise"
    HealthResponse: {
      status: string
    }
    HourFormat: "12h" | "24h"
    ImportWorkspaceRequest: {
      expected_revision: number
      import_id: string
      workspace: components["schemas"]["Workspace"]
    }
    Project: {
      archived: boolean
      color: components["schemas"]["ProjectColor"]
      id: string
      name: string
    }
    ProjectColor:
      "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "gray"
    SaveWorkspaceRequest: {
      expected_revision: number
      workspace: components["schemas"]["Workspace"]
    }
    Session: {
      completed: boolean
      duration_seconds: number
      id: string
      project_id: string | null
      project_name: string
      started_at_ms: number
      task_id: string | null
      task_title: string
    }
    SessionResponse: {
      user: null | components["schemas"]["UserDto"]
    }
    Settings: {
      alarm: components["schemas"]["Alarm"]
      alarm_repeat: number
      alarm_volume: number
      auto_check_tasks: boolean
      auto_start_breaks: boolean
      auto_start_focus: boolean
      check_to_bottom: boolean
      dark_while_running: boolean
      focus_color?: components["schemas"]["ProjectColor"]
      focus_minutes: number
      focus_sound: components["schemas"]["FocusSound"]
      focus_sound_volume: number
      hour_format: components["schemas"]["HourFormat"]
      long_break_interval: number
      long_color?: components["schemas"]["ProjectColor"]
      long_minutes: number
      notifications: boolean
      reminder_minutes: number
      short_color?: components["schemas"]["ProjectColor"]
      short_minutes: number
      theme: components["schemas"]["Theme"]
      week_start: components["schemas"]["WeekStart"]
    }
    Task: {
      actual: number
      completed: boolean
      estimate: number
      id: string
      note: string
      project_id: string | null
      title: string
    }
    Template: {
      id: string
      name: string
      tasks: components["schemas"]["TemplateTask"][]
    }
    TemplateTask: {
      estimate: number
      note: string
      project_id: string | null
      title: string
    }
    Theme: "system" | "light" | "dark"
    Timer: {
      completed_focus_count: number
      deadline_ms: number | null
      phase: components["schemas"]["TimerPhase"]
      remaining_seconds: number
      run_id: string | null
      selected_task_id: string | null
      started_at_ms: number | null
    }
    TimerPhase: "focus" | "short_break" | "long_break"
    UserDto: {
      id: string
      name: string | null
    }
    WeekStart: "sunday" | "monday" | "saturday"
    Workspace: {
      projects: components["schemas"]["Project"][]
      schema_version: number
      sessions: components["schemas"]["Session"][]
      settings: components["schemas"]["Settings"]
      tasks: components["schemas"]["Task"][]
      templates: components["schemas"]["Template"][]
      timer: components["schemas"]["Timer"]
    }
    WorkspaceResponse: {
      revision: number
      user_id: string
      workspace: components["schemas"]["Workspace"]
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type $defs = Record<string, never>

export interface operations {
  session: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["SessionResponse"]
        }
      }
      400: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  load_workspace: {
    parameters: {
      query?: never
      header: {
        "X-Pomodoro-User": string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["WorkspaceResponse"]
        }
      }
      400: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      401: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      404: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      409: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  save_workspace: {
    parameters: {
      query?: never
      header: {
        "X-Pomodoro-User": string
      }
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["SaveWorkspaceRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["WorkspaceResponse"]
        }
      }
      400: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      401: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      403: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      404: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      409: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      413: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      415: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  import_workspace: {
    parameters: {
      query?: never
      header: {
        "X-Pomodoro-User": string
      }
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ImportWorkspaceRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["WorkspaceResponse"]
        }
      }
      400: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      401: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      403: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      404: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      409: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      413: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      415: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  callback: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      303: {
        headers: {
          "X-Request-ID"?: string
        }
        content?: never
      }
      400: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  login: {
    parameters: {
      query?: {
        return_to?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      303: {
        headers: {
          "X-Request-ID"?: string
        }
        content?: never
      }
      400: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  logout: {
    parameters: {
      query?: never
      header: {
        "X-Pomodoro-User": string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          "X-Request-ID"?: string
        }
        content?: never
      }
      400: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      401: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      403: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      409: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  health: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["HealthResponse"]
        }
      }
    }
  }
  openapi: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": unknown
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
  ready: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["HealthResponse"]
        }
      }
      429: {
        headers: {
          "Retry-After"?: number
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      503: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
      504: {
        headers: {
          "X-Request-ID"?: string
        }
        content: {
          "application/json": components["schemas"]["ErrorResponse"]
        }
      }
    }
  }
}
