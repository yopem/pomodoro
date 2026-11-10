import type { ChangeEvent } from "react"

import { FileJsonIcon, FolderOpenIcon, UploadIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Stack } from "@/components/ui/stack"
import { Text } from "@/components/ui/text"

export function BackupFilePicker({
  file,
  disabled,
  onSelect,
}: {
  file: File | null
  disabled: boolean
  onSelect: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const chooseRef = useRef<HTMLButtonElement>(null)

  const [events] = useState(function createFileEvents() {
    function choose() {
      inputRef.current?.click()
    }

    function select(event: ChangeEvent<HTMLInputElement>) {
      const selected = event.currentTarget.files?.[0] ?? null
      onSelect(selected)
      event.currentTarget.value = ""
    }

    function remove() {
      onSelect(null)
      chooseRef.current?.focus()
    }

    return { choose, select, remove }
  })

  return (
    <Stack>
      <input
        ref={inputRef}
        id="backup-file"
        type="file"
        accept="application/json,.json"
        aria-label="Backup JSON file"
        disabled={disabled}
        hidden
        onChange={events.select}
      />
      <HStack layout="spread">
        <HStack wrap={false}>
          {file ? (
            <FileJsonIcon size={24} aria-hidden="true" />
          ) : (
            <UploadIcon size={24} aria-hidden="true" />
          )}
          <Stack spacing="compact" aria-live="polite" aria-atomic="true">
            <Text variant="label">
              {file ? file.name : "No backup selected"}
            </Text>
            <Text size="small" tone="muted">
              {file
                ? `${Math.ceil(file.size / 1024).toLocaleString()} KB selected`
                : "Choose the file you want to restore."}
            </Text>
          </Stack>
        </HStack>
        <HStack layout="row">
          <Button
            ref={chooseRef}
            variant="outline"
            size="xl"
            disabled={disabled}
            aria-controls="backup-file"
            aria-describedby="backup-file-help"
            onClick={events.choose}
          >
            <FolderOpenIcon size={16} aria-hidden="true" />
            {file ? "Change file" : "Choose file"}
          </Button>
          {file && (
            <Button
              variant="ghost"
              size="xl"
              disabled={disabled}
              aria-label="Remove selected backup"
              onClick={events.remove}
            >
              <XIcon size={16} aria-hidden="true" /> Remove
            </Button>
          )}
        </HStack>
      </HStack>
      <Text id="backup-file-help" size="small" tone="muted">
        JSON backup · Maximum 10 MB
      </Text>
    </Stack>
  )
}
