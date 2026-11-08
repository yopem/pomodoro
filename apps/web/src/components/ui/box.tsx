"use client"

import type { JSX } from "react"

import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  appHeader: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    borderBlockEndColor: tokens["--border"],
    backgroundColor: tokens["--background"],
  },
  appNavigation: {
    display: "flex",
    alignItems: "center",
    justifyContent: {
      default: "center",
      "@media (max-width: 768px)": "space-between",
    },
    gap: 4,
    minInlineSize: 0,
    flexBasis: { default: "auto", "@media (max-width: 768px)": "100%" },
    order: { default: 0, "@media (max-width: 768px)": 1 },
    overflowX: "auto",
  },
})

export type BoxElement = keyof JSX.IntrinsicElements

export type BoxProps = StyleXComponentProps<useRender.ComponentProps<"div">> & {
  variant?: "default" | "appHeader" | "appNavigation"
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
