import type { ComponentProps } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  root: {
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: 1.5,
    margin: 0,
    overflowWrap: "anywhere",
  },
  muted: { color: tokens["--muted-foreground"] },
  destructive: { color: tokens["--destructive"] },
  success: { color: tokens["--success-foreground"] },
  small: { fontSize: 14 },
  numeric: {
    fontFamily: tokens["--font-mono"],
    fontVariantNumeric: "tabular-nums",
  },
  eyebrow: {
    color: tokens["--muted-foreground"],
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  label: { fontWeight: 600 },
  statement: {
    fontFamily: tokens["--font-heading"],
    fontSize: { default: "3.5rem", "@media (max-width: 960px)": "2.5rem" },
    fontWeight: 600,
    letterSpacing: "-0.045em",
    lineHeight: 1.08,
    whiteSpace: "pre-line",
  },
  note: { whiteSpace: "pre-wrap" },
  strike: { textDecorationLine: "line-through" },
})

const toneStyles = {
  default: null,
  muted: styles.muted,
  destructive: styles.destructive,
  success: styles.success,
}

const variantStyles = {
  default: null,
  eyebrow: styles.eyebrow,
  label: styles.label,
  note: styles.note,
  statement: styles.statement,
}

export type TextProps = StyleXComponentProps<
  ComponentProps<"p">,
  {
    tone?: "default" | "muted" | "destructive" | "success"
    size?: "default" | "small"
    format?: "default" | "numeric"
    variant?: "default" | "eyebrow" | "label" | "note" | "statement"
    decoration?: "none" | "strike"
  }
>

export function Text({
  tone = "default",
  size = "default",
  format = "default",
  variant = "default",
  decoration = "none",
  xstyle: consumerXstyle,
  className,
  ...restProps
}: TextProps) {
  return (
    <p
      data-slot="text"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          variantStyles[variant],
          toneStyles[tone],
          size === "small" && styles.small,
          format === "numeric" && styles.numeric,
          decoration === "strike" && styles.strike,
          consumerXstyle,
        ),
        restProps,
      )}
    />
  )
}
