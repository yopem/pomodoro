import type { ChangeEvent, FormEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { useRef, useState } from "react"

import type { Settings } from "@/features/focus/schema"

import { FieldMessages } from "@/components/field-messages"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Heading } from "@/components/ui/heading"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Stack } from "@/components/ui/stack"
import { Switch } from "@/components/ui/switch"
import { Text } from "@/components/ui/text"
import { settingsSchema } from "@/features/focus/schema"
import {
  updateSettings,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { appStyles } from "@/styles/app.stylex"

const numbers = [
  { name: "focus_minutes", label: "Focus minutes", min: 1, max: 180 },
  { name: "short_minutes", label: "Short break minutes", min: 1, max: 180 },
  { name: "long_minutes", label: "Long break minutes", min: 1, max: 180 },
  {
    name: "long_break_interval",
    label: "Focus sessions before long break",
    min: 1,
    max: 10000,
  },
  { name: "alarm_volume", label: "Alarm volume", min: 0, max: 100 },
  { name: "alarm_repeat", label: "Alarm repetitions", min: 1, max: 10 },
  { name: "focus_sound_volume", label: "Focus sound volume", min: 0, max: 100 },
  { name: "reminder_minutes", label: "Reminder minutes", min: 0, max: 180 },
] as const

const switches = [
  { name: "auto_start_breaks", label: "Start breaks automatically" },
  { name: "auto_start_focus", label: "Start focus automatically" },
  { name: "auto_check_tasks", label: "Complete tasks automatically" },
  { name: "check_to_bottom", label: "Move completed tasks to bottom" },
  { name: "dark_while_running", label: "Use dark theme while running" },
  { name: "notifications", label: "Enable notifications" },
] as const

export function SettingsForm({
  settings,
  onSaved,
}: {
  settings: Settings
  onSaved: (message: string) => void
}) {
  const owner = useWorkspaceMutationOwner()
  const formRef = useRef<HTMLFormElement>(null)
  const baseline = useRef(settings)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<string | null>(null)

  const form = useForm({
    defaultValues: settings,
    validators: { onBlur: settingsSchema, onSubmit: settingsSchema },
    onSubmitInvalid: () => {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      )
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        await updateSettings(
          { settings: value, expected: baseline.current },
          { owner },
        )
        baseline.current = value
        onSaved("Settings saved.")
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not save settings",
        )
      }
    },
  })

  const [events] = useState(function createSettingsEvents() {
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      void form.handleSubmit()
    }

    function changeNumber(event: ChangeEvent<HTMLInputElement>) {
      const name = numbers.find(
        (item) => item.name === event.currentTarget.id,
      )?.name

      if (name) form.setFieldValue(name, event.currentTarget.valueAsNumber)
    }

    function changeAlarm(event: ChangeEvent<HTMLSelectElement>) {
      const result = settingsSchema.shape.alarm.safeParse(
        event.currentTarget.value,
      )

      if (result.success) form.setFieldValue("alarm", result.data)
    }

    function changeFocusSound(event: ChangeEvent<HTMLSelectElement>) {
      const result = settingsSchema.shape.focus_sound.safeParse(
        event.currentTarget.value,
      )

      if (result.success) form.setFieldValue("focus_sound", result.data)
    }

    function changeTheme(event: ChangeEvent<HTMLSelectElement>) {
      const result = settingsSchema.shape.theme.safeParse(
        event.currentTarget.value,
      )

      if (result.success) form.setFieldValue("theme", result.data)
    }

    function changeWeekStart(event: ChangeEvent<HTMLSelectElement>) {
      const result = settingsSchema.shape.week_start.safeParse(
        event.currentTarget.value,
      )

      if (result.success) form.setFieldValue("week_start", result.data)
    }

    function changeHourFormat(event: ChangeEvent<HTMLSelectElement>) {
      const result = settingsSchema.shape.hour_format.safeParse(
        event.currentTarget.value,
      )

      if (result.success) form.setFieldValue("hour_format", result.data)
    }

    async function requestPermission() {
      if (!("Notification" in window)) {
        setPermission("Notifications are not supported in this browser.")

        return
      }

      try {
        const result = await Notification.requestPermission()

        const messages = {
          granted: "Notification permission granted.",
          denied:
            "Notification permission denied. Change browser permissions to allow notifications.",
          default: "Notification permission was not granted.",
        }

        setPermission(messages[result])
      } catch {
        setPermission("Could not request notification permission.")
      }
    }

    return {
      requestPermission,
      submit,
      changeNumber,
      changeAlarm,
      changeFocusSound,
      changeTheme,
      changeWeekStart,
      changeHourFormat,
    }
  })

  return (
    <form ref={formRef} noValidate onSubmit={events.submit}>
      <Stack>
        <Heading render={<h2>Timer and sound</h2>} />
        {numbers.map(({ name, label, min, max }) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={name}>
                  {label} ({min}–{max})
                </FieldLabel>
                <Input
                  id={name}
                  type="number"
                  min={min}
                  max={max}
                  step={1}
                  value={
                    Number.isNaN(field.state.value) ? "" : field.state.value
                  }
                  onBlur={field.handleBlur}
                  onChange={events.changeNumber}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={
                    field.state.meta.errors.length ? `${name}-error` : undefined
                  }
                />
                <FieldMessages
                  id={`${name}-error`}
                  errors={field.state.meta.errors}
                />
              </Field>
            )}
          </form.Field>
        ))}
        <Heading render={<h2>Preferences</h2>} />
        <form.Field name="alarm">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="alarm">Alarm</FieldLabel>
              <NativeSelect
                id="alarm"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={events.changeAlarm}
              >
                <option value="none">None</option>
                <option value="bell">Bell</option>
                <option value="chime">Chime</option>
              </NativeSelect>
            </Field>
          )}
        </form.Field>
        <form.Field name="focus_sound">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="focus_sound">Focus sound</FieldLabel>
              <NativeSelect
                id="focus_sound"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={events.changeFocusSound}
              >
                <option value="none">None</option>
                <option value="rain">Rain</option>
                <option value="white_noise">White noise</option>
              </NativeSelect>
            </Field>
          )}
        </form.Field>
        <form.Field name="theme">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="theme">Theme</FieldLabel>
              <NativeSelect
                id="theme"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={events.changeTheme}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </NativeSelect>
            </Field>
          )}
        </form.Field>
        <form.Field name="week_start">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="week_start">First day of week</FieldLabel>
              <NativeSelect
                id="week_start"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={events.changeWeekStart}
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
                <option value="saturday">Saturday</option>
              </NativeSelect>
            </Field>
          )}
        </form.Field>
        <form.Field name="hour_format">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="hour_format">Time format</FieldLabel>
              <NativeSelect
                id="hour_format"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={events.changeHourFormat}
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </NativeSelect>
            </Field>
          )}
        </form.Field>
        {switches.map(({ name, label }) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <Field>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <Switch
                  id={name}
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={events.requestPermission}
        >
          Request notification permission
        </Button>
        {permission && <output>{permission}</output>}
        {error && (
          <Text role="alert" xstyle={appStyles.error}>
            {error}
          </Text>
        )}
        <form.Subscribe>
          {(state) => (
            <Button type="submit" loading={state.isSubmitting}>
              Save settings
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </form>
  )
}
