import type { ChildProcess, Serializable } from "node:child_process"

import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

async function runSnapshotOwner() {
  if (process.platform === "win32")
    throw new Error("The snapshot gate requires POSIX process-group support")

  if (process.platform !== "linux")
    throw new Error(
      "The snapshot gate requires Linux process ancestry monitoring",
    )

  function identity(pid: number) {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8")
    const end = stat.lastIndexOf(")")
    const fields = stat.slice(end + 2).split(" ")
    const state = fields[0]
    const parent = Number(fields[1])
    const start = fields[19]

    if (end < 0 || !state || !Number.isSafeInteger(parent) || !start)
      throw new Error("Process ancestry is unavailable")

    return { pid, parent, start, state }
  }

  const ancestry: ReturnType<typeof identity>[] = []
  let pid = process.pid

  while (pid > 1) {
    const current = identity(pid)

    if (current.state === "Z" || current.parent < 1 || current.parent === pid)
      throw new Error("Process ancestry is unavailable")
    ancestry.push(current)
    pid = current.parent
  }

  function ownerAvailable() {
    try {
      return ancestry.every((original) => {
        const current = identity(original.pid)

        return (
          current.state !== "Z" &&
          current.state !== "X" &&
          current.start === original.start &&
          current.parent === original.parent
        )
      })
    } catch {
      return false
    }
  }

  if (!ownerAvailable()) throw new Error("Process ancestry is unavailable")

  let worker: ChildProcess | undefined
  let cancelled = false
  let failed = false
  let ready = false
  let completed = false

  function disconnectWorker() {
    const child = worker

    if (!child?.connected) return

    try {
      child.disconnect()
    } catch {
      failed = true
    }
  }

  function send(message: string | string[]) {
    const child = worker

    if (!child?.connected) {
      failed = true

      return
    }

    try {
      child.send(message, (error) => {
        if (!error) return

        failed = true
        disconnectWorker()
      })
    } catch {
      failed = true
      disconnectWorker()
    }
  }

  function cancel() {
    cancelled = true
    send("cancel")
  }

  process.once("SIGINT", cancel)
  process.once("SIGTERM", cancel)
  process.stdout.once("error", cancel)
  process.stderr.once("error", cancel)

  const deadline = setTimeout(cancel, 10_000)

  const ancestryMonitor = setInterval(() => {
    if (!ownerAvailable()) cancel()
  }, 100)

  try {
    return await new Promise<number>((resolve) => {
      worker = spawn(
        process.execPath,
        [
          "--no-env-file",
          fileURLToPath(new URL("./snapshot-check-worker.ts", import.meta.url)),
        ],
        {
          cwd: process.cwd(),
          detached: true,
          serialization: "json",
          stdio: ["inherit", "inherit", "inherit", "ipc"],
        },
      )
      const child = worker

      child.once("error", () => {
        failed = true
        disconnectWorker()

        if (!child.pid) resolve(1)
      })
      child.on("message", (message: Serializable) => {
        if (message === "ready" && !ready) {
          ready = true
          clearTimeout(deadline)
          send(cancelled ? "cancel" : process.argv.slice(2))
        } else if (message === "complete" && ready && !completed) {
          completed = true
        } else {
          failed = true
          cancel()
        }
      })
      child.once("disconnect", () => {
        if (!completed) failed = true
      })
      child.once("close", (code, signal) => {
        if (!ownerAvailable()) cancelled = true
        resolve(
          cancelled || failed || !completed || signal || code === null
            ? 1
            : code,
        )
      })

      if (cancelled) send("cancel")
    })
  } finally {
    clearTimeout(deadline)
    clearInterval(ancestryMonitor)
    process.removeListener("SIGINT", cancel)
    process.removeListener("SIGTERM", cancel)
    process.stdout.removeListener("error", cancel)
    process.stderr.removeListener("error", cancel)
  }
}

try {
  process.exitCode = await runSnapshotOwner()
} catch {
  console.error("The snapshot owner could not complete its checks")
  process.exitCode = 1
}
