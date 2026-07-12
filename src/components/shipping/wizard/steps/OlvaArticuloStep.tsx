import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OlvaArticuloStepProps {
  value: string
  onChange: (value: string) => void
  error?: string
  touched?: boolean
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

export function OlvaArticuloStep({
  value,
  onChange,
  error,
  touched,
}: OlvaArticuloStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          ¿Qué tipo de artículo vas a enviar?
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona la categoría que mejor describa el contenido del paquete.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Tipo de artículo
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Select value={value} onValueChange={onChange}>
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
          {touched && error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
