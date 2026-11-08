import { z } from "zod"

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
)

const originSchema = z.url({ protocol: /^https?$/ }).pipe(
  z.string().refine(function isOrigin(value) {
    const origin = new URL(value)

    return origin.href === `${origin.origin}/`
  }, "Use an HTTP origin without credentials, a path, query, or fragment"),
)

const publicConfigSchema = z
  .object({
    isProduction: z.boolean(),
    publicOrigin: z.preprocess(
      (value) => (value === "" ? undefined : value),
      originSchema.optional(),
    ),
    analyticsEnabled: z.enum(["true", "false"]).default("false"),
    gaMeasurementId: optionalText,
    umamiScriptUrl: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.url({ protocol: /^https$/ }).optional(),
    ),
    umamiWebsiteId: optionalText,
  })
  .refine(
    (config) =>
      !config.isProduction ||
      config.publicOrigin?.toLowerCase().startsWith("https://"),
    {
      message: "Set PUBLIC_ORIGIN to an HTTPS origin in production",
      path: ["publicOrigin"],
    },
  )

export const publicConfig = publicConfigSchema.parse({
  isProduction: import.meta.env.PROD,
  publicOrigin: import.meta.env.PUBLIC_ORIGIN,
  analyticsEnabled: import.meta.env.PUBLIC_ANALYTICS_ENABLED,
  gaMeasurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID,
  umamiScriptUrl: import.meta.env.PUBLIC_UMAMI_SCRIPT_URL,
  umamiWebsiteId: import.meta.env.PUBLIC_UMAMI_WEBSITE_ID,
})
