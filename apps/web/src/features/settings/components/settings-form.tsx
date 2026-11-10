import type { ChangeEvent, FormEvent } from "react"

import { useForm } from "@tanstack/react-form"
import { useRef, useState } from "react"

import type { Settings } from "@/features/focus/schema"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Stack } from "@/components/ui/stack"
import { Switch } from "@/components/ui/switch"
import { Text } from "@/components/ui/text"
import { toastManager } from "@/components/ui/toast"
import { requestFocusNotificationPermission } from "@/features/focus/notifications"
import { projectColorSchema, settingsSchema } from "@/features/focus/schema"
import {
  updateSettings,
  useWorkspaceMutationOwner,
} from "@/features/focus/store"
import { useEventCallback } from "@/hooks/use-event-callback"

const colorOptions = projectColorSchema.options.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}))

const selectOptions = {
  alarm: [
    { value: "none", label: "None" },
    { value: "bell", label: "Bell" },
    { value: "chime", label: "Chime" },
  ],
  focus_sound: [
    { value: "none", label: "None" },
    { value: "rain", label: "Rain" },
    { value: "white_noise", label: "White noise" },
  ],
  focus_color: colorOptions,
  short_color: colorOptions,
  long_color: colorOptions,
  theme: [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ],
  week_start: [
    { value: "sunday", label: "Sunday" },
    { value: "monday", label: "Monday" },
    { value: "saturday", label: "Saturday" },
  ],
  hour_format: [
    { value: "12h", label: "12-hour" },
    { value: "24h", label: "24-hour" },
  ],
} as const

type SelectSettingName = keyof typeof selectOptions

interface SettingsSelectChange {
  name: SelectSettingName
  value: string | null
}

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

export function useSettingsForm({ settings }: { settings: Settings }) {
  const owner = useWorkspaceMutationOwner()
  const formRef = useRef<HTMLFormElement>(null)
  const [baseline, setBaseline] = useState(settings)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: baseline,
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
        await updateSettings({ settings: value, expected: baseline }, { owner })
        setBaseline(value)
        toastManager.add({ title: "Settings saved", type: "success" })
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not save settings",
        )
      }
    },
  })

  const reloadSettings = useEventCallback(function reloadSettings() {
    form.reset(settings)
    setBaseline(settings)
    setError(null)
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

    function changeSelect({ name, value }: SettingsSelectChange) {
      const result = settingsSchema.shape[name].safeParse(value)

      if (result.success) form.setFieldValue(name, result.data)
    }

    return { submit, changeNumber, changeSelect }
  })

  return { form, formRef, events, error, baseline, reloadSettings }
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const { form, formRef, events, error, baseline, reloadSettings } =
    useSettingsForm({ settings })

  const changedElsewhere = JSON.stringify(settings) !== JSON.stringify(baseline)

  return (
    <form ref={formRef} noValidate onSubmit={events.submit}>
      <Stack>
        {[
          {
            title: "Timer",
            id: "settings-timer",
            description: "Set the length of your focus sessions and breaks.",
            fields: numbers.slice(0, 4),
          },
          {
            title: "Sound",
            id: "settings-sound",
            description: "Choose session alerts and background audio.",
            fields: numbers.slice(4, 7),
          },
        ].map((group) => (
          <Card
            key={group.title}
            render={
              <section id={group.id} aria-labelledby={`${group.id}-title`} />
            }
          >
            <CardHeader>
              <Heading
                id={`${group.id}-title`}
                render={<h2>{group.title}</h2>}
              />
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardPanel>
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
                          onChange={events.changeSelect}
                        />
                      )}
                    </form.Field>
                    <form.Field name="focus_sound">
                      {(field) => (
                        <SettingsSelect
                          name="focus_sound"
                          label="Focus sound"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={events.changeSelect}
                        />
                      )}
                    </form.Field>
                  </>
                )}
              </Grid>
            </CardPanel>
          </Card>
        ))}
        <Card
          render={
            <section
              id="settings-appearance"
              aria-labelledby="settings-appearance-title"
            />
          }
        >
          <CardHeader>
            <Heading
              id="settings-appearance-title"
              render={<h2>Appearance &amp; display</h2>}
            />
            <CardDescription>
              Choose colors, theme, and how dates and times appear.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <Grid variant="workspace">
              {colors.map(({ name, label }) => (
                <form.Field key={name} name={name}>
                  {(field) => (
                    <SettingsSelect
                      name={name}
                      label={label}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={events.changeSelect}
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
                    onChange={events.changeSelect}
                  />
                )}
              </form.Field>
              <form.Field name="week_start">
                {(field) => (
                  <SettingsSelect
                    name="week_start"
                    label="First day of week"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={events.changeSelect}
                  />
                )}
              </form.Field>
              <form.Field name="hour_format">
                {(field) => (
                  <SettingsSelect
                    name="hour_format"
                    label="Time format"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={events.changeSelect}
                  />
                )}
              </form.Field>
            </Grid>
          </CardPanel>
        </Card>
        <Card
          render={
            <section
              id="settings-behavior"
              aria-labelledby="settings-behavior-title"
            />
          }
        >
          <CardHeader>
            <Heading
              id="settings-behavior-title"
              render={<h2>Automation &amp; reminders</h2>}
            />
            <CardDescription>
              Choose what happens between sessions and when to be notified.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <Stack spacing="relaxed">
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
              </Grid>
              <Grid>
                {switches.map(({ name, label }) => (
                  <form.Field key={name} name={name}>
                    {(field) => (
                      <Field layout="switch">
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
        <Box variant="settingsSave">
          <Stack spacing="compact">
            {error && (
              <Text role="alert" tone="destructive">
                {error}
              </Text>
            )}
            <form.Subscribe>
              {(state) => {
                const hasUnsavedChanges =
                  JSON.stringify(state.values) !== JSON.stringify(baseline)

                let message = "Changes apply when you save."

                if (hasUnsavedChanges) message = "Unsaved changes."

                if (changedElsewhere) message = "Settings changed elsewhere."

                return (
                  <Stack spacing="compact">
                    {changedElsewhere && (
                      <Text>
                        Reload to use the current settings. Your draft stays
                        here until you reload.
                      </Text>
                    )}
                    <HStack layout="spread">
                      <Stack spacing="compact">
                        <Text variant="label">Workspace preferences</Text>
                        <output aria-live="polite">{message}</output>
                      </Stack>
                      <HStack>
                        {changedElsewhere && (
                          <Button
                            type="button"
                            variant="outline"
                            size="xl"
                            onClick={reloadSettings}
                            disabled={state.isSubmitting}
                          >
                            Reload settings
                          </Button>
                        )}
                        <Button
                          type="submit"
                          size="xl"
                          loading={state.isSubmitting}
                          disabled={changedElsewhere}
                        >
                          Save settings
                        </Button>
                      </HStack>
                    </HStack>
                  </Stack>
                )
              }}
            </form.Subscribe>
          </Stack>
        </Box>
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
}: {
  name: SelectSettingName
  label: string
  value: Settings[SelectSettingName]
  onBlur: () => void
  onChange: (input: SettingsSelectChange) => void
}) {
  const items: readonly { label: string; value: string }[] = selectOptions[name]

  const changeValue = useEventCallback(function selectValue(
    value: string | null,
  ) {
    onChange({ name, value })
  })

  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Select
        name={name}
        value={value}
        items={items}
        onValueChange={changeValue}
      >
        <SelectTrigger id={name} onBlur={onBlur}>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
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
      <FieldError id={`${name}-error`} match={errors.length > 0}>
        Enter a whole number from {min} to {max}.
      </FieldError>
    </Field>
  )
}

export function NotificationPermission() {
  const [permission, setPermission] = useState<string | null>(null)

  const [requestPermission] = useState(function createPermissionHandler() {
    return async function requestPermission() {
      try {
        const result = await requestFocusNotificationPermission()

        const messages = {
          unsupported: "Notifications are not supported in this browser.",
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
