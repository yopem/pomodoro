import { spawnSync } from "node:child_process"
import { devNull } from "node:os"

export function readSnapshotEnvironment(repository: string) {
  const git: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_NO_REPLACE_OBJECTS: "1",
  }

  const result = spawnSync("git", ["rev-parse", "--local-env-vars"], {
    cwd: repository,
    env: git,
    encoding: "utf8",
    timeout: 10_000,
    killSignal: "SIGKILL",
  })

  if (result.error) throw result.error

  if (result.status !== 0) throw new Error("Git environment is unavailable")
  const isolated: NodeJS.ProcessEnv = { ...git }

  for (const name of result.stdout.trim().split("\n")) delete isolated[name]

  for (const name of Object.keys(isolated)) {
    if (
      name.startsWith("TURBO_") ||
      name.startsWith("BUN_INTERNAL_") ||
      (name.startsWith("CARGO_") &&
        name !== "CARGO_HOME" &&
        !name.endsWith("_TOKEN")) ||
      [
        "NODE_OPTIONS",
        "NODE_CHANNEL_FD",
        "NODE_CHANNEL_SERIALIZATION_MODE",
        "BUN_OPTIONS",
        "BUN_PRELOAD",
        "RUSTUP_TOOLCHAIN",
        "RUSTC_WRAPPER",
        "RUSTC_WORKSPACE_WRAPPER",
        "RUSTC",
        "RUSTDOC",
        "RUSTFLAGS",
        "RUSTDOCFLAGS",
        "RUSTFMT",
      ].includes(name)
    ) {
      delete isolated[name]
    }
  }

  delete isolated.POMODORO_GIT_REMOTE_NAME
  delete isolated.POMODORO_GIT_REMOTE_URL
  isolated.GIT_NO_REPLACE_OBJECTS = "1"
  isolated.GIT_CONFIG_GLOBAL = devNull
  isolated.GIT_CONFIG_NOSYSTEM = "1"
  isolated.GIT_TERMINAL_PROMPT = "0"
  isolated.RUSTUP_AUTO_INSTALL = "0"
  isolated.CI = "true"

  return {
    git,
    isolated,
    remoteName: git.POMODORO_GIT_REMOTE_NAME ?? null,
    remoteUrl: git.POMODORO_GIT_REMOTE_URL ?? null,
  }
}
