import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatusBadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const styles = {
  default: 'bg-secondary text-secondary-foreground border border-border',
  success: 'bg-muted text-foreground border border-border',
  warning: 'bg-muted text-foreground border border-border',
  danger: 'bg-destructive/10 text-destructive border border-destructive/20',
  info: 'bg-muted text-foreground border border-border',
}

export default function StatusBadge({ children, variant = 'default', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
