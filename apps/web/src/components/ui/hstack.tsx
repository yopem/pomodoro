"use client"

import type { StyleXComponentProps } from "@/lib/stylex"
import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
})

type HStackElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type HStackProps = StyleXComponentProps<HStackElementProps>

export function HStack({
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
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}
