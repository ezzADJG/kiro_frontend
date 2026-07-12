import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OlvaShippingData } from '@/types/shipping'

interface OlvaPersonalStepProps {
  data: Pick<
    OlvaShippingData,
    'razonSocial' | 'apellidoPaterno' | 'apellidoMaterno'
  >
  onChange: (
    field: keyof OlvaShippingData,
    value: OlvaShippingData[keyof OlvaShippingData]
  ) => void
  onBlur: (field: string) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
}

export function OlvaPersonalStep({
  data,
  onChange,
  onBlur,
  errors,
  touched,
}: OlvaPersonalStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          Datos personales del destinatario
        </h3>
        <p className="text-sm text-muted-foreground">
          Ingresa el nombre y apellidos del destinatario.
        </p>
      </div>

      <div className="space-y-4">
        <FieldWrapper
          label="Nombre / Razón social"
          required
          error={errors.razonSocial}
          touched={touched.razonSocial}
        >
          <Input
            value={data.razonSocial}
            onChange={(e) => onChange('razonSocial', e.target.value)}
            onBlur={() => onBlur('razonSocial')}
            placeholder="Nombre o razón social"
            autoFocus
          />
        </FieldWrapper>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Apellido paterno"
            required
            error={errors.apellidoPaterno}
            touched={touched.apellidoPaterno}
          >
            <Input
              value={data.apellidoPaterno}
              onChange={(e) => onChange('apellidoPaterno', e.target.value)}
              onBlur={() => onBlur('apellidoPaterno')}
              placeholder="García"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Apellido materno"
            required
            error={errors.apellidoMaterno}
            touched={touched.apellidoMaterno}
          >
            <Input
              value={data.apellidoMaterno}
              onChange={(e) => onChange('apellidoMaterno', e.target.value)}
              onBlur={() => onBlur('apellidoMaterno')}
              placeholder="López"
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
