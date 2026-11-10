"use client"

import type { JSX } from "react"

import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  backupUpload: {
    minInlineSize: 0,
    padding: { default: 24, "@media (max-width: 640px)": 16 },
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
    backgroundColor: tokens["--muted"],
  },
  settingsNavigation: {
    position: { default: "sticky", "@media (max-width: 768px)": "static" },
    insetBlockStart: 24,
    display: "flex",
    flexDirection: { default: "column", "@media (max-width: 768px)": "row" },
    flexWrap: "wrap",
    gap: 4,
  },
  settingsSave: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-xl"],
    padding: 20,
  },
  loginPage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minBlockSize: "100svh",
    boxSizing: "border-box",
    gap: 40,
    padding: 24,
    textAlign: "center",
  },
  focusDial: {
    position: "relative",
    alignItems: "center",
    aspectRatio: "1",
    borderColor: tokens["--border"],
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: `0 0 0 12px ${tokens["--muted"]}, inset 0 0 0 12px ${tokens["--muted"]}`,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    inlineSize: "min(100%, 320px)",
    justifyContent: "center",
    marginBlock: 12,
  },
  focusTask: {
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    paddingBlockStart: 20,
    inlineSize: "100%",
    textAlign: "center",
    overflowWrap: "anywhere",
  },
  phases: {
    border: 0,
    margin: 0,
    padding: 0,
    minInlineSize: 0,
  },
  taskQueue: {
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-xl"],
    padding: { default: 24, "@media (max-width: 640px)": 16 },
    backgroundColor: tokens["--card"],
  },
  dailyOverview: {
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    paddingBlockStart: 24,
  },
  appBrandLabel: {
    display: { default: "inline", "@media (max-width: 480px)": "none" },
  },
  appHeader: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    borderBlockEndColor: tokens["--border"],
    backgroundColor: tokens["--card"],
  },
  appNavigation: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: { default: tokens["--spacing"], "@media (max-width: 390px)": 0 },
    padding: tokens["--spacing"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
    backgroundColor: tokens["--muted"],
    minInlineSize: 0,
    flexBasis: { default: "auto", "@media (max-width: 900px)": "100%" },
    order: { default: 0, "@media (max-width: 900px)": 1 },
    overflowX: "auto",
  },
})

export type BoxElement = keyof JSX.IntrinsicElements

export type BoxProps = StyleXComponentProps<useRender.ComponentProps<"div">> & {
  variant?:
    | "default"
    | "appBrandLabel"
    | "appHeader"
    | "appNavigation"
    | "focusDial"
    | "focusTask"
    | "taskQueue"
    | "dailyOverview"
    | "loginPage"
    | "settingsNavigation"
    | "settingsSave"
    | "backupUpload"
}

export function Box({
  render,
  xstyle,
  className,
  variant = "default",
  ...props
}: BoxProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeStylexProps(
      {
        ...stylexProps(
          className,
          variant === "loginPage" && styles.loginPage,
          variant === "settingsNavigation" && styles.settingsNavigation,
          variant === "settingsSave" && styles.settingsSave,
          variant === "backupUpload" && styles.backupUpload,
          variant === "focusDial" && styles.focusDial,
          variant === "focusTask" && styles.focusTask,
          variant === "taskQueue" && styles.taskQueue,
          variant === "dailyOverview" && styles.dailyOverview,
          variant === "appBrandLabel" && styles.appBrandLabel,
          variant === "appHeader" && styles.appHeader,
          variant === "appNavigation" && styles.appNavigation,
          xstyle,
        ),
        "data-slot": "box",
      },
      props,
    ),
  })
}
