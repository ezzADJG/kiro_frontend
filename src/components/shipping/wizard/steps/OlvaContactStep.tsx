import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OlvaShippingData } from '@/types/shipping'

interface OlvaContactStepProps {
  data: Pick<OlvaShippingData, 'celular' | 'contacto'>
  onChange: (
    field: keyof OlvaShippingData,
    value: OlvaShippingData[keyof OlvaShippingData]
  ) => void
  onBlur: (field: string) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
}

export function OlvaContactStep({
  data,
  onChange,
  onBlur,
  errors,
  touched,
}: OlvaContactStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          Información de contacto
        </h3>
        <p className="text-sm text-muted-foreground">
          Ingresa los números de teléfono para la entrega.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Celular"
            required
            error={errors.celular}
            touched={touched.celular}
          >
            <Input
              value={data.celular}
              onChange={(e) =>
                onChange('celular', e.target.value.replace(/[^0-9]/g, ''))
              }
              onBlur={() => onBlur('celular')}
              placeholder="999888777"
              autoFocus
            />
          </FieldWrapper>

          <FieldWrapper
            label="Contacto"
            required
            error={errors.contacto}
            touched={touched.contacto}
          >
            <Input
              value={data.contacto}
              onChange={(e) =>
                onChange('contacto', e.target.value.replace(/[^0-9]/g, ''))
              }
              onBlur={() => onBlur('contacto')}
              placeholder="Número de contacto"
            />
          </FieldWrapper>
        </div>
      </div>
    </div>
  )
}

function FieldWrapper({
  label,
  required,
  error,
  touched,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  touched?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {touched && error && (
        <p className="text-[11px] text-destructive">{error}</p>
      )}
    </div>
  )
}
