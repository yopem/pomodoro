import type { ReactNode } from "react"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Text } from "@/components/ui/text"
import { appStyles } from "@/styles/app.stylex"

export function ConfirmAction({
  title,
  description,
  children,
  onConfirm,
}: {
  title: string
  description: string
  children: ReactNode
  onConfirm: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const action = useRef(onConfirm)

  function changeOpen(next: boolean) {
    if (pending) return

    if (next) {
      action.current = onConfirm
      setError(null)
    }

    setOpen(next)
  }

  async function confirm() {
    if (pending) return
    setPending(true)
    setError(null)

    try {
      await action.current()
      setOpen(false)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The change could not be saved",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={<Button variant="destructive-outline" size="sm" />}
      >
        {children}
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <Text role="alert" xstyle={appStyles.error}>
            {error}
          </Text>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" loading={pending} onClick={confirm}>
            {title}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
