import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  icon?: React.ElementType
  width?: string
}

export default function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  icon: Icon,
  width = 'w-[480px]',
}: SlidePanelProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-all duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full flex-col bg-white shadow-2xl ring-1 ring-foreground/5 transition-all duration-300 ease-out',
          width,
          open ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border p-5">{footer}</div>}
      </div>
    </>
  )
}
