import { useSyncExternalStore } from "react"

import { Text } from "@/components/ui/text"
import {
  getFocusNotificationIssue,
  getServerFocusNotificationIssue,
  subscribeFocusNotificationIssue,
} from "@/features/focus/notifications"

export function TimerNotificationStatus({ enabled }: { enabled: boolean }) {
  const issue = useSyncExternalStore(
    subscribeFocusNotificationIssue,
    getFocusNotificationIssue,
    getServerFocusNotificationIssue,
  )

  return (
    <Text aria-live="polite" aria-atomic tone="destructive" size="small">
      {enabled ? issue : null}
    </Text>
  )
}
