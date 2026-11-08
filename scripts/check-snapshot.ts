import type { ChildProcess } from "node:child_process"

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

const repository = process.cwd()

const configuration = readSnapshotEnvironment(repository)

const gitEnvironment = configuration.git

const temporaryDirectories = new Set<string>()

const runningChecks = new Set<ChildProcess>()

let interrupted = false

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
        console.error("Could not stop an owned check process group")
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
}

process.once("SIGINT", () => interruptChecks("SIGINT"))

process.once("SIGTERM", () => interruptChecks("SIGTERM"))

function gitBytes(args: string[], env = gitEnvironment) {
  const result = spawnSync("git", args, {
    cwd: repository,
    env,
    maxBuffer: 32 * 1024 * 1024,
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

async function checkCommand(
  command: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
) {
  const [program, ...args] = command

  if (!program || interrupted) throw new Error("The check cannot start")
  await new Promise<void>((resolve, reject) => {
    const child = spawn(program, args, {
      cwd,
      env,
      stdio: "inherit",
      detached: true,
    })

    runningChecks.add(child)
    child.once("error", (cause) => {
      runningChecks.delete(child)
      reject(cause)
    })
    child.once("close", (code) => {
      runningChecks.delete(child)

      if (code !== 0 || interrupted)
        reject(new Error(`${program} check failed`))
      else resolve()
    })
  })
}

function temporaryDirectory(prefix: string) {
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

function pushedOriginCommits() {
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
      console.info("Snapshot gate: this push does not target origin")

      return []
    }
  }

  const input = readFileSync(0, "utf8").trim()

  if (!input) throw new Error("The push has no ref input to verify")
  const commits = new Set<string>()

  for (const line of input.split("\n")) {
    const fields = line.split(" ")

    if (fields.length !== 4) throw new Error("Unsupported push ref input")
    const [localRef, localId, remoteRef, remoteId] = fields

    if (
      !localRef ||
      !remoteRef ||
      !localId ||
      !remoteId ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(localId) ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(remoteId)
    ) {
      throw new Error("Unsupported push ref input")
    }

    if (/^0+$/.test(localId)) continue
    const commit = gitText(["rev-parse", "--verify", `${localId}^{commit}`])
    commits.add(commit)
  }

  return [...commits]
}

function snapshotFiles(tree: string, directory: string) {
  const entries = gitText(["ls-tree", "-rz", "--full-tree", tree]).split("\0")
  const files: string[] = []

  for (const entry of entries) {
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
  const files = snapshotFiles(tree, directory)

  const environment: NodeJS.ProcessEnv = {
    ...configuration.isolated,
    PWD: directory,
    INIT_CWD: directory,
    CARGO_TARGET_DIR: join(directory, "target"),
  }

  const toolchain = readFileSync(join(directory, "bun-toolchain.json"), "utf8")
  const revision = /"revision"\s*:\s*"([a-f0-9]+)"/.exec(toolchain)?.[1]
  const runtime = spawnSync("bun", ["--revision"], { encoding: "utf8" })

  if (runtime.error) throw runtime.error

  if (runtime.status !== 0 || !revision || !runtime.stdout.includes(revision)) {
    throw new Error("The snapshot requires its pinned Bun revision")
  }

  console.info(`Checking isolated snapshot ${tree}`)
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

  console.info("Workspace links resolve inside the isolated snapshot")
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

  const mode = process.argv[2]

  if (
    resolve(gitText(["rev-parse", "--show-toplevel"])) !== resolve(repository)
  ) {
    throw new Error("Run the snapshot gate from the repository root")
  }

  let snapshots: string[]

  if (mode === "--staged" && process.argv.length === 3)
    snapshots = [stagedTree()]
  else if (mode === "--pre-push" && process.argv.length === 3)
    snapshots = pushedOriginCommits()
  else if (
    mode === "--commit" &&
    process.argv.length === 4 &&
    process.argv[3]
  ) {
    const object = process.argv[3]

    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(object)) {
      throw new Error("A full commit object ID is required")
    }

    snapshots = [gitText(["rev-parse", "--verify", `${object}^{commit}`])]
  } else throw new Error("Use --staged, --pre-push, or --commit with a full ID")

  for (const snapshot of snapshots) await checkSnapshot(snapshot)
} catch (cause) {
  console.error(
    cause instanceof Error ? cause.message : "Snapshot check failed",
  )
  process.exitCode = 1
} finally {
  await interruption

  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true })
  }
}
