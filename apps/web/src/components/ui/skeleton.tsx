import type { ComponentProps } from "react"

import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const skeleton = stylex.keyframes({
  to: { backgroundPositionX: "-200%" },
})

const styles = stylex.create({
  root: {
    animationDuration: "2s",
    animationIterationCount: "infinite",
    animationName: skeleton,
    animationTimingFunction: "linear",
    backgroundAttachment: "fixed",
    backgroundColor: tokens["--muted"],
    backgroundImage:
      "linear-gradient(120deg, transparent 40%, color-mix(in oklab, var(--foreground) 4%, transparent), transparent 60%)",
    backgroundPosition: "0 0",
    backgroundSize: "200% 100%",
    borderRadius: tokens["--radius"],
  },
})

export function Skeleton({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="skeleton"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}
