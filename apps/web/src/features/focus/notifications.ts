let deliveryUnsupported = false

export function focusNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported"

  return deliveryUnsupported ? "unsupported" : Notification.permission
}

export async function requestFocusNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported"

  deliveryUnsupported = false

  return await Notification.requestPermission()
}

export function showFocusNotification(input: { title: string; body: string }) {
  if (focusNotificationPermission() !== "granted") return

  try {
    new Notification(input.title, { body: input.body })
  } catch {
    deliveryUnsupported = true
  }
}
