"use client"

import type { ComponentProps } from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  container: {
    inlineSize: {
      default: "100%",
      ':is([data-slot="card-frame"] > [data-slot="table-container"])':
        "calc(100% + 2px)",
    },
    overflowX: "auto",
    position: "relative",
    margin: {
      default: null,
      ':is([data-slot="card-frame"] > [data-slot="table-container"])': "-1px",
    },
  },
  table: {
    borderSpacing: {
      default: 0,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table"])': 0,
    },
    captionSide: "bottom",
    fontSize: "0.875rem",
    inlineSize: "100%",
    borderCollapse: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table"])':
        "separate",
    },
  },
  body: {
    position: "relative",
    borderRadius: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-body"])':
        tokens["--radius-md"],
    },
    boxShadow: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-body"])':
        "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    },
  },
  footer: {
    backgroundColor: "transparent",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    fontWeight: 500,
  },
  row: {
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: {
      default: 1,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"])': 0,
    },
    position: "relative",
    backgroundColor: {
      default: "transparent",
      ":hover": "color-mix(in srgb, var(--background), #000 2%)",
      "[data-state=selected]": "color-mix(in srgb, var(--background), #000 4%)",
    },
  },
  head: {
    blockSize: "2.5rem",
    color: tokens["--muted-foreground"],
    fontWeight: 500,
    lineHeight: 1,
    paddingInline: "0.625rem",
    textAlign: "start",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    inlineSize: {
      default: null,
      ':has([role="checkbox"])': "1px",
    },
    paddingInlineEnd: {
      default: "0.625rem",
      ':first-child:has([role="checkbox"])': 0,
    },
    paddingInlineStart: {
      default: "0.625rem",
      ':last-child:has([role="checkbox"])': 0,
    },
  },
  cell: {
    backgroundClip: "padding-box",
    lineHeight: 1,
    padding: "0.625rem",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    backgroundColor: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-cell"])':
        tokens["--card"],
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"]:hover [data-slot="table-cell"])':
        "color-mix(in srgb, var(--card), #000 2%)",
      ':is([data-theme="dark"] [data-slot="table-container"][data-variant="card"] [data-slot="table-row"]:hover [data-slot="table-cell"])':
        "color-mix(in srgb, var(--card), #fff 2%)",
    },
    borderBlockEnd: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-cell"])':
        "1px solid var(--border, currentColor)",
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"]:last-child [data-slot="table-cell"])': 0,
    },
    inlineSize: {
      default: null,
      ':has([role="checkbox"])': "1px",
    },
    paddingInlineEnd: {
      default: "0.625rem",
      ':first-child:has([role="checkbox"])': 0,
    },
    paddingInlineStart: {
      default: "0.625rem",
      ':last-child:has([role="checkbox"])': 0,
    },
  },
  caption: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    marginBlockStart: "1rem",
  },
})

export type TableVariant = "default" | "card"

export type TableProps = StyleXComponentProps<
  ComponentProps<"table">,
  {
    variant?: TableVariant
    render?: useRender.ComponentProps<"div">["render"]
  }
>

export function Table({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  render,
  ...restProps
}: StyleXComponentProps<TableProps>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    children: (
      <table
        data-slot="table"
        {...mergeStylexProps(
          stylexProps(className, styles.table, xstyle),
          props,
        )}
      />
    ),
    ...stylex.props(styles.container),
    "data-slot": "table-container",
    "data-variant": variant,
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, {}),
    render,
  })
}

export function TableHeader({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"thead">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <thead
      data-slot="table-header"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function TableBody({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"tbody">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <tbody
      data-slot="table-body"
      {...mergeStylexProps(stylexProps(className, styles.body, xstyle), props)}
    />
  )
}

export function TableFooter({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"tfoot">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <tfoot
      data-slot="table-footer"
      {...mergeStylexProps(
        stylexProps(className, styles.footer, xstyle),
        props,
      )}
    />
  )
}

export function TableRow({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"tr">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <tr
      data-slot="table-row"
      {...mergeStylexProps(stylexProps(className, styles.row, xstyle), props)}
    />
  )
}

export function TableHead({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"th">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <th
      data-slot="table-head"
      {...mergeStylexProps(stylexProps(className, styles.head, xstyle), props)}
    />
  )
}

export function TableCell({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"td">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <td
      data-slot="table-cell"
      {...mergeStylexProps(stylexProps(className, styles.cell, xstyle), props)}
    />
  )
}

export function TableCaption({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"caption">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <caption
      data-slot="table-caption"
      {...mergeStylexProps(
        stylexProps(className, styles.caption, xstyle),
        props,
      )}
    />
  )
}
