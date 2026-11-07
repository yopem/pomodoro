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

export function ConfirmAction<T>({
  title,
  description,
  children,
  targetId,
  data,
  onConfirm,
}: {
  title: string
  description: string
  children: ReactNode
  targetId: string
  data: T
  onConfirm: (id: string, data: T) => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="destructive-outline" size="sm" />}
      >
        {children}
      </DialogTrigger>
      {open && (
        <ConfirmationContent
          title={title}
          description={description}
          targetId={targetId}
          data={data}
          onConfirm={onConfirm}
          onOpenChange={setOpen}
        />
      )}
    </Dialog>
  )
}

export function ConfirmationContent<T>({
  title,
  description,
  targetId,
  data,
  onConfirm,
  onOpenChange,
}: {
  title: string
  description: string
  targetId: string
  data: T
  onConfirm: (id: string, data: T) => Promise<void>
  onOpenChange: (open: boolean) => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const [events] = useState(function createConfirmationEvents() {
    async function confirm() {
      if (inFlight.current) return
      inFlight.current = true
      setPending(true)
      setError(null)

      try {
        await onConfirm(targetId, data)
        onOpenChange(false)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The change could not be saved",
        )
      } finally {
        inFlight.current = false
        setPending(false)
      }
    }

    return { confirm }
  })

  return (
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
        <Button
          variant="destructive"
          loading={pending}
          onClick={events.confirm}
        >
          {title}
        </Button>
      </DialogFooter>
    </DialogPopup>
  )
}
