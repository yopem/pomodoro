import type { ComponentPropsWithRef } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: 0,
  },
  divided: {
    gap: 8,
    paddingInline: { default: 20, "@media (max-width: 480px)": 0 },
    paddingBlock: { default: 4, "@media (max-width: 480px)": 16 },
    borderInlineStartColor: tokens["--border"],
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: {
      default: 1,
      ":first-child": 0,
      "@media (max-width: 480px)": 0,
    },
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: {
      default: 0,
      "@media (max-width: 480px)": { default: 1, ":first-child": 0 },
    },
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  value: {
    color: tokens["--foreground"],
    fontSize: "1.875rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 400,
    lineHeight: 1.25,
    margin: 0,
  },
  compactValue: {
    fontSize: {
      default: "1.25rem",
      "@media (max-width: 640px)": "1.125rem",
    },
  },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    lineHeight: "1rem",
    margin: 0,
  },
})

export function Stat({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dl">> & {
  variant?: "default" | "divided"
}) {
  return (
    <dl
      data-slot="stat"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          variant === "divided" && styles.divided,
          consumerXstyle,
        ),
        props,
      )}
    />
  )
}

export function StatLabel({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dt">>) {
  return (
    <dt
      data-slot="stat-label"
      {...mergeStylexProps(
        stylexProps(className, styles.label, consumerXstyle),
        props,
      )}
    />
  )
}

export function StatValue({
  xstyle: consumerXstyle,
  className,
  size = "default",
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dd">> & {
  size?: "default" | "compact"
}) {
  return (
    <dd
      data-slot="stat-value"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.value,
          size === "compact" && styles.compactValue,
          consumerXstyle,
        ),
        props,
      )}
    />
  )
}

export function StatDescription({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dd">>) {
  return (
    <dd
      data-slot="stat-description"
      {...mergeStylexProps(
        stylexProps(className, styles.description, consumerXstyle),
        props,
      )}
    />
  )
}
