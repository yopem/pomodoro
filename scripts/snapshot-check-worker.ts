import type { ChildProcess, Serializable } from "node:child_process"
import type { Readable, Writable } from "node:stream"

import { spawn, spawnSync } from "node:child_process"
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, extname, isAbsolute, join, resolve } from "node:path"

import { readSnapshotEnvironment } from "./env.ts"

const temporaryDirectories = new Set<string>()

const runningChecks = new Set<ChildProcess>()

const checkGroups = new Set<number>()

let interrupted = false

const cancellation = new AbortController()

let outputAvailable = true

let ownerFinished = false

let started = false

let interruption = Promise.resolve()

function signalChecks(signal: NodeJS.Signals) {
  for (const child of runningChecks) {
    if (!child.pid) continue

    try {
      process.kill(-child.pid, signal)
    } catch (cause) {
      if (!(
        cause instanceof Error &&
        "code" in cause &&
        cause.code === "ESRCH"
      )) {
        process.exitCode = 1
      }
    }
  }
}

function interruptChecks(signal: NodeJS.Signals) {
  if (interrupted) return
  interrupted = true
  process.exitCode = 1
  signalChecks(signal)
  interruption = new Promise<void>((resolve) => {
    setTimeout(() => {
      signalChecks("SIGKILL")
      resolve()
    }, 1000)
  })
  cancellation.abort()
}

process.once("SIGINT", () => interruptChecks("SIGINT"))

process.once("SIGTERM", () => interruptChecks("SIGTERM"))

function loseOwner() {
  if (!ownerFinished) interruptChecks("SIGTERM")
}

function loseOutput() {
  outputAvailable = false
  interruptChecks("SIGTERM")
}

process.once("disconnect", loseOwner)

process.stdout.on("error", loseOutput)

process.stderr.on("error", loseOutput)

process.on("message", (message: Serializable) => {
  if (message === "cancel" || started) interruptChecks("SIGTERM")
})

function isInvocationArgument(value: unknown): value is string {
  return value === String(value)
}

function workerInvocation() {
  if (!process.connected || !process.send)
    throw new Error("The snapshot worker requires a live owner")

  return new Promise<string[]>((resolve, reject) => {
    let settled = false
    const deadline = setTimeout(failStart, 10_000)

    function cleanStartup() {
      clearTimeout(deadline)
      process.removeListener("message", receive)
      process.removeListener("disconnect", failStart)
    }

    function failStart() {
      if (settled) return
      settled = true
      cleanStartup()
      reject(new Error("The snapshot owner handoff failed"))
    }

    function receive(message: Serializable) {
      if (settled) return

      try {
        if (interrupted || !process.connected || !Array.isArray(message)) {
          failStart()

          return
        }

        const values: unknown[] = message

        if (!values.every(isInvocationArgument)) {
          failStart()

          return
        }

        settled = true
        started = true
        cleanStartup()
        resolve(values)
      } catch {
        failStart()
      }
    }

    process.once("message", receive)
    process.once("disconnect", failStart)

    if (!process.send || !process.connected) {
      failStart()

      return
    }

    process.send("ready", (error) => {
      if (error) failStart()
    })
  })
}

const invocation = await workerInvocation()

if (interrupted || !process.connected)
  throw new Error("The snapshot owner is no longer available")

const repository = process.cwd()

const configuration = readSnapshotEnvironment(repository)

const gitEnvironment = configuration.git

function gitBytes(args: string[], env = gitEnvironment) {
  if (interrupted) throw new Error("The snapshot check was interrupted")

  const result = spawnSync("git", args, {
    cwd: repository,
    env,
    maxBuffer: 32 * 1024 * 1024,
    timeout: 10_000,
    killSignal: "SIGKILL",
  })

  if (result.error) throw result.error

  if (result.status !== 0) {
    throw new Error("Git could not resolve the required snapshot")
  }

  return result.stdout
}

function gitText(args: string[], env = gitEnvironment) {
  return gitBytes(args, env).toString("utf8").trimEnd()
}

async function writeOutput(stream: Writable, data: string | Buffer) {
  if (!outputAvailable || interrupted) throw new Error("Output is unavailable")

  try {
    await new Promise<void>((resolve, reject) => {
      function abort() {
        reject(new Error("Output was cancelled"))
      }

      cancellation.signal.addEventListener("abort", abort, { once: true })

      if (cancellation.signal.aborted) {
        abort()

        return
      }

      stream.write(data, (error) => {
        cancellation.signal.removeEventListener("abort", abort)

        if (error) reject(error)
        else resolve()
      })
    })
  } catch (error) {
    loseOutput()
    throw error
  }
}

async function forwardOutput(source: Readable, destination: Writable) {
  try {
    for await (const chunk of source) {
      if (!Buffer.isBuffer(chunk)) throw new Error("Invalid check output")
      await writeOutput(destination, chunk)
    }
  } catch (error) {
    loseOutput()
    source.destroy()
    throw error
  }
}

async function checkCommand(
  command: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
) {
  const [program, ...args] = command

  if (!program || interrupted) throw new Error("The check cannot start")
  await new Promise<void>((resolve, reject) => {
    const commandOwner = [
      "cancelled=0",
      "trap 'cancelled=1' INT TERM",
      'if [ "$cancelled" -eq 0 ]; then',
      '  "$@"',
      "  result=$?",
      "else",
      "  result=1",
      "fi",
      'while [ "$cancelled" -eq 1 ]; do sleep 1; done',
      'exit "$result"',
    ].join("\n")

    const child = spawn(
      "sh",
      ["-c", commandOwner, "snapshot-check", program, ...args],
      {
        cwd,
        env,
        stdio: ["inherit", "pipe", "pipe"],
        detached: true,
      },
    )

    runningChecks.add(child)

    if (child.pid) checkGroups.add(child.pid)

    const output = Promise.all([
      forwardOutput(child.stdout, process.stdout),
      forwardOutput(child.stderr, process.stderr),
    ])

    output.catch(() => interruptChecks("SIGTERM"))
    child.once("error", (cause) => {
      runningChecks.delete(child)
      reject(cause)
    })
    child.once("close", (code) => {
      runningChecks.delete(child)
      output.then(() => {
        if (code !== 0 || interrupted)
          reject(new Error(`${program} check failed`))
        else resolve()
      }, reject)
    })
  })
}

function temporaryDirectory(prefix: string) {
  if (interrupted) throw new Error("The snapshot check was interrupted")
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.add(directory)

  return directory
}

function stagedTree() {
  const directory = temporaryDirectory("pomodoro-index-")

  const index = gitText([
    "rev-parse",
    "--path-format=absolute",
    "--git-path",
    "index",
  ])

  const copiedIndex = join(directory, "index")
  copyFileSync(index, copiedIndex)

  return gitText(["write-tree"], {
    ...gitEnvironment,
    GIT_INDEX_FILE: copiedIndex,
  })
}

function readPushInput() {
  return new Promise<string>((resolve, reject) => {
    let input = ""
    const stream = process.stdin

    function cleanListeners() {
      stream.removeListener("data", receive)
      stream.removeListener("end", finish)
      stream.removeListener("error", fail)
      cancellation.signal.removeEventListener("abort", fail)
    }

    function receive(chunk: string) {
      input += chunk
    }

    function fail() {
      cleanListeners()
      stream.pause()
      stream.destroy()
      reject(new Error("The push input is unavailable or cancelled"))
    }

    function finish() {
      cleanListeners()
      stream.pause()
      resolve(input)
    }

    stream.setEncoding("utf8")
    stream.once("end", finish)
    stream.once("error", fail)
    cancellation.signal.addEventListener("abort", fail, { once: true })

    if (cancellation.signal.aborted) {
      fail()

      return
    }

    stream.on("data", receive)
  })
}

async function pushedOriginCommits() {
  const remoteName = configuration.remoteName
  const remoteUrl = configuration.remoteUrl

  if (!remoteName || !remoteUrl) {
    throw new Error("The installed hook did not capture the push remote")
  }

  if (remoteName !== "origin") {
    const remotes = gitText(["remote"]).split("\n")

    const originUrls = remotes.includes("origin")
      ? gitText(["remote", "get-url", "--push", "--all", "origin"]).split("\n")
      : []

    if (!originUrls.includes(remoteUrl)) {
      await writeOutput(
        process.stdout,
        "Snapshot gate: this push does not target origin\n",
      )

      return []
    }
  }

  const input = (await readPushInput()).trim()

  if (!input) throw new Error("The push has no ref input to verify")
  const commits = new Set<string>()
  const objectFormat = gitText(["rev-parse", "--show-object-format"])

  if (objectFormat !== "sha1" && objectFormat !== "sha256") {
    throw new Error("Unsupported Git object format")
  }

  const objectIdLength = objectFormat === "sha1" ? 40 : 64

  for (const line of input.split("\n")) {
    const fields = line.split(" ")

    if (fields.length !== 4) throw new Error("Unsupported push ref input")
    const [localRef, localId, remoteRef, remoteId] = fields

    if (
      !localRef ||
      !remoteRef ||
      !localId ||
      !remoteId ||
      !/^[a-f0-9]+$/.test(localId) ||
      !/^[a-f0-9]+$/.test(remoteId) ||
      localId.length !== objectIdLength ||
      remoteId.length !== objectIdLength ||
      !/^(refs\/heads\/|refs\/tags\/)/.test(remoteRef)
    ) {
      throw new Error("Unsupported push ref input")
    }

    gitText(["check-ref-format", remoteRef])

    if (/^0+$/.test(localId)) {
      if (localRef !== "(delete)" || /^0+$/.test(remoteId)) {
        throw new Error("Unsupported push ref input")
      }

      continue
    }

    if (
      localRef === "(delete)" ||
      gitText([
        "rev-parse",
        "--verify",
        "--end-of-options",
        `${localRef}^{object}`,
      ]) !== localId
    ) {
      throw new Error("Unsupported push ref input")
    }

    const commit = gitText(["rev-parse", "--verify", `${localId}^{commit}`])
    commits.add(commit)
  }

  return [...commits]
}

async function snapshotFiles(tree: string, directory: string) {
  const entries = gitText(["ls-tree", "-rz", "--full-tree", tree]).split("\0")
  const files: string[] = []

  for (const entry of entries) {
    await new Promise<void>((resolve) => setImmediate(resolve))

    if (interrupted) throw new Error("The snapshot check was interrupted")

    if (!entry) continue
    const match = /^(100644|100755) blob ([a-f0-9]+)\t(.+)$/s.exec(entry)

    if (!match) throw new Error("Unsupported snapshot entry or linked source")
    const [, mode, object, path] = match

    if (
      !mode ||
      !object ||
      !path ||
      isAbsolute(path) ||
      path.includes("\\") ||
      path.includes("\ufffd") ||
      path
        .split("/")
        .some((part) =>
          [".", "..", ".git", "node_modules"].includes(part.toLowerCase()),
        )
    ) {
      throw new Error("Unsupported snapshot path")
    }

    const destination = join(directory, path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, gitBytes(["cat-file", "blob", object]), {
      flag: "wx",
    })
    chmodSync(destination, mode === "100755" ? 0o755 : 0o644)
    files.push(path)
  }

  return files
}

async function checkSnapshot(tree: string) {
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(tree)) {
    throw new Error("Unsupported snapshot object ID")
  }

  const directory = temporaryDirectory("pomodoro-snapshot-")
  const files = await snapshotFiles(tree, directory)

  const environment: NodeJS.ProcessEnv = {
    ...configuration.isolated,
    PWD: directory,
    INIT_CWD: directory,
    CARGO_TARGET_DIR: join(directory, "target"),
  }

  const toolchain = readFileSync(join(directory, "bun-toolchain.json"), "utf8")
  const revision = /"revision"\s*:\s*"([a-f0-9]+)"/.exec(toolchain)?.[1]

  const runtime = spawnSync("bun", ["--revision"], {
    encoding: "utf8",
    timeout: 10_000,
    killSignal: "SIGKILL",
  })

  if (runtime.error) throw runtime.error

  if (runtime.status !== 0 || !revision || !runtime.stdout.includes(revision)) {
    throw new Error("The snapshot requires its pinned Bun revision")
  }

  await writeOutput(process.stdout, `Checking isolated snapshot ${tree}\n`)
  await checkCommand(
    ["git", "init", "--quiet", "--initial-branch=snapshot", "--template="],
    directory,
    environment,
  )
  await checkCommand(
    [
      "git",
      "config",
      "--local",
      "core.hooksPath",
      join(directory, ".git/hooks"),
    ],
    directory,
    environment,
  )
  await checkCommand(
    ["bun", "install", "--frozen-lockfile"],
    directory,
    environment,
  )

  for (const workspace of [
    { link: "apps/web/node_modules/@pomodoro/api", target: "packages/api" },
    { link: "apps/web/node_modules/@pomodoro/env", target: "packages/env" },
  ]) {
    if (
      realpathSync(join(directory, workspace.link)) !==
      realpathSync(join(directory, workspace.target))
    ) {
      throw new Error("A workspace dependency resolves outside its snapshot")
    }
  }

  await writeOutput(
    process.stdout,
    "Workspace links resolve inside the isolated snapshot\n",
  )
  const sourcePolicy = readFileSync(join(directory, "bunfig.toml"), "utf8")
  const expandedPolicy = sourcePolicy.replaceAll('  "**/*.config.*",\n', "")

  if (expandedPolicy.includes("**/*.config.*")) {
    throw new Error("The snapshot config-file ignore could not be expanded")
  }

  const policy = join(directory, ".snapshot-policy.toml")
  writeFileSync(policy, expandedPolicy, { flag: "wx" })

  const sourceFiles = files.filter((path) =>
    /\.(?:[cm]?js|jsx|ts|tsx)$/.test(path),
  )

  const formatFiles = files.filter((path) =>
    /\.(?:[cm]?js|jsx|ts|tsx|css|html|json|jsonc|md|toml|ya?ml|webmanifest)$/.test(
      path,
    ),
  )

  const supported = new Set([
    ".css",
    ".html",
    ".json",
    ".jsonc",
    ".md",
    ".png",
    ".rs",
    ".svg",
    ".toml",
    ".ts",
    ".tsx",
    ".webmanifest",
    ".yaml",
    ".yml",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
  ])

  for (const path of files) {
    if (
      !supported.has(extname(path)) &&
      ![
        ".gitignore",
        ".lefthookrc",
        ".env.example",
        "bun.lock",
        "Cargo.lock",
      ].includes(path)
    ) {
      throw new Error(`No snapshot check mapping exists for ${path}`)
    }
  }

  await checkCommand(["bun", "run", "typecheck"], directory, environment)

  if (sourceFiles.length) {
    await checkCommand(
      [
        "bun",
        `--config=${policy}`,
        "lint",
        "--no-script",
        "--no-ignore",
        "--type-aware",
        "--max-warnings=0",
        ...sourceFiles.map((path) => `./${path}`),
      ],
      directory,
      environment,
    )
  }

  if (formatFiles.length) {
    await checkCommand(
      [
        "bun",
        `--config=${policy}`,
        "fmt",
        "--no-script",
        "--check",
        ...formatFiles.map((path) => `./${path}`),
      ],
      directory,
      environment,
    )
  }

  if (files.includes(".lefthookrc")) {
    const rc = readFileSync(join(directory, ".lefthookrc"), "utf8")

    if (/\r|[\t ]+\n/.test(rc) || !rc.endsWith("\n")) {
      throw new Error("The hook rc has invalid whitespace")
    }

    await checkCommand(["sh", "-n", "./.lefthookrc"], directory, environment)
  }

  await checkCommand(
    ["cargo", "fmt", "--all", "--", "--check"],
    directory,
    environment,
  )
  await checkCommand(
    [
      "cargo",
      "clippy",
      "--workspace",
      "--all-targets",
      "--locked",
      "--",
      "-D",
      "warnings",
    ],
    directory,
    environment,
  )
}

try {
  if (process.platform === "win32") {
    throw new Error("The snapshot gate requires POSIX process-group support")
  }

  const mode = invocation[0]

  if (
    resolve(gitText(["rev-parse", "--show-toplevel"])) !== resolve(repository)
  ) {
    throw new Error("Run the snapshot gate from the repository root")
  }

  let snapshots: string[]

  if (mode === "--staged" && invocation.length === 1) snapshots = [stagedTree()]
  else if (mode === "--pre-push" && invocation.length === 1)
    snapshots = await pushedOriginCommits()
  else if (mode === "--commit" && invocation.length === 2 && invocation[1]) {
    const object = invocation[1]

    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(object)) {
      throw new Error("A full commit object ID is required")
    }

    snapshots = [gitText(["rev-parse", "--verify", `${object}^{commit}`])]
  } else throw new Error("Use --staged, --pre-push, or --commit with a full ID")

  for (const snapshot of snapshots) await checkSnapshot(snapshot)
} catch (cause) {
  process.exitCode = 1

  if (outputAvailable && !interrupted) {
    try {
      await writeOutput(
        process.stderr,
        `${cause instanceof Error ? cause.message : "Snapshot check failed"}\n`,
      )
    } catch {
      loseOutput()
    }
  }
} finally {
  await interruption

  const deadline = performance.now() + 5000
  let probeFailed = false

  while (checkGroups.size && !probeFailed) {
    for (const group of checkGroups) {
      try {
        process.kill(-group, 0)
      } catch (cause) {
        if (cause instanceof Error && "code" in cause && cause.code === "ESRCH")
          checkGroups.delete(group)
        else probeFailed = true
      }
    }

    if (checkGroups.size && performance.now() >= deadline) probeFailed = true

    if (checkGroups.size && !probeFailed)
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
  }

  if (probeFailed) {
    process.exitCode = 1

    if (outputAvailable)
      process.stderr.write(
        "Snapshot cleanup could not verify process exit; temporary directories retained\n",
      )
  } else {
    for (const directory of temporaryDirectories) {
      try {
        rmSync(directory, { recursive: true, force: true })
      } catch {
        process.exitCode = 1
      }
    }
  }
}

ownerFinished = true

if (process.connected && process.send) {
  await new Promise<void>((resolve) => {
    if (!process.connected || !process.send) {
      process.exitCode = 1
      resolve()

      return
    }

    process.send("complete", (error) => {
      if (error) process.exitCode = 1
      process.disconnect?.()
      resolve()
    })
  })
} else {
  process.exitCode = 1
}
