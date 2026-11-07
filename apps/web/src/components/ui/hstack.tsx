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
  wrap: { flexWrap: "wrap" },
})

type HStackElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type HStackProps = StyleXComponentProps<HStackElementProps> & {
  wrap?: boolean
}

export function HStack({
  wrap = false,
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
        stylexProps(className, styles.root, wrap && styles.wrap, xstyle),
        props,
      )}
      ref={ref}
    />
  )
}
