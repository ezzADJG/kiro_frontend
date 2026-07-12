import { Check, Truck, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Transportista } from '@/types/shipping'

interface AgencySelectorStepProps {
  value: Transportista | null
  onSelect: (agency: Transportista) => void
}

const agencies = [
  {
    id: 'SHALOM' as Transportista,
    name: 'Shalom',
    description: 'Red de agencias a nivel nacional',
    icon: Truck,
  },
  {
    id: 'OLVA' as Transportista,
    name: 'Olva Courier',
    description: 'Envíos express y estándar',
    icon: Package,
  },
]

export function AgencySelectorStep({
  value,
  onSelect,
}: AgencySelectorStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          ¿Con qué agencia deseas realizar el envío?
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona la empresa de transporte para tu pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {agencies.map((agency) => {
          const isSelected = value === agency.id
          const Icon = agency.icon
          return (
            <button
              key={agency.id}
              type="button"
              onClick={() => onSelect(agency.id)}
              className={cn(
                'relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200',
                'hover:border-primary/50 hover:bg-muted/50',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card'
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{agency.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agency.description}
                </p>
              </div>
              {isSelected && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
