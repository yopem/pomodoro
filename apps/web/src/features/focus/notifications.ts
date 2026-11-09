let issue: string | null = null

let latestAttempt = 0

const listeners = new Set<() => void>()

function publishIssue(next: string | null) {
  if (issue === next) return
  issue = next

  for (const listener of listeners) listener()
}

export function getFocusNotificationIssue() {
  return issue
}

export function getServerFocusNotificationIssue() {
  return null
}

export function subscribeFocusNotificationIssue(listener: () => void) {
  listeners.add(listener)

  return function unsubscribe() {
    listeners.delete(listener)
  }
}

export function clearFocusNotificationIssue() {
  latestAttempt += 1
  publishIssue(null)
}

export function focusNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported"

  return Notification.permission
}

export async function requestFocusNotificationPermission() {
  if (focusNotificationPermission() === "unsupported") return "unsupported"

  return await Notification.requestPermission()
}

export async function showFocusNotification(input: {
  title: string
  body: string
  canNotify: () => boolean
}) {
  if (focusNotificationPermission() !== "granted" || !input.canNotify()) return

  const attempt = ++latestAttempt
  let registration: ServiceWorkerRegistration | undefined

  if ("serviceWorker" in navigator) {
    try {
      registration = await navigator.serviceWorker.getRegistration("/")
    } catch {
      registration = undefined
    }
  }

  if (
    attempt !== latestAttempt ||
    focusNotificationPermission() !== "granted" ||
    !input.canNotify()
  )
    return

  try {
    if (registration?.active && "showNotification" in registration)
      await registration.showNotification(input.title, { body: input.body })
    else new Notification(input.title, { body: input.body })

    if (attempt === latestAttempt && input.canNotify()) publishIssue(null)
  } catch {
    if (attempt === latestAttempt && input.canNotify())
      publishIssue(
        "The last notification could not be shown. Check browser notification settings.",
      )
    console.warn("Focus notification is unavailable")
  }
}
