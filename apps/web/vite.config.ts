import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

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
  resolve: { tsconfigPaths: true },
  plugins: [tanstackStart(), nitro({ preset: "bun" }), viteReact()],
})
