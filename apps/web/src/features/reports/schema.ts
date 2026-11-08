import { z } from "zod"

export const periodSchema = z.enum(["day", "week", "month", "year"])

export const reportSearchSchema = z.object({
  period: periodSchema.default("week"),
  date: z.iso.date().optional(),
  project: z.union([z.uuid(), z.literal("none")]).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
})
