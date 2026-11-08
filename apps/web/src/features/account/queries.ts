import { createBrowserApiClient } from "@pomodoro/api/client"
import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import type { Workspace } from "@/features/focus/schema"

import { workspaceSchema } from "@/features/focus/schema"

const uuidSchema = z.string().uuid()

const revisionSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)

const sessionSchema = z.strictObject({
  user: z
    .strictObject({
      id: uuidSchema,
      name: z
        .string()
        .max(500)
        .refine((value) => value.isWellFormed() && !value.includes("\0"))
        .nullable(),
    })
    .nullable(),
})

const workspaceResponseSchema = z.strictObject({
  user_id: uuidSchema,
  workspace: workspaceSchema,
  revision: revisionSchema,
})

export type AccountUser = NonNullable<z.infer<typeof sessionSchema>["user"]>

export type AccountWorkspace = z.infer<typeof workspaceResponseSchema>

const responseTextSchema = z.string()

const errorSchema = z.strictObject({
  error: z.string(),
  request_id: uuidSchema.nullable(),
})

interface SaveWorkspaceInput {
  userId: string
  workspace: Workspace
  expected_revision: number
}

type ImportGuestInput = SaveWorkspaceInput & { import_id: string }

interface ApiResult {
  data?: unknown
  error?: unknown
  response: Response
}

export class AccountApiError extends Error {
  readonly status: number
  readonly requestId?: string

  constructor(status: number, requestId?: string) {
    super(
      status === 413
        ? "This workspace exceeds the 20,000,000-byte sync limit"
        : "The account request could not be completed",
    )
    this.name = "AccountApiError"
    this.status = status
    this.requestId = requestId
  }
}

function responseData(result: ApiResult) {
  if (!result.response.ok) {
    let error = result.error
    const text = responseTextSchema.safeParse(error)

    if (text.success) {
      try {
        error = JSON.parse(text.data)
      } catch {
        error = undefined
      }
    }

    const parsed = errorSchema.safeParse(error)
    throw new AccountApiError(
      result.response.status,
      parsed.success ? (parsed.data.request_id ?? undefined) : undefined,
    )
  }

  try {
    const data: unknown = JSON.parse(responseTextSchema.parse(result.data))

    return data
  } catch {
    throw new AccountApiError(result.response.status)
  }
}

function validatedResponse<T>(schema: z.ZodType<T>, result: ApiResult) {
  const parsed = schema.safeParse(responseData(result))

  if (!parsed.success) {
    throw new AccountApiError(result.response.status)
  }

  return parsed.data
}

function workspaceRequestBody<
  T extends { workspace: Workspace; expected_revision: number },
>(body: T) {
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 20_000_000) {
    throw new AccountApiError(413)
  }

  return body
}

function workspaceResponse(result: ApiResult, userId: string) {
  const data = validatedResponse(workspaceResponseSchema, result)

  if (data.user_id.toLowerCase() !== userId.toLowerCase()) {
    throw new AccountApiError(result.response.status)
  }

  return data
}

async function accountRequest<T>(
  action: () => Promise<T>,
  signal?: AbortSignal,
) {
  try {
    return await action()
  } catch (error) {
    if (error instanceof AccountApiError || signal?.aborted) {
      throw error
    }

    throw new AccountApiError(0)
  }
}

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: ["account", "session"],
    networkMode: "always",
    queryFn: ({ signal }) =>
      accountRequest(async () => {
        const result = await createBrowserApiClient().GET("/api/session", {
          signal,
          parseAs: "text",
        })

        return validatedResponse(sessionSchema, result)
      }, signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })
}

export function workspaceQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["account", "workspace", userId],
    networkMode: "always",
    queryFn: ({ signal }) =>
      accountRequest(async () => {
        const owner = uuidSchema.parse(userId)

        const result = await createBrowserApiClient().GET("/api/workspace", {
          params: { header: { "X-Pomodoro-User": owner } },
          signal,
          parseAs: "text",
        })

        return workspaceResponse(result, owner)
      }, signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })
}

export function saveWorkspaceMutationOptions() {
  return mutationOptions({
    mutationKey: ["account", "save"],
    networkMode: "always",
    gcTime: 0,
    mutationFn: (input: SaveWorkspaceInput) =>
      accountRequest(async () => {
        const owner = uuidSchema.parse(input.userId)

        const result = await createBrowserApiClient().PUT("/api/workspace", {
          params: { header: { "X-Pomodoro-User": owner } },
          body: workspaceRequestBody({
            workspace: workspaceSchema.parse(input.workspace),
            expected_revision: revisionSchema.parse(input.expected_revision),
          }),
          parseAs: "text",
        })

        return workspaceResponse(result, owner)
      }),
    retry: false,
  })
}

export function importGuestMutationOptions() {
  return mutationOptions({
    mutationKey: ["account", "import"],
    networkMode: "always",
    gcTime: 0,
    mutationFn: (input: ImportGuestInput) =>
      accountRequest(async () => {
        const owner = uuidSchema.parse(input.userId)

        const result = await createBrowserApiClient().POST(
          "/api/workspace/import",
          {
            params: { header: { "X-Pomodoro-User": owner } },
            body: workspaceRequestBody({
              workspace: workspaceSchema.parse(input.workspace),
              expected_revision: revisionSchema.parse(input.expected_revision),
              import_id: uuidSchema.parse(input.import_id),
            }),
            parseAs: "text",
          },
        )

        return workspaceResponse(result, owner)
      }),
    retry: false,
  })
}

export function logoutMutationOptions() {
  return mutationOptions({
    mutationKey: ["account", "logout"],
    networkMode: "always",
    gcTime: 0,
    mutationFn: (userId: string) =>
      accountRequest(async () => {
        const owner = uuidSchema.parse(userId)

        const result = await createBrowserApiClient().POST("/auth/logout", {
          params: { header: { "X-Pomodoro-User": owner } },
        })

        if (!result.response.ok) {
          responseData(result)
        }

        if (result.response.status !== 204) {
          throw new AccountApiError(result.response.status)
        }
      }),
    retry: false,
  })
}
