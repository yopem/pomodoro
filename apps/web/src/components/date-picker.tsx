import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover"
import { useEventCallback } from "@/hooks/use-event-callback"
import { localDateText } from "@/lib/local-date"

export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  clearable,
  invalid,
  describedBy,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  clearable?: boolean
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = useState(false)
  const date = new Date(`${value}T12:00:00`)
  const selected = Number.isFinite(date.getTime()) ? date : undefined

  const selectDate = useEventCallback(function handleDateSelection(next: Date) {
    onChange(localDateText(next))
    setOpen(false)
  })

  const clearDate = useEventCallback(function handleDateClear() {
    onChange("")
    setOpen(false)
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        id={id}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      >
        {value || "Choose date"}
      </PopoverTrigger>
      <PopoverPopup align="start" aria-label="Choose date">
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected}
          onSelect={selectDate}
        />
        {clearable && (
          <Button variant="ghost" onClick={clearDate}>
            Clear date
          </Button>
        )}
      </PopoverPopup>
    </Popover>
  )
}
