import * as stylex from "@stylexjs/stylex"

import { tokens } from "@/styles/tokens.stylex"

export const appStyles = stylex.create({
  page: {
    inlineSize: "100%",
    maxInlineSize: 1160,
    marginInline: "auto",
    paddingBlock: { default: 40, "@media (max-width: 640px)": 24 },
    paddingInline: { default: 32, "@media (max-width: 640px)": 20 },
    gap: 32,
  },
  pageHeader: {
    alignItems: "flex-start",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  muted: { color: tokens["--muted-foreground"] },
  eyebrow: {
    color: tokens["--muted-foreground"],
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  compact: { gap: 8 },
  row: { flexWrap: "wrap", gap: 12 },
  spread: { justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  grid: {
    display: "grid",
    gap: 24,
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 768px)": "minmax(0, 1fr)",
    },
  },
  section: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
    padding: { default: 24, "@media (max-width: 640px)": 20 },
  },
  empty: { paddingBlock: 48, textAlign: "center", alignItems: "center" },
  error: { color: tokens["--destructive"] },
  small: { fontSize: 14 },
  actions: { justifyContent: "flex-end", flexWrap: "wrap", gap: 8 },
  fieldGrid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 520px)": "minmax(0, 1fr)",
    },
  },
  fullWidth: { inlineSize: "100%" },
  mono: {
    fontFamily: tokens["--font-mono"],
    fontVariantNumeric: "tabular-nums",
  },
})
