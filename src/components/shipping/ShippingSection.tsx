import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'

interface ShippingSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function ShippingSection({ title, description, children }: ShippingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
      <Separator />
    </div>
  )
}
