import * as stylex from "@stylexjs/stylex"

import type { Project } from "@/features/focus/schema"

import { tokens } from "@/styles/tokens.stylex"

export const colorStyles = stylex.create({
  red: { color: tokens["--destructive-foreground"] },
  orange: {
    color: `color-mix(in oklch, ${tokens["--destructive-foreground"]}, ${tokens["--warning-foreground"]})`,
  },
  yellow: {
    color: `color-mix(in oklch, ${tokens["--warning"]} 55%, ${tokens["--foreground"]})`,
  },
  green: { color: tokens["--success-foreground"] },
  blue: { color: tokens["--info-foreground"] },
  purple: {
    color: `color-mix(in oklch, ${tokens["--destructive-foreground"]}, ${tokens["--info-foreground"]})`,
  },
  gray: { color: tokens["--muted-foreground"] },
})

const styles = stylex.create({
  dot: {
    blockSize: "0.75rem",
    borderRadius: "50%",
    display: "inline-block",
    inlineSize: "0.75rem",
    flexShrink: 0,
  },
})

export function ColorIndicator({ color }: { color: Project["color"] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      {...stylex.props(styles.dot, colorStyles[color])}
    >
      <circle cx="6" cy="6" r="6" fill="currentColor" />
    </svg>
  )
}
