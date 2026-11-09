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

  let registration: ServiceWorkerRegistration | undefined

  if ("serviceWorker" in navigator) {
    try {
      registration = await navigator.serviceWorker.getRegistration("/")
    } catch {
      registration = undefined
    }
  }

  if (focusNotificationPermission() !== "granted" || !input.canNotify()) return

  try {
    if (registration?.active && "showNotification" in registration)
      await registration.showNotification(input.title, { body: input.body })
    else new Notification(input.title, { body: input.body })
  } catch {
    console.warn("Focus notification is unavailable")
  }
}
