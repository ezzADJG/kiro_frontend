import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhoneStepProps {
  value: string
  onChange: (value: string) => void
  onBlur: (field: string) => void
  error?: string
  touched?: boolean
}

export function PhoneStep({
  value,
  onChange,
  onBlur,
  error,
  touched,
}: PhoneStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          ¿A qué número podemos contactarlo?
        </h3>
        <p className="text-sm text-muted-foreground">
          Ingresa un número de teléfono celular.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Teléfono
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Input
            value={value}
            onChange={(e) =>
              onChange(e.target.value.replace(/[^0-9]/g, ''))
            }
            onBlur={() => onBlur('telefono')}
            placeholder="999888777"
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
