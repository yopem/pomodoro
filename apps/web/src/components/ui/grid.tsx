"use client"

import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"

const styles = stylex.create({
  root: {
    display: "grid",
  },
  focus: {
    alignItems: "start",
    gap: 32,
    gridTemplateColumns: {
      default: "minmax(0, 1.2fr) minmax(0, 1fr)",
      "@media (max-width: 960px)": "minmax(0, 1fr)",
    },
  },
  metrics: {
    gap: 16,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
  summary: {
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      "@media (max-width: 480px)": "minmax(0, 1fr)",
    },
  },
  workspace: {
    gap: 24,
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 768px)": "minmax(0, 1fr)",
    },
  },
})

type GridElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type GridProps = StyleXComponentProps<
  GridElementProps,
  { variant?: "default" | "workspace" | "focus" | "metrics" | "summary" }
>

export function Grid({
  variant = "default",
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: GridProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="grid"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          variant === "workspace" && styles.workspace,
          variant === "focus" && styles.focus,
          variant === "metrics" && styles.metrics,
          variant === "summary" && styles.summary,
          xstyle,
        ),
        props,
      )}
      ref={ref}
    />
  )
}
