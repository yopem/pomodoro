import type { ChangeEvent, FormEvent, ReactNode } from "react"

import { useForm } from "@tanstack/react-form"
import { useRef, useState } from "react"

import type { Settings } from "@/features/focus/schema"

import { FieldMessages } from "@/components/field-messages"
import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Stack } from "@/components/ui/stack"
import { Switch } from "@/components/ui/switch"
import { Text } from "@/components/ui/text"
import { projectColorSchema, settingsSchema } from "@/features/focus/schema"
import {
  updateSettings,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"

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

const colors = [
  { name: "focus_color", label: "Focus color" },
  { name: "short_color", label: "Short break color" },
  { name: "long_color", label: "Long break color" },
] as const

const settingsFormSchema = settingsSchema.extend({
  focus_color: projectColorSchema,
  short_color: projectColorSchema,
  long_color: projectColorSchema,
})

const switches = [
  { name: "auto_start_breaks", label: "Start breaks automatically" },
  { name: "auto_start_focus", label: "Start focus automatically" },
  { name: "auto_check_tasks", label: "Complete tasks automatically" },
  { name: "check_to_bottom", label: "Move completed tasks to bottom" },
  { name: "dark_while_running", label: "Use dark theme while running" },
  { name: "notifications", label: "Enable notifications" },
] as const

export function useSettingsForm({
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

  const form = useForm({
    defaultValues: settings,
    validators: { onBlur: settingsFormSchema, onSubmit: settingsFormSchema },
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

    function changeColor(event: ChangeEvent<HTMLSelectElement>) {
      const name = colors.find(
        (item) => item.name === event.currentTarget.id,
      )?.name

      const result = projectColorSchema.safeParse(event.currentTarget.value)

      if (name && result.success) form.setFieldValue(name, result.data)
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

    return {
      submit,
      changeNumber,
      changeColor,
      changeAlarm,
      changeFocusSound,
      changeTheme,
      changeWeekStart,
      changeHourFormat,
    }
  })

  return { form, formRef, events, error }
}

export function SettingsForm({
  settings,
  onSaved,
}: {
  settings: Settings
  onSaved: (message: string) => void
}) {
  const { form, formRef, events, error } = useSettingsForm({
    settings,
    onSaved,
  })

  return (
    <form ref={formRef} noValidate onSubmit={events.submit}>
      <Stack>
        {[
          { title: "Timer", fields: numbers.slice(0, 4) },
          { title: "Sound", fields: numbers.slice(4, 7) },
        ].map((group) => (
          <Card key={group.title}>
            <CardPanel>
              <Stack spacing="relaxed">
                <Heading render={<h2>{group.title}</h2>} />
                <Grid variant="workspace">
                  {group.fields.map(({ name, label, min, max }) => (
                    <form.Field key={name} name={name}>
                      {(field) => (
                        <NumberField
                          name={name}
                          label={label}
                          min={min}
                          max={max}
                          value={field.state.value}
                          errors={field.state.meta.errors}
                          onBlur={field.handleBlur}
                          onChange={events.changeNumber}
                        />
                      )}
                    </form.Field>
                  ))}
                  {group.title === "Sound" && (
                    <>
                      <form.Field name="alarm">
                        {(field) => (
                          <SettingsSelect
                            name="alarm"
                            label="Alarm"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={events.changeAlarm}
                          >
                            <option value="none">None</option>
                            <option value="bell">Bell</option>
                            <option value="chime">Chime</option>
                          </SettingsSelect>
                        )}
                      </form.Field>
                      <form.Field name="focus_sound">
                        {(field) => (
                          <SettingsSelect
                            name="focus_sound"
                            label="Focus sound"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={events.changeFocusSound}
                          >
                            <option value="none">None</option>
                            <option value="rain">Rain</option>
                            <option value="white_noise">White noise</option>
                          </SettingsSelect>
                        )}
                      </form.Field>
                    </>
                  )}
                </Grid>
              </Stack>
            </CardPanel>
          </Card>
        ))}
        <Card>
          <CardPanel>
            <Stack spacing="relaxed">
              <Heading render={<h2>Preferences</h2>} />
              <Grid variant="workspace">
                {colors.map(({ name, label }) => (
                  <form.Field key={name} name={name}>
                    {(field) => (
                      <ColorSelect
                        name={name}
                        label={label}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={events.changeColor}
                      />
                    )}
                  </form.Field>
                ))}
                <form.Field name="theme">
                  {(field) => (
                    <SettingsSelect
                      name="theme"
                      label="Theme"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeTheme}
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </SettingsSelect>
                  )}
                </form.Field>
                <form.Field name="week_start">
                  {(field) => (
                    <SettingsSelect
                      name="week_start"
                      label="First day of week"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeWeekStart}
                    >
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                      <option value="saturday">Saturday</option>
                    </SettingsSelect>
                  )}
                </form.Field>
                <form.Field name="hour_format">
                  {(field) => (
                    <SettingsSelect
                      name="hour_format"
                      label="Time format"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeHourFormat}
                    >
                      <option value="12h">12-hour</option>
                      <option value="24h">24-hour</option>
                    </SettingsSelect>
                  )}
                </form.Field>
              </Grid>
            </Stack>
          </CardPanel>
        </Card>
        <Card>
          <CardPanel>
            <Stack spacing="relaxed">
              <Heading render={<h2>Behavior</h2>} />
              <Grid variant="workspace">
                {numbers.slice(7).map(({ name, label, min, max }) => (
                  <form.Field key={name} name={name}>
                    {(field) => (
                      <NumberField
                        name={name}
                        label={label}
                        min={min}
                        max={max}
                        value={field.state.value}
                        errors={field.state.meta.errors}
                        onBlur={field.handleBlur}
                        onChange={events.changeNumber}
                      />
                    )}
                  </form.Field>
                ))}
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
              </Grid>
              <NotificationPermission />
            </Stack>
          </CardPanel>
        </Card>
        {error && (
          <Text role="alert" tone="destructive">
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

export function SettingsSelect({
  name,
  label,
  value,
  onBlur,
  onChange,
  children,
}: {
  name: string
  label: string
  value: string
  onBlur: () => void
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <NativeSelect id={name} value={value} onBlur={onBlur} onChange={onChange}>
        {children}
      </NativeSelect>
    </Field>
  )
}

export function NumberField({
  name,
  label,
  min,
  max,
  value,
  errors,
  onBlur,
  onChange,
}: {
  name: string
  label: string
  min: number
  max: number
  value: number
  errors: readonly unknown[]
  onBlur: () => void
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <Field invalid={errors.length > 0}>
      <FieldLabel htmlFor={name}>
        {label} ({min}–{max})
      </FieldLabel>
      <Input
        id={name}
        type="number"
        min={min}
        max={max}
        step={1}
        value={Number.isNaN(value) ? "" : value}
        onBlur={onBlur}
        onChange={onChange}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length ? `${name}-error` : undefined}
      />
      <FieldMessages id={`${name}-error`} errors={errors} />
    </Field>
  )
}

export function ColorSelect({
  name,
  label,
  value,
  onBlur,
  onChange,
}: {
  name: string
  label: string
  value: Settings["focus_color"]
  onBlur: () => void
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <NativeSelect id={name} value={value} onBlur={onBlur} onChange={onChange}>
        <option value="red">Red</option>
        <option value="orange">Orange</option>
        <option value="yellow">Yellow</option>
        <option value="green">Green</option>
        <option value="blue">Blue</option>
        <option value="purple">Purple</option>
        <option value="gray">Gray</option>
      </NativeSelect>
    </Field>
  )
}

export function NotificationPermission() {
  const [permission, setPermission] = useState<string | null>(null)

  const [requestPermission] = useState(function createPermissionHandler() {
    return async function requestPermission() {
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
  })

  return (
    <>
      <Button type="button" variant="outline" onClick={requestPermission}>
        Request notification permission
      </Button>
      {permission && <output>{permission}</output>}
    </>
  )
}
