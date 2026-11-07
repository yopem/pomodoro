"use client"

import type { StyleXComponentProps } from "@/lib/stylex"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    inlineSize: "100%",
  },
  label: { fontSize: "0.875rem", fontWeight: 500 },
  track: {
    backgroundColor: tokens["--input"],
    blockSize: "0.375rem",
    borderRadius: "9999px",
    display: "block",
    inlineSize: "100%",
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: tokens["--primary"],
    transitionDuration: "500ms",
    transitionProperty: "all",
  },
  value: { fontSize: "0.875rem", fontVariantNumeric: "tabular-nums" },
})

export function Progress({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<ProgressPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    >
      {children ?? (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  )
}

export function ProgressLabel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ProgressPrimitive.Label.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      {...mergeStylexProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}

export function ProgressTrack({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ProgressPrimitive.Track.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      {...mergeStylexProps(stylexProps(className, styles.track, xstyle), props)}
    />
  )
}

export function ProgressIndicator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ProgressPrimitive.Indicator.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      {...mergeStylexProps(
        stylexProps(className, styles.indicator, xstyle),
        props,
      )}
    />
  )
}

export function ProgressValue({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ProgressPrimitive.Value.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      {...mergeStylexProps(stylexProps(className, styles.value, xstyle), props)}
    />
  )
}

export { ProgressPrimitive }
