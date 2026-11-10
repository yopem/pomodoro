import type { Session } from "@/features/focus/schema"

import { HStack } from "@/components/ui/hstack"
import { Progress } from "@/components/ui/progress"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"
import { formatFocusTime } from "@/lib/focus-time"

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const formatters = {
  year: new Intl.DateTimeFormat("en-US", { month: "short", timeZone }),
  day: new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone }),
  date: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }),
}

export function FocusTimeline({
  sessions,
  rangeStart,
  rangeEnd,
  period,
}: {
  sessions: readonly Session[]
  rangeStart: number
  rangeEnd: number
  period: "day" | "week" | "month" | "year"
}) {
  const bins: { start: number; label: string; seconds: number }[] = []
  const cursor = new Date(rangeStart)
  let formatter = formatters.date

  if (period === "year") formatter = formatters.year

  if (period === "day") formatter = formatters.day

  while (cursor.getTime() < rangeEnd) {
    const start = cursor.getTime()

    if (period === "year") cursor.setMonth(cursor.getMonth() + 1)
    else if (period === "day") cursor.setHours(cursor.getHours() + 1)
    else cursor.setDate(cursor.getDate() + 1)
    const end = cursor.getTime()
    bins.push({
      start,
      label: formatter.format(new Date(start)),
      seconds: sessions.reduce(
        (total, session) =>
          total +
          (session.started_at_ms >= start && session.started_at_ms < end
            ? session.duration_seconds
            : 0),
        0,
      ),
    })
  }

  const max = Math.max(1, ...bins.map((bin) => bin.seconds))

  return (
    <Stack spacing="compact">
      {bins.map((bin) => (
        <Stack key={bin.start} spacing="compact">
          <HStack layout="spread">
            <Text size="small">{bin.label}</Text>
            <Text size="small" format="numeric">
              {formatFocusTime(bin.seconds)}
            </Text>
          </HStack>
          <Progress
            value={bin.seconds}
            max={max}
            aria-label={`${bin.label}: ${formatFocusTime(bin.seconds)}`}
          />
        </Stack>
      ))}
    </Stack>
  )
}
