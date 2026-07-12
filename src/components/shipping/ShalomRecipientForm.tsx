import { useMemo, useCallback } from 'react'
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
import type { ShalomShippingData, Agencia } from '@/types/shipping'

interface ShalomRecipientFormProps {
  data: ShalomShippingData
  onChange: (data: ShalomShippingData) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
  onBlur: (field: string) => void
  agencias: Agencia[]
}

function updateField<T extends ShalomShippingData>(
  prev: T,
  field: keyof T,
  value: T[keyof T]
): T {
  return { ...prev, [field]: value }
}

export function ShalomRecipientForm({
  data,
  onChange,
  errors,
  touched,
  onBlur,
  agencias,
}: ShalomRecipientFormProps) {
  const departamentos = useMemo(
    () => [...new Set(agencias.map((a) => a.departamento))].sort(),
    [agencias]
  )

  const provincias = useMemo(
    () =>
      [
        ...new Set(
          agencias
            .filter((a) => a.departamento === data.departamento)
            .map((a) => a.provincia)
        ),
      ].sort(),
    [agencias, data.departamento]
  )

  const distritos = useMemo(
    () =>
      [
        ...new Set(
          agencias
            .filter((a) => a.provincia === data.provincia)
            .map((a) => a.distrito)
        ),
      ].sort(),
    [agencias, data.provincia]
  )

  const agenciasFiltradas = useMemo(
    () =>
      agencias
        .filter((a) => a.distrito === data.distrito)
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [agencias, data.distrito]
  )

  const handleChange = useCallback(
    (field: keyof ShalomShippingData, value: ShalomShippingData[keyof ShalomShippingData]) => {
      if (
        field === 'departamento' &&
        value !== data.departamento
      ) {
        onChange({
          ...data,
          departamento: value as string,
          provincia: '',
          distrito: '',
          agenciaDestino: null,
        })
        return
      }
      if (field === 'provincia' && value !== data.provincia) {
        onChange({
          ...data,
          provincia: value as string,
          distrito: '',
          agenciaDestino: null,
        })
        return
      }
      if (field === 'distrito' && value !== data.distrito) {
        onChange({
          ...data,
          distrito: value as string,
          agenciaDestino: null,
        })
        return
      }
      onChange(updateField(data, field, value))
    },
    [data, onChange]
  )

  return (
    <div className="space-y-6">
      <ShippingSection
        title="Información personal"
        description="Datos del destinatario del envío."
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
                handleChange('tipoDocumento', v as 'DNI' | 'RUC' | 'CE')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="RUC">RUC</SelectItem>
                <SelectItem value="CE">Carnet de Extranjería</SelectItem>
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            label="Documento del destinatario"
            required
            error={errors.documentoDestinatario}
            touched={touched.documentoDestinatario}
          >
            <Input
              value={data.documentoDestinatario}
              onChange={(e) =>
                handleChange('documentoDestinatario', e.target.value)
              }
              onBlur={() => onBlur('documentoDestinatario')}
              placeholder="N° de documento"
            />
          </FieldWrapper>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Teléfono del destinatario"
            required
            error={errors.telefonoDestinatario}
            touched={touched.telefonoDestinatario}
          >
            <Input
              value={data.telefonoDestinatario}
              onChange={(e) =>
                handleChange(
                  'telefonoDestinatario',
                  e.target.value.replace(/[^0-9]/g, '')
                )
              }
              onBlur={() => onBlur('telefonoDestinatario')}
              placeholder="999888777"
            />
          </FieldWrapper>
        </div>
      </ShippingSection>

      <ShippingSection
        title="Información de contacto"
        description="Datos opcionales de una persona de contacto."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Documento de contacto"
            error={errors.documentoContacto}
            touched={touched.documentoContacto}
          >
            <Input
              value={data.documentoContacto}
              onChange={(e) =>
                handleChange('documentoContacto', e.target.value)
              }
              onBlur={() => onBlur('documentoContacto')}
              placeholder="Opcional"
            />
          </FieldWrapper>
          <FieldWrapper
            label="Teléfono de contacto"
            error={errors.telefonoContacto}
            touched={touched.telefonoContacto}
          >
            <Input
              value={data.telefonoContacto}
              onChange={(e) =>
                handleChange(
                  'telefonoContacto',
                  e.target.value.replace(/[^0-9]/g, '')
                )
              }
              onBlur={() => onBlur('telefonoContacto')}
              placeholder="Opcional"
            />
          </FieldWrapper>
        </div>
      </ShippingSection>

      <ShippingSection
        title="Destino"
        description="Lugar de entrega del paquete."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Departamento"
            required
            error={errors.departamento}
            touched={touched.departamento}
          >
            <Select
              value={data.departamento}
              onValueChange={(v) => handleChange('departamento', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((dep) => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            label="Provincia"
            required
            error={errors.provincia}
            touched={touched.provincia}
          >
            <Select
              value={data.provincia}
              onValueChange={(v) => handleChange('provincia', v)}
              disabled={!data.departamento}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {provincias.map((prov) => (
                  <SelectItem key={prov} value={prov}>
                    {prov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper
            label="Distrito"
            required
            error={errors.distrito}
            touched={touched.distrito}
          >
            <Select
              value={data.distrito}
              onValueChange={(v) => handleChange('distrito', v)}
              disabled={!data.provincia}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {distritos.map((dis) => (
                  <SelectItem key={dis} value={dis}>
                    {dis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            label="Agencia Shalom destino"
            required
            error={errors.agenciaDestino}
            touched={touched.agenciaDestino}
          >
            <Select
              value={
                data.agenciaDestino !== null
                  ? String(data.agenciaDestino)
                  : ''
              }
              onValueChange={(v) =>
                handleChange('agenciaDestino', Number(v))
              }
              disabled={!data.distrito}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {agenciasFiltradas.map((ag) => (
                  <SelectItem key={ag.id} value={String(ag.id)}>
                    {ag.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
        </div>
      </ShippingSection>

      <ShippingSection
        title="Dirección"
        description="Dirección completa de entrega."
      >
        <div className="space-y-4">
          <FieldWrapper
            label="Dirección completa"
            required
            error={errors.direccion}
            touched={touched.direccion}
          >
            <Input
              value={data.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              onBlur={() => onBlur('direccion')}
              placeholder="Av. / Jr. / Calle, N°, Urbanización"
            />
          </FieldWrapper>
          <FieldWrapper
            label="Referencia"
            error={errors.referencia}
            touched={touched.referencia}
          >
            <Input
              value={data.referencia}
              onChange={(e) => handleChange('referencia', e.target.value)}
              onBlur={() => onBlur('referencia')}
              placeholder="Opcional - Ej: frente al parque"
            />
          </FieldWrapper>
        </div>
      </ShippingSection>

      <ShippingSection
        title="Mercadería"
        description="Descripción de los productos a enviar."
      >
        <FieldWrapper
          label="Descripción de mercadería"
          required
          error={errors.descripcionMercaderia}
          touched={touched.descripcionMercaderia}
        >
          <textarea
            value={data.descripcionMercaderia}
            onChange={(e) =>
              handleChange('descripcionMercaderia', e.target.value)
            }
            onBlur={() => onBlur('descripcionMercaderia')}
            placeholder="Describa los productos que se enviarán"
            className="h-20 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          />
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
