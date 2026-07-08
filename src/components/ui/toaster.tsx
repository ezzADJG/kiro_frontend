import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { XIcon, CircleCheck, CircleX, Info } from "lucide-react"

const icons = {
  success: CircleCheck,
  error: CircleX,
  info: Info,
}

const variants: Record<string, string> = {
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  info:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant]
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-2 fade-in duration-300",
              variants[t.variant]
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-sm opacity-80">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
