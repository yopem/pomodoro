import type { ComponentPropsWithRef } from "react"

import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon } from "lucide-react"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  control: {
    display: { default: "inline-flex", "[hidden]": "none" },
    inlineSize: "100%",
    minInlineSize: 0,
    position: "relative",
  },
  single: {
    appearance: "none",
    paddingInlineEnd: "2.25rem",
  },
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    color: tokens["--foreground"],
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    insetBlockStart: "50%",
    insetInlineEnd: "calc(0.5rem - 1px)",
    opacity: 0.8,
    pointerEvents: "none",
    position: "absolute",
    transform: "translateY(-50%)",
  },
  disabledIcon: { opacity: 0.64 },
  root: {
    backgroundColor: tokens["--background"],
    borderColor: {
      default: tokens["--input"],
      ":focus-visible": tokens["--ring"],
      "[aria-invalid]":
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    borderRadius: tokens["--radius"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    fontFamily: "inherit",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: "100%",
    minBlockSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.5rem",
      "@media (pointer: coarse)": "2.75rem",
    },
    minInlineSize: "9rem",
    opacity: { default: 1, ":disabled": 0.64 },
    paddingBlock: 0,
    paddingInline: "calc(0.75rem - 1px)",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
})

export type NativeSelectProps = StyleXComponentProps<
  ComponentPropsWithRef<"select">
>

export function NativeSelect({
  xstyle: consumerXstyle,
  className,
  ...props
}: NativeSelectProps) {
  const single =
    !props.multiple && (props.size === undefined || props.size <= 1)

  return (
    <span
      data-slot="native-select-control"
      dir={props.dir}
      hidden={props.hidden}
      {...stylex.props(styles.control)}
    >
      <select
        data-slot="native-select"
        {...mergeStylexProps(
          stylexProps(
            className,
            styles.root,
            single && styles.single,
            consumerXstyle,
          ),
          props,
        )}
      />
      {single && (
        <ChevronDownIcon
          aria-hidden="true"
          data-slot="native-select-icon"
          {...stylex.props(styles.icon, props.disabled && styles.disabledIcon)}
        />
      )}
    </span>
  )
}
