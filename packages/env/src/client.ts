import { z } from "zod"

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
)

const publicConfigSchema = z.object({
  isProduction: z.boolean(),
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
  isProduction: import.meta.env.PROD,
  publicOrigin: import.meta.env.PUBLIC_ORIGIN,
  analyticsEnabled: import.meta.env.PUBLIC_ANALYTICS_ENABLED,
  gaMeasurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID,
  umamiScriptUrl: import.meta.env.PUBLIC_UMAMI_SCRIPT_URL,
  umamiWebsiteId: import.meta.env.PUBLIC_UMAMI_WEBSITE_ID,
})
