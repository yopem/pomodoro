"use client"

import type { StyleXComponentProps } from "@/lib/stylex"

import { Form as FormPrimitive } from "@base-ui/react/form"
import { mergeStylexProps, stylexProps } from "@/lib/stylex"

export function Form({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<FormPrimitive.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <FormPrimitive
      data-slot="form"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export { FormPrimitive }
