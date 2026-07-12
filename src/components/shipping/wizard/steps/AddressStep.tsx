import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressStepProps {
  direccion: string
  referencia: string
  onDireccionChange: (value: string) => void
  onReferenciaChange: (value: string) => void
  onBlur: (field: string) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
}

export function AddressStep({
  direccion,
  referencia,
  onDireccionChange,
  onReferenciaChange,
  onBlur,
  errors,
  touched,
}: AddressStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          Dirección de entrega
        </h3>
        <p className="text-sm text-muted-foreground">
          Ingresa la dirección completa y una referencia opcional.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Dirección completa
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Input
            value={direccion}
            onChange={(e) => onDireccionChange(e.target.value)}
            onBlur={() => onBlur('direccion')}
            placeholder="Av. / Jr. / Calle, N°, Urbanización"
            autoFocus
          />
          {touched.direccion && errors.direccion && (
            <p className="text-[11px] text-destructive">
              {errors.direccion}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Referencia</Label>
          <Input
            value={referencia}
            onChange={(e) => onReferenciaChange(e.target.value)}
            onBlur={() => onBlur('referencia')}
            placeholder="Opcional - Ej: frente al parque"
          />
        </div>
      </div>
    </div>
  )
}
