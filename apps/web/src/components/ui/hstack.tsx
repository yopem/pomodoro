"use client"

import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
  row: { flexWrap: "wrap", gap: 12 },
  spread: { flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  pageHeader: {
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  actions: { flexWrap: "wrap", justifyContent: "flex-end", gap: 8 },
  centered: { flexWrap: "wrap", justifyContent: "center", gap: 8 },
  wrap: { flexWrap: "wrap" },
  noWrap: { flexWrap: "nowrap" },
})

const layoutStyles = {
  default: null,
  row: styles.row,
  spread: styles.spread,
  pageHeader: styles.pageHeader,
  actions: styles.actions,
  centered: styles.centered,
}

type HStackElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type HStackProps = StyleXComponentProps<HStackElementProps> & {
  wrap?: boolean
  layout?: "default" | "row" | "spread" | "pageHeader" | "actions" | "centered"
}

export function HStack({
  wrap,
  layout = "default",
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: HStackProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="hstack"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          layoutStyles[layout],
          wrap === true && styles.wrap,
          wrap === false && styles.noWrap,
          xstyle,
        ),
        props,
      )}
      ref={ref}
    />
  )
}
