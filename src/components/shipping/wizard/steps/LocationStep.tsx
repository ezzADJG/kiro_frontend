import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ShalomShippingData, Agencia } from '@/types/shipping'

interface LocationStepProps {
  data: Pick<
    ShalomShippingData,
    'departamento' | 'provincia' | 'distrito' | 'agenciaDestino'
  >
  onChange: (
    field: keyof ShalomShippingData,
    value: ShalomShippingData[keyof ShalomShippingData]
  ) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
  agencias: Agencia[]
}

export function LocationStep({
  data,
  onChange,
  errors,
  touched,
  agencias,
}: LocationStepProps) {
  const departamentos = useMemo(
    () =>
      [...new Set(agencias.map((a) => a.departamento).filter(Boolean))].sort(),
    [agencias]
  )

  const provincias = useMemo(
    () =>
      [
        ...new Set(
          agencias
            .filter(
              (a) => a.departamento === data.departamento && a.provincia
            )
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
            .filter((a) => a.provincia === data.provincia && a.distrito)
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

  const handleChange = (
    field: keyof ShalomShippingData,
    value: ShalomShippingData[keyof ShalomShippingData]
  ) => {
    if (field === 'departamento' && value !== data.departamento) {
      onChange('departamento', value as string)
      onChange('provincia', '')
      onChange('distrito', '')
      onChange('agenciaDestino', null)
      return
    }
    if (field === 'provincia' && value !== data.provincia) {
      onChange('provincia', value as string)
      onChange('distrito', '')
      onChange('agenciaDestino', null)
      return
    }
    if (field === 'distrito' && value !== data.distrito) {
      onChange('distrito', value as string)
      onChange('agenciaDestino', null)
      return
    }
    onChange(field, value)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          ¿A dónde se envía el paquete?
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona la ubicación de destino y la agencia más cercana.
        </p>
      </div>

      <div className="space-y-4">
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
            label="Agencia destino"
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
              onValueChange={(v) => handleChange('agenciaDestino', Number(v))}
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
