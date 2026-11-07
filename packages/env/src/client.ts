import { z } from "zod"

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
)

const publicConfigSchema = z.object({
  publicOrigin: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url().optional(),
  ),
  analyticsEnabled: z.enum(["true", "false"]).default("false"),
  gaMeasurementId: optionalText,
  umamiScriptUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url({ protocol: /^https$/ }).optional(),
  ),
  umamiWebsiteId: optionalText,
})

export const publicConfig = publicConfigSchema.parse({
  publicOrigin: import.meta.env.VITE_PUBLIC_ORIGIN,
  analyticsEnabled: import.meta.env.VITE_ANALYTICS_ENABLED,
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  umamiScriptUrl: import.meta.env.VITE_UMAMI_SCRIPT_URL,
  umamiWebsiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID,
})
