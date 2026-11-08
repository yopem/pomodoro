"use client"

import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
  compact: { gap: 8 },
  page: { gap: 32 },
  relaxed: { gap: 24 },
  centered: { alignItems: "center", textAlign: "center" },
})

const spacingStyles = {
  default: null,
  compact: styles.compact,
  page: styles.page,
  relaxed: styles.relaxed,
}

type StackElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type StackProps = StyleXComponentProps<
  StackElementProps,
  {
    spacing?: "default" | "compact" | "page" | "relaxed"
    layout?: "default" | "centered"
  }
>

export function Stack({
  spacing = "default",
  layout = "default",
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: StackProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="stack"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          spacingStyles[spacing],
          layout === "centered" && styles.centered,
          xstyle,
        ),
        props,
      )}
      ref={ref}
    />
  )
}
