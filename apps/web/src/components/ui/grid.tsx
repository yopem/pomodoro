"use client"

import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"

const styles = stylex.create({
  root: {
    display: "grid",
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
  { variant?: "default" | "workspace" }
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
          xstyle,
        ),
        props,
      )}
      ref={ref}
    />
  )
}
