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
    maxInlineSize: 1280,
    paddingInline: { default: 32, "@media (max-width: 640px)": 20 },
  },
  workspace: {
    paddingBlock: { default: 48, "@media (max-width: 640px)": 24 },
  },
  navigation: { paddingBlock: 12 },
  focus: { maxInlineSize: 640 },
  fluid: { maxInlineSize: "none" },
})

type ContainerElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type ContainerProps = StyleXComponentProps<
  ContainerElementProps,
  {
    fluid?: boolean
    variant?: "default" | "workspace" | "navigation" | "focus"
  }
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
          (variant === "workspace" || variant === "focus") && styles.workspace,
          variant === "navigation" && styles.navigation,
          variant === "focus" && styles.focus,
          fluid && styles.fluid,
          xstyle,
        ),
        props,
      )}
      ref={ref}
    />
  )
}
