import { z } from "zod"

import { FieldError } from "@/components/ui/field"

const messageSchema = z.union([
  z.string().transform((message) => ({ message })),
  z.object({ message: z.string() }),
])

export function FieldMessages({
  id,
  errors,
}: {
  id: string
  errors: readonly unknown[]
}) {
  const messages = errors.flatMap((error) => {
    const result = messageSchema.safeParse(error)

    return result.success ? [result.data.message] : []
  })

  return (
    <FieldError id={id} match={messages.length > 0}>
      {[...new Set(messages)].join(". ")}
    </FieldError>
  )
}
