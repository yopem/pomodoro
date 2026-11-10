import type { Plugin } from "vite"

import babel from "@rolldown/plugin-babel"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { z } from "zod"

const source = fileURLToPath(new URL("./src", import.meta.url))

function singleServiceWorkerOutput(): Plugin {
  return {
    name: "single-service-worker-output",
    config(config) {
      const output = config.build?.rolldownOptions?.output

      if (
        !output ||
        Array.isArray(output) ||
        output.inlineDynamicImports !== true
      )
        throw new Error("Unexpected service worker output configuration")

      delete output.inlineDynamicImports
      output.codeSplitting = false
    },
  }
}

const createStylexPostcss = z
  .function({
    input: [
      z.strictObject({
        cwd: z.string(),
        include: z.array(z.string()),
        babelConfig: z.record(z.string(), z.unknown()),
        useCSSLayers: z.boolean(),
      }),
    ],
    output: z.looseObject({
      postcssPlugin: z.literal("@stylexjs/postcss-plugin"),
    }),
  })
  .parse(createRequire(import.meta.url)("@stylexjs/postcss-plugin"))

export default defineConfig(({ command }) => {
  const stylexPlugins = [
    [
      "@stylexjs/babel-plugin",
      {
        aliases: { "@/*": [source + "/*"] },
        dev: command === "serve",
        runtimeInjection: false,
        treeshakeCompensation: true,
        unstable_moduleResolution: { type: "commonJS" },
      },
    ],
  ]

  const stylexPostcss = createStylexPostcss({
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    include: ["src/**/*.{js,jsx,ts,tsx}"],
    babelConfig: {
      babelrc: false,
      parserOpts: { plugins: ["typescript", "jsx"] },
      plugins: stylexPlugins,
    },
    useCSSLayers: true,
  })

  return {
    envPrefix: "PUBLIC_",
    envDir: fileURLToPath(new URL("../..", import.meta.url)),
    server: {
      host: "127.0.0.1",
      port: 13001,
      strictPort: true,
      proxy: {
        "/api": "http://127.0.0.1:18001",
        // Start serves the login page. Axum owns the other auth routes.
        "^/auth(?!/login/?(?:\\?|$))": "http://127.0.0.1:18001",
        "/openapi.json": "http://127.0.0.1:18001",
        "/health": "http://127.0.0.1:18001",
        "/ready": "http://127.0.0.1:18001",
      },
    },
    resolve: { tsconfigPaths: true, alias: { "@": source } },
    plugins: [
      babel({
        plugins: [
          ["babel-plugin-react-compiler", { target: "19" }],
          ...stylexPlugins,
        ],
      }),
      tanstackStart(),
      nitro({
        preset: "bun",
        routeRules: {
          "/sw.js": {
            headers: {
              "Cache-Control": "no-cache",
              "Service-Worker-Allowed": "/",
            },
          },
        },
      }),
      viteReact(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src/service-worker",
        outDir: ".output/public",
        filename: "sw.ts",
        registerType: "prompt",
        injectRegister: false,
        manifest: false,
        includeAssets: [
          "favicon.svg",
          "icon-192.png",
          "icon-512.png",
          "icon-maskable.png",
          "offline.html",
          "offline.css",
        ],
        injectManifest: {
          buildPlugins: { vite: [singleServiceWorkerOutput()] },
          globPatterns: ["**/*.{js,css,woff2,png,svg}"],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
      }),
    ],
    css: { postcss: { plugins: [stylexPostcss] } },
  }
})
