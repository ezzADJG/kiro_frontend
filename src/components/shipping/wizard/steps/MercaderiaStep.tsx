import { Label } from '@/components/ui/label'

interface MercaderiaStepProps {
  value: string
  onChange: (value: string) => void
  onBlur: (field: string) => void
  error?: string
  touched?: boolean
}

export function MercaderiaStep({
  value,
  onChange,
  onBlur,
  error,
  touched,
}: MercaderiaStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          Describe la mercadería
        </h3>
        <p className="text-sm text-muted-foreground">
          Indica qué productos se enviarán en el paquete.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Descripción de mercadería
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => onBlur('descripcionMercaderia')}
            placeholder="Ej: 2 camisetas de algodón talle M, 1 par de jeans"
            rows={4}
            autoFocus
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          {touched && error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
