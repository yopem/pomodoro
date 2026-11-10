import type { ReactElement, ReactNode } from "react"

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
import { useEventCallback } from "@/hooks/use-event-callback"

export function ConfirmAction<T, Owner>({
  title,
  description,
  children,
  trigger,
  targetId,
  data,
  owner,
  onConfirm,
}: {
  title: string
  description: string
  children: ReactNode
  trigger?: ReactElement
  targetId: string
  data: T
  owner: Owner
  onConfirm: (id: string, data: T, owner: Owner) => Promise<void>
}) {
  const nextId = useRef(0)

  const [opening, setOpening] = useState<{
    id: number
    open: boolean
    targetId: string
    data: T
    owner: Owner
    onConfirm: typeof onConfirm
  } | null>(null)

  const changeOpen = useEventCallback((open: boolean) => {
    if (open) {
      nextId.current += 1
      setOpening({ id: nextId.current, open, targetId, data, owner, onConfirm })
    } else {
      setOpening((current) => current && { ...current, open: false })
    }
  })

  return (
    <Dialog open={opening?.open ?? false} onOpenChange={changeOpen}>
      <DialogTrigger
        render={trigger ?? <Button variant="destructive-outline" size="sm" />}
      >
        {children}
      </DialogTrigger>
      {opening && (
        <ScopedConfirmationContent
          key={opening.id}
          title={title}
          description={description}
          opening={opening}
          setOpening={setOpening}
        />
      )}
    </Dialog>
  )
}

export function ScopedConfirmationContent<T, Owner>({
  title,
  description,
  opening,
  setOpening,
}: {
  title: string
  description: string
  opening: {
    id: number
    open: boolean
    targetId: string
    data: T
    owner: Owner
    onConfirm: (id: string, data: T, owner: Owner) => Promise<void>
  }
  setOpening: React.Dispatch<React.SetStateAction<typeof opening | null>>
}) {
  const [close] = useState(
    () =>
      function closeMatchingOpening(open: boolean) {
        setOpening((current) =>
          current?.id === opening.id ? { ...current, open } : current,
        )
      },
  )

  return (
    <ConfirmationContent
      title={title}
      description={description}
      targetId={opening.targetId}
      data={opening.data}
      owner={opening.owner}
      onConfirm={opening.onConfirm}
      onOpenChange={close}
    />
  )
}

export function ConfirmationContent<T, Owner>({
  title,
  description,
  targetId,
  data,
  owner,
  onConfirm,
  onOpenChange,
}: {
  title: string
  description: string
  targetId: string
  data: T
  owner: Owner
  onConfirm: (id: string, data: T, owner: Owner) => Promise<void>
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
        await onConfirm(targetId, data, owner)
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
        <Text role="alert" tone="destructive">
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
