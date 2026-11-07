import babel from "@rolldown/plugin-babel"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

const source = fileURLToPath(new URL("./src", import.meta.url))
const stylexPlugins = [
  [
    "@stylexjs/babel-plugin",
    {
      aliases: { "@/*": [source + "/*"] },
      dev: process.env.NODE_ENV !== "production",
      runtimeInjection: false,
      treeshakeCompensation: true,
      unstable_moduleResolution: { type: "commonJS" },
    },
  ],
]
const stylexPostcss = createRequire(import.meta.url)(
  "@stylexjs/postcss-plugin",
)({
  cwd: fileURLToPath(new URL(".", import.meta.url)),
  include: ["src/**/*.{js,jsx,ts,tsx}"],
  babelConfig: {
    babelrc: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: stylexPlugins,
  },
  useCSSLayers: true,
})

if (typeof stylexPostcss?.postcssPlugin !== "string") {
  throw new Error("Invalid StyleX PostCSS plugin")
}

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:4000",
      "/auth": "http://127.0.0.1:4000",
      "/openapi.json": "http://127.0.0.1:4000",
    },
  },
  resolve: { tsconfigPaths: true, alias: { "@": source } },
  plugins: [
    babel({
      plugins: [["babel-plugin-react-compiler", { target: "19" }], ...stylexPlugins],
    }),
    tanstackStart(),
    nitro({ preset: "bun" }),
    viteReact(),
  ],
  css: { postcss: { plugins: [stylexPostcss] } },
})
