import { useState, useEffect, useCallback } from "react"

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: "success" | "error" | "info"
}

type Listener = (toasts: ToastItem[]) => void

let listeners: Listener[] = []
let memoryToasts: ToastItem[] = []

function emitChange() {
  listeners.forEach((l) => l(memoryToasts))
}

export function toast({
  title,
  description,
  variant = "info",
}: {
  title: string
  description?: string
  variant?: "success" | "error" | "info"
}) {
  const id = Math.random().toString(36).slice(2)
  memoryToasts = [...memoryToasts, { id, title, description, variant }]
  emitChange()
  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id)
    emitChange()
  }, 4000)
  return id
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryToasts)

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setToasts)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id)
    emitChange()
  }, [])

  return { toasts, dismiss }
}
