"use client"

import type { ComponentProps } from "react"

import { DayPicker } from "@daypicker/react"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react"

import type { StyleXComponentProps } from "@/lib/stylex"

import { stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  rangeStart: { "--calendar-range-start": 1 },
  rangeEnd: { "--calendar-range-end": 1 },
  rangeMiddle: {
    "[data-selected]": {
      "--calendar-range-radius": "0px",
      "--calendar-selected-background": tokens["--accent"],
      "--calendar-selected-color": tokens["--accent-foreground"],
    },
  },
  today: { "--calendar-today-content": '""' },
  icon: {
    blockSize: "1.125rem",
    inlineSize: "1.125rem",
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  directionIcon: { ":dir(rtl)": { rotate: "180deg" } },
  root: {
    "--calendar-range-start": 0,
    "--calendar-range-end": 0,
    "--calendar-range-radius": tokens["--radius"],
    "--calendar-selected-background": tokens["--accent-solid"],
    "--calendar-selected-color": tokens["--accent-solid-foreground"],
    "--calendar-today-content": "none",

    inlineSize: "fit-content",
    "--cell-size": {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
  },
  button: {
    alignItems: "center",
    blockSize: "var(--cell-size)",
    borderRadius: tokens["--radius"],
    color: tokens["--foreground"],
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: "var(--cell-size)",
    justifyContent: "center",
    position: "relative",
    ":disabled": { opacity: 0.64, pointerEvents: "none" },
    ":hover": { backgroundColor: tokens["--accent"] },
  },
  captionLabel: {
    alignItems: "center",
    blockSize: "100%",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    gap: "0.5rem",
  },
  day: {
    blockSize: "var(--cell-size)",
    fontSize: "0.875rem",
    inlineSize: "var(--cell-size)",
    paddingBlock: 1,
  },
  dayButton: {
    // Independent modifier flags keep both edges rounded when start === end.
    borderStartStartRadius:
      "calc(var(--calendar-range-radius) * (1 - var(--calendar-range-end) * (1 - var(--calendar-range-start))))",
    borderEndStartRadius:
      "calc(var(--calendar-range-radius) * (1 - var(--calendar-range-end) * (1 - var(--calendar-range-start))))",
    borderStartEndRadius:
      "calc(var(--calendar-range-radius) * (1 - var(--calendar-range-start) * (1 - var(--calendar-range-end))))",
    borderEndEndRadius:
      "calc(var(--calendar-range-radius) * (1 - var(--calendar-range-start) * (1 - var(--calendar-range-end))))",
    backgroundColor: {
      default: null,
      ":is([data-selected] > button)": {
        default: "var(--calendar-selected-background)",
        ":hover": "var(--calendar-selected-background)",
      },
    },
    color: {
      default: null,
      ":is([data-selected] > button)": "var(--calendar-selected-color)",
      ":is([data-outside] > button)": tokens["--muted-foreground"],
      ":is([data-selected][data-outside] > button)":
        "var(--calendar-selected-color)",
      ":is([data-disabled] > button)":
        "color-mix(in oklab, var(--muted-foreground) 72%, transparent)",
    },
    pointerEvents: {
      default: null,
      ":is([data-disabled] > button)": "none",
    },
    textDecoration: {
      default: null,
      ":is([data-disabled] > button)": "line-through",
    },
    outline: "none",
    boxShadow: {
      default: null,
      ":focus-visible": `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 50%, transparent)`,
    },
    zIndex: {
      default: null,
      ":focus-visible": 1,
    },
    "::after": {
      backgroundColor: tokens["--primary"],
      blockSize: 3,
      borderRadius: "9999px",
      bottom: "0.25rem",
      content: "var(--calendar-today-content)",
      inlineSize: 3,
      insetInlineStart: "50%",
      pointerEvents: "none",
      position: "absolute",
      transform: "translateX(-50%)",
      zIndex: 1,
    },
  },
  dropdown: {
    backgroundColor: tokens["--popover"],
    inset: 0,
    opacity: 0,
    position: "absolute",
  },
  dropdownRoot: {
    blockSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens["--shadow-sm"],
    paddingInline: "calc(0.75rem - 1px)",
    position: "relative",
    ":focus-within": {
      borderColor: tokens["--ring"],
      boxShadow: `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 50%, transparent)`,
    },
  },
  dropdowns: {
    alignItems: "center",
    blockSize: "var(--cell-size)",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.375rem",
    inlineSize: "100%",
    justifyContent: "center",
  },
  hidden: { visibility: "hidden" },
  month: { inlineSize: "100%" },
  monthCaption: {
    alignItems: "center",
    blockSize: "var(--cell-size)",
    display: "flex",
    justifyContent: "center",
    marginBlockEnd: "0.25rem",
    marginInline: "var(--cell-size)",
    paddingInline: "0.25rem",
    position: "relative",
    zIndex: 2,
  },
  months: {
    display: "flex",
    flexDirection: { default: "column", "@media (min-width: 640px)": "row" },
    gap: "0.5rem",
    position: "relative",
  },
  nav: {
    display: "flex",
    inlineSize: "100%",
    insetBlockStart: 0,
    justifyContent: "space-between",
    position: "absolute",
    zIndex: 1,
  },
  outside: { color: tokens["--muted-foreground"] },
  weekCell: {
    blockSize: "var(--cell-size)",
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    inlineSize: "var(--cell-size)",
    padding: 0,
  },
})

const buttonClassNames = stylex.props(styles.button).className

export function CalendarChevron({
  className: iconClassName,
  orientation,
  ...iconProps
}: {
  className?: string
  orientation?: "left" | "right" | "up" | "down"
}) {
  if (orientation === "left") {
    return (
      <ChevronLeftIcon
        {...stylexProps(iconClassName, styles.icon, styles.directionIcon)}
        {...iconProps}
        aria-hidden="true"
      />
    )
  }

  if (orientation === "right") {
    return (
      <ChevronRightIcon
        {...stylexProps(iconClassName, styles.icon, styles.directionIcon)}
        {...iconProps}
        aria-hidden="true"
      />
    )
  }

  return (
    <ChevronsUpDownIcon
      {...stylexProps(iconClassName, styles.icon)}
      {...iconProps}
      aria-hidden="true"
    />
  )
}

const defaultComponents = { Chevron: CalendarChevron }

function calendarClassNames(
  classNames: ComponentProps<typeof DayPicker>["classNames"],
) {
  const defaultClassNames = {
    button_next: buttonClassNames,
    button_previous: buttonClassNames,
    caption_label: stylex.props(styles.captionLabel).className,
    day: stylex.props(styles.day).className,
    day_button: stylex.props(styles.button, styles.dayButton).className,
    dropdown: stylex.props(styles.dropdown).className,
    dropdown_root: stylex.props(styles.dropdownRoot).className,
    dropdowns: stylex.props(styles.dropdowns).className,
    hidden: stylex.props(styles.hidden).className,
    month: stylex.props(styles.month).className,
    month_caption: stylex.props(styles.monthCaption).className,
    months: stylex.props(styles.months).className,
    nav: stylex.props(styles.nav).className,
    outside: stylex.props(styles.outside).className,
    range_end: stylex.props(styles.rangeEnd).className,
    range_middle: stylex.props(styles.rangeMiddle).className,
    range_start: stylex.props(styles.rangeStart).className,
    today: stylex.props(styles.today).className,
    week_number: stylex.props(styles.weekCell).className,
    weekday: stylex.props(styles.weekCell).className,
  }

  return {
    ...classNames,
    button_next: clsx(defaultClassNames.button_next, classNames?.button_next),
    button_previous: clsx(
      defaultClassNames.button_previous,
      classNames?.button_previous,
    ),
    caption_label: clsx(
      defaultClassNames.caption_label,
      classNames?.caption_label,
    ),
    day: clsx(defaultClassNames.day, classNames?.day),
    day_button: clsx(defaultClassNames.day_button, classNames?.day_button),
    dropdown: clsx(defaultClassNames.dropdown, classNames?.dropdown),
    dropdown_root: clsx(
      defaultClassNames.dropdown_root,
      classNames?.dropdown_root,
    ),
    dropdowns: clsx(defaultClassNames.dropdowns, classNames?.dropdowns),
    hidden: clsx(defaultClassNames.hidden, classNames?.hidden),
    month: clsx(defaultClassNames.month, classNames?.month),
    month_caption: clsx(
      defaultClassNames.month_caption,
      classNames?.month_caption,
    ),
    months: clsx(defaultClassNames.months, classNames?.months),
    nav: clsx(defaultClassNames.nav, classNames?.nav),
    outside: clsx(defaultClassNames.outside, classNames?.outside),
    range_end: clsx(defaultClassNames.range_end, classNames?.range_end),
    range_middle: clsx(
      defaultClassNames.range_middle,
      classNames?.range_middle,
    ),
    range_start: clsx(defaultClassNames.range_start, classNames?.range_start),
    today: clsx(defaultClassNames.today, classNames?.today),
    week_number: clsx(defaultClassNames.week_number, classNames?.week_number),
    weekday: clsx(defaultClassNames.weekday, classNames?.weekday),
  }
}

function calendarComponents(
  components: ComponentProps<typeof DayPicker>["components"],
) {
  return { ...defaultComponents, ...components }
}

const formatters = {
  formatMonthDropdown: (date: Date) =>
    date.toLocaleString("default", { month: "short" }),
}

export function Calendar({
  xstyle: consumerXstyle,
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  formatters: userFormatters,
  ...restProps
}: StyleXComponentProps<ComponentProps<typeof DayPicker>>) {
  const xstyle = consumerXstyle

  const selectionProps =
    restProps.mode === undefined
      ? { ...restProps, mode: "single" as const }
      : restProps

  return (
    <DayPicker
      {...selectionProps}
      {...stylexProps(className, styles.root, xstyle)}
      classNames={calendarClassNames(classNames)}
      components={calendarComponents(userComponents)}
      data-slot="calendar"
      formatters={userFormatters ?? formatters}
      showOutsideDays={showOutsideDays}
    />
  )
}
