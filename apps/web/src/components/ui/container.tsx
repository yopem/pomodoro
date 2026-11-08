"use client"

import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  root: {
    inlineSize: "100%",
    marginInline: "auto",
    maxInlineSize: "90rem",
    paddingInline: `calc(${tokens["--spacing"]} * 4)`,
  },
  appWidth: {
    maxInlineSize: 1160,
    paddingInline: { default: 32, "@media (max-width: 640px)": 20 },
  },
  workspace: {
    paddingBlock: { default: 40, "@media (max-width: 640px)": 24 },
  },
  navigation: { paddingBlock: 16 },
  fluid: { maxInlineSize: "none" },
})

type ContainerElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type ContainerProps = StyleXComponentProps<
  ContainerElementProps,
  { fluid?: boolean; variant?: "default" | "workspace" | "navigation" }
>

export function Container({
  fluid = false,
  variant = "default",
  xstyle,
  className,
  ref,
  ...props
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          variant !== "default" && styles.appWidth,
          variant === "workspace" && styles.workspace,
          variant === "navigation" && styles.navigation,
          fluid && styles.fluid,
          xstyle,
        ),
        props,
      )}
      ref={ref}
    />
  )
}
