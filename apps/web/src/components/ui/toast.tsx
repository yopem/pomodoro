"use client"

import type { ComponentProps } from "react"

import { Toast } from "@base-ui/react/toast"
import * as stylex from "@stylexjs/stylex"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react"

import type { StyleXComponentProps, StyleXProps } from "@/lib/stylex"

import { buttonVariants } from "@/components/ui/button"
import { mergeStylexProps } from "@/lib/stylex"
import { themeMarker, tokens } from "@/styles/tokens.stylex"

const successOdd = stylex.keyframes({
  "0%": { scale: 1 },
  "30%": { scale: 1.025 },
  "60%": { scale: 0.99 },
  "100%": { scale: 1 },
})

const successEven = stylex.keyframes({
  "0%": { scale: 1 },
  "30%": { scale: 1.025 },
  "59.999%": { scale: 0.99 },
  "100%": { scale: 1 },
})

const errorOdd = stylex.keyframes({
  "0%": { translate: "0 0" },
  "25%": { translate: "-3px 0" },
  "50%": { translate: "3px 0" },
  "75%": { translate: "-3px 0" },
  "100%": { translate: "0 0" },
})

const errorEven = stylex.keyframes({
  "0%": { translate: "0 0" },
  "25%": { translate: "-3px 0" },
  "50%": { translate: "3px 0" },
  "74.999%": { translate: "-3px 0" },
  "100%": { translate: "0 0" },
})

const spin = stylex.keyframes({ to: { transform: "rotate(360deg)" } })

const styles = stylex.create({
  viewport: {
    display: "flex",
    inlineSize: "calc(100% - var(--toast-inset) * 2)",
    marginInline: "auto",
    maxInlineSize: "22.5rem",
    position: "fixed",
    zIndex: 60,
    "--toast-inset": { default: "1rem", "@media (min-width: 640px)": "2rem" },
    "[data-position*=top]": { insetBlockStart: "var(--toast-inset)" },
    "[data-position*=bottom]": { insetBlockEnd: "var(--toast-inset)" },
    "[data-position*=left]": { insetInlineStart: "var(--toast-inset)" },
    "[data-position*=right]": { insetInlineEnd: "var(--toast-inset)" },
    "[data-position*=center]": {
      insetInlineStart: "50%",
      transform: "translateX(-50%)",
    },
  },
  root: {
    backgroundClip: "padding-box",
    backgroundColor:
      "color-mix(in srgb, var(--popover), #000 calc(1% * max(0, var(--toast-index, 0))))",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    color: tokens["--popover-foreground"],
    blockSize: "var(--toast-calc-height)",
    inlineSize: "100%",
    position: "absolute",
    transition: {
      default:
        "transform .5s cubic-bezier(.22,1,.36,1), opacity .5s, height .15s, background-color .5s",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    userSelect: "none",
    zIndex: "calc(9999 - var(--toast-index))",
    "--toast-calc-height": "var(--toast-frontmost-height, var(--toast-height))",
    "--toast-gap": "0.75rem",
    "--toast-peek": "0.75rem",
    "--toast-scale": "calc(max(0, 1 - (var(--toast-index) * .1)))",
    "--toast-shrink": "calc(1 - var(--toast-scale))",
    "::before": {
      borderRadius: "calc(var(--radius-md) - 1px)",
      boxShadow: {
        default: "0 1px rgb(0 0 0 / 0.04)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 -1px rgb(255 255 255 / 0.06)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "::after": {
      blockSize: "calc(var(--toast-gap) + 1px)",
      content: '""',
      inlineSize: "100%",
      insetInlineStart: 0,
      position: "absolute",
    },
    "[data-position*=right]": { insetInlineEnd: 0, insetInlineStart: "auto" },
    "[data-position*=left]": { insetInlineEnd: "auto", insetInlineStart: 0 },
    "[data-position*=center]": { insetInline: 0 },
    "[data-position*=top]": {
      bottom: "auto",
      insetBlockStart: 0,
      transform:
        "translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-swipe-movement-y) + (var(--toast-index) * var(--toast-peek)) + (var(--toast-shrink) * var(--toast-calc-height)))) scale(var(--toast-scale))",
      transformOrigin: "50% calc(50% - 50% * min(var(--toast-index, 0), 1))",
      "--toast-calc-offset-y":
        "calc(var(--toast-offset-y) + var(--toast-index) * var(--toast-gap) + var(--toast-swipe-movement-y))",
      "::after": { insetBlockStart: "100%" },
    },
    "[data-position*=bottom]": {
      insetBlockEnd: 0,
      top: "auto",
      transform:
        "translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-swipe-movement-y) - (var(--toast-index) * var(--toast-peek)) - (var(--toast-shrink) * var(--toast-calc-height)))) scale(var(--toast-scale))",
      transformOrigin: "50% calc(50% + 50% * min(var(--toast-index, 0), 1))",
      "--toast-calc-offset-y":
        "calc(var(--toast-offset-y) * -1 + var(--toast-index) * var(--toast-gap) * -1 + var(--toast-swipe-movement-y))",
      "::after": { insetBlockEnd: "100%" },
    },
    "[data-limited]": { opacity: 0 },
    "[data-expanded]": { blockSize: "var(--toast-height)" },
    "[data-position][data-expanded]": {
      transform:
        "translateX(var(--toast-swipe-movement-x)) translateY(var(--toast-calc-offset-y))",
    },
    "[data-ending-style]": { opacity: 0 },
    "[data-position*=top][data-starting-style]": {
      transform: "translateY(calc(-100% - var(--toast-inset)))",
    },
    "[data-position*=bottom][data-starting-style]": {
      transform: "translateY(calc(100% + var(--toast-inset)))",
    },
    "[data-ending-style][data-swipe-direction=left]": {
      transform:
        "translateX(calc(var(--toast-swipe-movement-x) - 100% - var(--toast-inset))) translateY(var(--toast-calc-offset-y))",
    },
    "[data-ending-style][data-swipe-direction=right]": {
      transform:
        "translateX(calc(var(--toast-swipe-movement-x) + 100% + var(--toast-inset))) translateY(var(--toast-calc-offset-y))",
    },
    "[data-ending-style][data-swipe-direction=up]": {
      transform:
        "translateY(calc(var(--toast-swipe-movement-y) - 100% - var(--toast-inset)))",
    },
    "[data-ending-style][data-swipe-direction=down]": {
      transform:
        "translateY(calc(var(--toast-swipe-movement-y) + 100% + var(--toast-inset)))",
    },
  },
  expanded: { "[data-expanded]": { backgroundColor: tokens["--popover"] } },
  replaySuccessOdd: {
    animationDuration: "320ms",
    animationName: successOdd,
    animationTimingFunction: "cubic-bezier(0.5, 1, 0.89, 1)",
    "@media (prefers-reduced-motion: reduce)": { animationName: "none" },
  },
  replaySuccessEven: {
    animationDuration: "320ms",
    animationName: successEven,
    animationTimingFunction: "cubic-bezier(0.5, 1, 0.89, 1)",
    "@media (prefers-reduced-motion: reduce)": { animationName: "none" },
  },
  replayErrorOdd: {
    animationDuration: "280ms",
    animationName: errorOdd,
    animationTimingFunction: "cubic-bezier(0.5, 1, 0.89, 1)",
    "@media (prefers-reduced-motion: reduce)": { animationName: "none" },
  },
  replayErrorEven: {
    animationDuration: "280ms",
    animationName: errorEven,
    animationTimingFunction: "cubic-bezier(0.5, 1, 0.89, 1)",
    "@media (prefers-reduced-motion: reduce)": { animationName: "none" },
  },
  content: {
    pointerEvents: {
      default: "auto",
      ':is([data-slot="toast-root"][data-behind]:not([data-expanded]) [data-slot="toast-content"])':
        "none",
    },
    alignItems: "center",
    display: "flex",
    fontSize: "0.875rem",
    gap: "0.375rem",
    justifyContent: "space-between",
    overflow: "hidden",
    paddingBlock: "0.75rem",
    paddingInline: "0.875rem",
    transitionDuration: "250ms",
    transitionProperty: "opacity",
    opacity: {
      default: null,
      "[data-behind]": 0,
      "[data-expanded]": 1,
    },
  },
  message: { display: "flex", gap: "0.5rem" },
  text: { display: "flex", flexDirection: "column", gap: "0.125rem" },
  title: { fontWeight: 500 },
  description: { color: tokens["--muted-foreground"] },
  icon: { display: "block" },
  iconSvg: {
    blockSize: "1lh",
    inlineSize: "1rem",
    flexShrink: 0,
    pointerEvents: "none",
    '[data-toast-type="error"]': { color: tokens["--destructive-foreground"] },
    '[data-toast-type="info"]': { color: tokens["--info"] },
    '[data-toast-type="success"]': { color: tokens["--success"] },
    '[data-toast-type="warning"]': { color: tokens["--warning"] },
  },
  loadingIcon: {
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: spin,
    animationTimingFunction: "linear",
    opacity: 0.8,
  },
  anchoredViewport: { outline: "none" },
  positioner: {
    maxInlineSize: "min(16rem, var(--available-width))",
    zIndex: 50,
  },
  anchoredRoot: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--popover-foreground"],
    fontSize: "0.75rem",
    position: "relative",
    textWrap: "balance",
    transitionProperty: "scale, opacity",
    "::before": {
      boxShadow: {
        default: "0 1px rgb(0 0 0 / 0.04)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 -1px rgb(255 255 255 / 0.06)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "[data-ending-style]": { opacity: 0, scale: 0.98 },
    "[data-starting-style]": { opacity: 0, scale: 0.98 },
  },
  anchoredTooltip: {
    borderRadius: tokens["--radius-md"],
    boxShadow: "0 4px 6px -1px color-mix(in oklab, #000 5%, transparent)",
    "::before": { borderRadius: "calc(var(--radius-md) - 1px)" },
  },
  anchoredDefault: {
    borderRadius: tokens["--radius-md"],
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    "::before": { borderRadius: "calc(var(--radius-md) - 1px)" },
  },
  tooltipContent: {
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    pointerEvents: "auto",
  },
})

const TOAST_ICONS = {
  error: CircleAlertIcon,
  info: InfoIcon,
  loading: LoaderCircleIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
} as const

type SwipeDirection = "up" | "down" | "left" | "right"

interface ToastData {
  rootProps?: StyleXComponentProps<
    Omit<
      ComponentProps<typeof Toast.Root>,
      "children" | "className" | "swipeDirection" | "toast"
    >
  >
  tooltipStyle?: boolean
}

function getSwipeDirection(position: ToastPosition): SwipeDirection[] {
  const vertical: SwipeDirection = position.startsWith("top") ? "up" : "down"

  if (position.includes("center")) return [vertical]

  return position.includes("left") ? ["left", vertical] : ["right", vertical]
}

function getReplayStyle(toast: { type?: string; updateKey?: number }) {
  const key = toast.updateKey ?? 0

  if (key <= 0) return null

  if (toast.type === "error")
    return key % 2 === 0 ? styles.replayErrorEven : styles.replayErrorOdd

  return key % 2 === 0 ? styles.replaySuccessEven : styles.replaySuccessOdd
}

function isToastType(type: string): type is keyof typeof TOAST_ICONS {
  return Object.hasOwn(TOAST_ICONS, type)
}

export function ToastIcon({ type }: { type?: string }) {
  const Icon = type != null && isToastType(type) ? TOAST_ICONS[type] : null

  if (!Icon) return null

  return (
    <div {...stylex.props(styles.icon)} data-slot="toast-icon">
      <Icon
        {...stylex.props(
          styles.iconSvg,
          type === "loading" && styles.loadingIcon,
        )}
        data-toast-type={type}
        aria-hidden="true"
      />
    </div>
  )
}

export function DefaultToastContent({
  toast,
}: {
  toast: Toast.Root.Props["toast"]
}) {
  return (
    <Toast.Content {...stylex.props(styles.content)} data-slot="toast-content">
      <div {...stylex.props(styles.message)}>
        <ToastIcon type={toast.type} />
        <div {...stylex.props(styles.text)}>
          <Toast.Title
            {...stylex.props(styles.title)}
            data-slot="toast-title"
          />
          <Toast.Description
            {...stylex.props(styles.description)}
            data-slot="toast-description"
          />
        </div>
      </div>
      {toast.actionProps ? (
        <Toast.Action
          className={buttonVariants({ size: "xs" })}
          data-slot="toast-action"
        >
          {toast.actionProps.children}
        </Toast.Action>
      ) : null}
    </Toast.Content>
  )
}

export function Toasts({
  position,
  xstyle,
  portalProps,
}: {
  position: ToastPosition
  xstyle?: StyleXProps["xstyle"]
  portalProps?: ComponentProps<typeof Toast.Portal>
}) {
  const { toasts } = Toast.useToastManager<ToastData>()
  const swipeDirection = getSwipeDirection(position)

  return (
    <Toast.Portal data-slot="toast-portal" {...portalProps}>
      <Toast.Viewport
        {...stylex.props(styles.viewport)}
        data-position={position}
        data-slot="toast-viewport"
      >
        {toasts.map((toast) => {
          const toastData = toast.data

          const { xstyle: rootXstyle, ...rootRestProps } =
            toastData?.rootProps ?? {}

          const rootProps = rootRestProps

          return (
            <Toast.Root
              key={toast.id}
              {...mergeStylexProps(
                stylex.props(
                  styles.root,
                  styles.expanded,
                  getReplayStyle(toast),
                  xstyle,
                  rootXstyle,
                ),
                rootProps,
              )}
              data-position={position}
              data-slot="toast-root"
              swipeDirection={swipeDirection}
              toast={toast}
            >
              <DefaultToastContent toast={toast} />
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export function AnchoredToasts({
  xstyle,
  portalProps,
}: StyleXProps & {
  portalProps?: ComponentProps<typeof Toast.Portal>
}) {
  const { toasts } = Toast.useToastManager<ToastData>()

  return (
    <Toast.Portal data-slot="toast-portal-anchored" {...portalProps}>
      <Toast.Viewport
        {...stylex.props(styles.anchoredViewport)}
        data-slot="toast-viewport-anchored"
      >
        {toasts.map((toast) => {
          const toastData = toast.data

          const { xstyle: rootXstyle, ...rootRestProps } =
            toastData?.rootProps ?? {}

          const rootProps = rootRestProps
          const positionerProps = toast.positionerProps

          if (!positionerProps?.anchor) return null
          const tooltipStyle = toastData?.tooltipStyle ?? false

          return (
            <Toast.Positioner
              key={toast.id}
              {...stylex.props(styles.positioner)}
              data-slot="toast-positioner"
              sideOffset={positionerProps.sideOffset ?? 4}
              toast={toast}
            >
              <Toast.Root
                {...mergeStylexProps(
                  stylex.props(
                    styles.anchoredRoot,
                    tooltipStyle
                      ? styles.anchoredTooltip
                      : styles.anchoredDefault,
                    getReplayStyle(toast),
                    xstyle,
                    rootXstyle,
                  ),
                  rootProps,
                )}
                data-slot="toast-popup"
                toast={toast}
              >
                {tooltipStyle ? (
                  <Toast.Content
                    {...stylex.props(styles.tooltipContent)}
                    data-slot="toast-content"
                  >
                    <Toast.Title data-slot="toast-title" />
                  </Toast.Content>
                ) : (
                  <DefaultToastContent toast={toast} />
                )}
              </Toast.Root>
            </Toast.Positioner>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export const toastManager = Toast.createToastManager<ToastData>()

export const anchoredToastManager = Toast.createToastManager<ToastData>()

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export type ToastProviderProps = StyleXComponentProps<
  Toast.Provider.Props,
  {
    position?: ToastPosition
    portalProps?: ComponentProps<typeof Toast.Portal>
  }
>

export function ToastProvider({
  xstyle: consumerXstyle,
  children,
  position = "bottom-right",
  portalProps,
  ...restProps
}: ToastProviderProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <Toast.Provider toastManager={toastManager} {...props}>
      {children}
      <Toasts xstyle={xstyle} portalProps={portalProps} position={position} />
    </Toast.Provider>
  )
}

export type AnchoredToastProviderProps = StyleXComponentProps<
  Toast.Provider.Props,
  {
    portalProps?: ComponentProps<typeof Toast.Portal>
  }
>

export function AnchoredToastProvider({
  xstyle: consumerXstyle,
  children,
  portalProps,
  ...restProps
}: AnchoredToastProviderProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <Toast.Provider toastManager={anchoredToastManager} {...props}>
      {children}
      <AnchoredToasts xstyle={xstyle} portalProps={portalProps} />
    </Toast.Provider>
  )
}

export { Toast as ToastPrimitive }
