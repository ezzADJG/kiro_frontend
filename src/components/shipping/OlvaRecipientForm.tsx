import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShippingSection } from './ShippingSection'
import type { OlvaShippingData } from '@/types/shipping'

interface OlvaRecipientFormProps {
  data: OlvaShippingData
  onChange: (data: OlvaShippingData) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
  onBlur: (field: string) => void
}

const TIPO_ARTICULO_OPTS = [
  'Documentos',
  'Mercancía',
  'Muestras',
  'Regalos',
  'Electrónicos',
  'Ropa',
  'Alimentos',
  'Otros',
]

const TIPO_DOCUMENTO_OPTS = [
  { value: 'DNI' as const, label: 'DNI' },
  { value: 'RUC' as const, label: 'RUC' },
  { value: 'CE' as const, label: 'Carnet de Extranjería' },
]

export function OlvaRecipientForm({
  data,
  onChange,
  errors,
  touched,
  onBlur,
}: OlvaRecipientFormProps) {
  const handleChange = useCallback(
    (field: keyof OlvaShippingData, value: OlvaShippingData[keyof OlvaShippingData]) => {
      onChange({ ...data, [field]: value })
    },
    [data, onChange]
  )

  return (
    <div className="space-y-6">
      <ShippingSection
        title="Información del destinatario"
        description="Datos personales para la guía Olva Courier."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Tipo de documento"
            required
            error={errors.tipoDocumento}
            touched={touched.tipoDocumento}
          >
            <Select
              value={data.tipoDocumento}
              onValueChange={(v) =>
                handleChange('tipoDocumento', v as 'RUC' | 'DNI' | 'CE')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_DOCUMENTO_OPTS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            label="Celular"
            required
            error={errors.celular}
            touched={touched.celular}
          >
            <Input
              value={data.celular}
              onChange={(e) =>
                handleChange('celular', e.target.value.replace(/[^0-9]/g, ''))
              }
              onBlur={() => onBlur('celular')}
              placeholder="999888777"
            />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Razón social"
            required
            error={errors.razonSocial}
            touched={touched.razonSocial}
          >
            <Input
              value={data.razonSocial}
              onChange={(e) => handleChange('razonSocial', e.target.value)}
              onBlur={() => onBlur('razonSocial')}
              placeholder="Nombre o razón social"
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
                handleChange('contacto', e.target.value.replace(/[^0-9]/g, ''))
              }
              onBlur={() => onBlur('contacto')}
              placeholder="Número de contacto"
            />
          </FieldWrapper>
        </div>
      </ShippingSection>

      <ShippingSection
        title="Apellidos"
        description="Apellidos del destinatario."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Apellido paterno"
            required
            error={errors.apellidoPaterno}
            touched={touched.apellidoPaterno}
          >
            <Input
              value={data.apellidoPaterno}
              onChange={(e) =>
                handleChange('apellidoPaterno', e.target.value)
              }
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
              onChange={(e) =>
                handleChange('apellidoMaterno', e.target.value)
              }
              onBlur={() => onBlur('apellidoMaterno')}
              placeholder="López"
            />
          </FieldWrapper>
        </div>
      </ShippingSection>

      <ShippingSection
        title="Artículo"
        description="Tipo de artículo a enviar."
      >
        <FieldWrapper
          label="Tipo de artículo"
          required
          error={errors.tipoArticulo}
          touched={touched.tipoArticulo}
        >
          <Select
            value={data.tipoArticulo}
            onValueChange={(v) => handleChange('tipoArticulo', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {TIPO_ARTICULO_OPTS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      </ShippingSection>
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
