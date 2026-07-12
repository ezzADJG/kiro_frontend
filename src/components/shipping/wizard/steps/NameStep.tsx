import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NameStepProps {
  value: string
  onChange: (value: string) => void
  onBlur: (field: string) => void
  error?: string
  touched?: boolean
}

export function NameStep({
  value,
  onChange,
  onBlur,
  error,
  touched,
}: NameStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          ¿Cuál es su nombre completo?
        </h3>
        <p className="text-sm text-muted-foreground">
          Ingresa el nombre completo del destinatario.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Nombre completo
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => onBlur('nombre')}
            placeholder="Nombres y apellidos"
            autoFocus
          />
          {touched && error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
