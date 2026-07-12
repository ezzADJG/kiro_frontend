import { CheckCircle, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardSuccessProps {
  ordenId?: string
}

export function WizardSuccess({ ordenId }: WizardSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="relative">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full bg-green-100',
            'animate-in zoom-in duration-500 fill-mode-both'
          )}
        >
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div
          className={cn(
            'absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary',
            'animate-in zoom-in duration-500 fill-mode-both delay-200'
          )}
        >
          <Truck className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <h3
          className={cn(
            'text-lg font-semibold text-foreground',
            'animate-in fade-in duration-500 fill-mode-both delay-300'
          )}
        >
          ¡Información registrada!
        </h3>
        <p
          className={cn(
            'text-sm text-muted-foreground',
            'animate-in fade-in duration-500 fill-mode-both delay-500'
          )}
        >
          La información de envío ha sido guardada correctamente.
          <br />
          Pronto recibirás las indicaciones para el seguimiento de tu pedido.
        </p>
      </div>

      {ordenId && (
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1',
            'animate-in fade-in duration-500 fill-mode-both delay-700'
          )}
        >
          <span className="text-xs text-muted-foreground">
            Orden: {ordenId}
          </span>
        </div>
      )}
    </div>
  )
}
