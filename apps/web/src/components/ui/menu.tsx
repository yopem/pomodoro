"use client"

import type { ComponentProps } from "react"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import * as stylex from "@stylexjs/stylex"
import { ChevronRightIcon } from "lucide-react"

import type { StyleXComponentProps } from "@/lib/stylex"

import { mergeStylexProps, stylexProps } from "@/lib/stylex"
import { tokens } from "@/styles/tokens.stylex"

export const menuSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  itemIcon: { marginInline: "-0.125rem", opacity: 0.8 },
})

const styles = stylex.create({
  positioner: { zIndex: 50 },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderRadius: tokens["--radius"],
    boxShadow: tokens["--shadow-md"],
    display: "flex",
    minInlineSize: "8rem",
    outline: "none",
    position: "relative",
    transformOrigin: "var(--transform-origin)",
    ":focus": { outline: "none" },
  },
  popupViewport: {
    inlineSize: "100%",
    maxBlockSize: "var(--available-height)",
    overflowY: "auto",
    padding: "0.25rem",
  },
  item: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--popover-foreground"],
    cursor: "default",
    display: "flex",
    fontSize: "0.875rem",
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    userSelect: "none",
    "[data-highlighted]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-variant=destructive]": { color: tokens["--destructive-foreground"] },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
    "[data-inset]": { paddingInlineStart: "2rem" },
  },
  choiceItem: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--popover-foreground"],
    cursor: "default",
    display: "grid",
    fontSize: "0.875rem",
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInlineStart: "0.5rem",
    userSelect: "none",
    "[data-highlighted]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
  },
  choiceDefault: {
    gridTemplateColumns: "0.75rem 1fr",
    paddingInlineEnd: "1rem",
  },
  choiceSwitch: {
    columnGap: "1rem",
    gridTemplateColumns: "1fr auto",
    paddingInlineEnd: "0.375rem",
  },
  choiceContent: { gridColumnStart: 2 },
  choiceContentFirst: { gridColumnStart: 1 },
  indicator: {
    color: tokens["--accent-solid"],
    gridColumnStart: 1,
    marginInlineStart: "-0.125rem",
  },
  switch: {
    alignItems: "center",
    backgroundColor: tokens["--accent"],
    blockSize: "18px",
    borderColor: "transparent",
    borderRadius: "9999px",
    borderStyle: "solid",
    borderWidth: 2,
    display: "inline-flex",
    flexShrink: 0,
    inlineSize: "37px",
    transition: "background-color .2s",
    "[data-checked]": { backgroundColor: tokens["--accent-solid"] },
  },
  switchThumb: {
    backgroundColor: {
      default: tokens["--muted-foreground"],
      ':is([data-slot="menu-checkbox-item"][data-checked] [data-slot="menu-switch-thumb"])':
        tokens["--accent-solid-foreground"],
    },
    blockSize: "8px",
    inlineSize: "8px",
    borderRadius: "9999px",
    boxShadow: tokens["--shadow-sm"],
    display: "block",
    pointerEvents: "none",
    transform: {
      default: "translateX(4px)",
      ':is([data-slot="menu-checkbox-item"][data-checked] [data-slot="menu-switch-thumb"])':
        "translateX(22px)",
      ":dir(rtl)": "translateX(-4px)",
      ':is([data-slot="menu-checkbox-item"][data-checked] [data-slot="menu-switch-thumb"]):dir(rtl)':
        "translateX(-22px)",
    },
    transition: "transform .15s",
  },
  label: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
    "[data-inset]": {
      paddingInlineStart: {
        default: "2.25rem",
        "@media (min-width: 640px)": "2rem",
      },
    },
  },
  separator: {
    backgroundColor: tokens["--card-border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  shortcut: {
    color: tokens["--muted-foreground"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.75rem",
    fontWeight: 500,
    marginInlineStart: "auto",
  },
  subTrigger: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--popover-foreground"],
    display: "flex",
    fontSize: "0.875rem",
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    "[data-highlighted]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-popup-open]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
    "[data-inset]": { paddingInlineStart: "2rem" },
  },
  subIcon: {
    marginInlineEnd: "-0.125rem",
    marginInlineStart: "auto",
    opacity: 0.8,
  },
})

export const MenuCreateHandle: typeof MenuPrimitive.createHandle =
  MenuPrimitive.createHandle

export const Menu: typeof MenuPrimitive.Root = MenuPrimitive.Root

export const MenuPortal: typeof MenuPrimitive.Portal = MenuPrimitive.Portal

export function MenuTrigger({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<MenuPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    >
      {children}
    </MenuPrimitive.Trigger>
  )
}

export function MenuPopup({
  xstyle: consumerXstyle,
  children,
  className,
  sideOffset = 4,
  align = "center",
  alignOffset,
  side = "bottom",
  anchor,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  MenuPrimitive.Popup.Props,
  {
    align?: MenuPrimitive.Positioner.Props["align"]
    sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
    alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"]
    side?: MenuPrimitive.Positioner.Props["side"]
    anchor?: MenuPrimitive.Positioner.Props["anchor"]
    portalProps?: MenuPrimitive.Portal.Props
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPortal {...portalProps}>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="menu-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="menu-popup"
          {...mergeStylexProps(
            stylexProps(className, styles.popup, xstyle),
            props,
          )}
        >
          <div {...stylex.props(styles.popupViewport)}>{children}</div>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPortal>
  )
}

export function MenuGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<MenuPrimitive.Group.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.Group
      data-slot="menu-group"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function MenuItem({
  xstyle: consumerXstyle,
  className,
  inset,
  variant = "default",
  ...restProps
}: StyleXComponentProps<
  MenuPrimitive.Item.Props,
  {
    inset?: boolean
    variant?: "default" | "destructive"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.Item
      data-inset={inset}
      data-slot="menu-item"
      data-variant={variant}
      {...mergeStylexProps(stylexProps(className, styles.item, xstyle), props)}
    />
  )
}

export function MenuLinkItem({
  xstyle: consumerXstyle,
  className,
  inset,
  variant = "default",
  closeOnClick = true,
  ...restProps
}: StyleXComponentProps<
  MenuPrimitive.LinkItem.Props,
  {
    inset?: boolean
    variant?: "default" | "destructive"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.LinkItem
      closeOnClick={closeOnClick}
      data-inset={inset}
      data-slot="menu-link-item"
      data-variant={variant}
      {...mergeStylexProps(stylexProps(className, styles.item, xstyle), props)}
    />
  )
}

export function MenuCheckboxItem({
  xstyle: consumerXstyle,
  className,
  children,
  checked,
  variant = "default",
  ...restProps
}: StyleXComponentProps<
  MenuPrimitive.CheckboxItem.Props,
  {
    variant?: "default" | "switch"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}

      data-slot="menu-checkbox-item"
      data-variant={variant}
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.choiceItem,
          variant === "switch" ? styles.choiceSwitch : styles.choiceDefault,
          xstyle,
        ),
        props,
      )}
    >
      {variant === "switch" ? (
        <>
          <span {...stylex.props(styles.choiceContentFirst)}>{children}</span>
          <MenuPrimitive.CheckboxItemIndicator
            {...stylex.props(styles.switch)}
            keepMounted
          >
            <span
              {...stylex.props(styles.switchThumb)}
              data-slot="menu-switch-thumb"
            />
          </MenuPrimitive.CheckboxItemIndicator>
        </>
      ) : (
        <>
          <MenuPrimitive.CheckboxItemIndicator
            {...stylex.props(styles.indicator)}
          >
            <svg
              {...stylex.props(menuSlotStyles.icon)}
              aria-hidden="true"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
            </svg>
          </MenuPrimitive.CheckboxItemIndicator>
          <span {...stylex.props(styles.choiceContent)}>{children}</span>
        </>
      )}
    </MenuPrimitive.CheckboxItem>
  )
}

export function MenuRadioGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<MenuPrimitive.RadioGroup.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.RadioGroup
      data-slot="menu-radio-group"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function MenuRadioItem({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<MenuPrimitive.RadioItem.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      {...mergeStylexProps(
        stylexProps(className, styles.choiceItem, styles.choiceDefault, xstyle),
        props,
      )}
    >
      <MenuPrimitive.RadioItemIndicator {...stylex.props(styles.indicator)}>
        <svg
          {...stylex.props(menuSlotStyles.icon)}
          aria-hidden="true"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </MenuPrimitive.RadioItemIndicator>
      <span {...stylex.props(styles.choiceContent)}>{children}</span>
    </MenuPrimitive.RadioItem>
  )
}

export function MenuGroupLabel({
  xstyle: consumerXstyle,
  className,
  inset,
  ...restProps
}: StyleXComponentProps<MenuPrimitive.GroupLabel.Props, { inset?: boolean }>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.GroupLabel
      data-inset={inset}
      data-slot="menu-label"
      {...mergeStylexProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}

export function MenuSeparator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<MenuPrimitive.Separator.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      {...mergeStylexProps(
        stylexProps(className, styles.separator, xstyle),
        props,
      )}
    />
  )
}

export function MenuShortcut({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"kbd">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <kbd
      data-slot="menu-shortcut"
      {...mergeStylexProps(
        stylexProps(className, styles.shortcut, xstyle),
        props,
      )}
    />
  )
}

export function MenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />
}

export function MenuSubTrigger({
  xstyle: consumerXstyle,
  className,
  inset,
  children,
  ...restProps
}: StyleXComponentProps<
  MenuPrimitive.SubmenuTrigger.Props,
  { inset?: boolean }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MenuPrimitive.SubmenuTrigger
      data-inset={inset}
      data-slot="menu-sub-trigger"
      {...mergeStylexProps(
        stylexProps(className, styles.subTrigger, xstyle),
        props,
      )}
    >
      {children}
      <ChevronRightIcon
        {...stylex.props(menuSlotStyles.icon, styles.subIcon)}
      />
    </MenuPrimitive.SubmenuTrigger>
  )
}

export function MenuSubPopup({
  xstyle: consumerXstyle,
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...restProps
}: StyleXComponentProps<
  MenuPrimitive.Popup.Props,
  {
    align?: MenuPrimitive.Positioner.Props["align"]
    sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
    alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"]
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultAlignOffset = align !== "center" ? -5 : undefined

  return (
    <MenuPopup
      align={align}
      alignOffset={alignOffset ?? defaultAlignOffset}
      className={className}
      xstyle={xstyle}
      data-slot="menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
    />
  )
}

export {
  MenuPrimitive,
  MenuCreateHandle as DropdownMenuCreateHandle,
  Menu as DropdownMenu,
  MenuPortal as DropdownMenuPortal,
  MenuTrigger as DropdownMenuTrigger,
  MenuPopup as DropdownMenuContent,
  MenuGroup as DropdownMenuGroup,
  MenuItem as DropdownMenuItem,
  MenuCheckboxItem as DropdownMenuCheckboxItem,
  MenuRadioGroup as DropdownMenuRadioGroup,
  MenuRadioItem as DropdownMenuRadioItem,
  MenuGroupLabel as DropdownMenuLabel,
  MenuSeparator as DropdownMenuSeparator,
  MenuShortcut as DropdownMenuShortcut,
  MenuSub as DropdownMenuSub,
  MenuSubTrigger as DropdownMenuSubTrigger,
  MenuSubPopup as DropdownMenuSubContent,
}
