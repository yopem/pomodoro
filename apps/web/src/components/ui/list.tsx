"use client"

import type { ComponentProps } from "react"

import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  root: {
    margin: 0,
    paddingInlineStart: `calc(${tokens["--spacing"]} * 6)`,
  },
  plain: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minInlineSize: 0,
  },
})

export type ListProps = StyleXComponentProps<
  useRender.ComponentProps<"ul" | "ol">,
  { variant?: "default" | "plain" }
>

export function List({
  render,
  variant = "default",
  xstyle,
  className,
  ...props
}: ListProps) {
  return useRender({
    defaultTagName: "ul",
    render,
    props: mergeStylexProps(
      {
        ...stylexProps(
          className,
          styles.root,
          variant === "plain" && styles.plain,
          xstyle,
        ),
        "data-slot": "list",
      },
      props,
    ),
  })
}

export type ListItemProps = StyleXComponentProps<ComponentProps<"li">>

export function ListItem({ xstyle, className, ...props }: ListItemProps) {
  return (
    <li
      data-slot="list-item"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}
