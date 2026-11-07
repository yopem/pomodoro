"use client"

import type { StyleXComponentProps } from "@/lib/stylex"
import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
})

type StackElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type StackProps = StyleXComponentProps<StackElementProps>

export function Stack({
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
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}
