import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DocumentStepProps {
  tipoDocumento: string
  documento?: string
  onTipoChange: (value: string) => void
  onDocumentoChange?: (value: string) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
  onBlur: (field: string) => void
  tipoOptions?: { value: string; label: string }[]
  showDocumentNumber?: boolean
}

export function DocumentStep({
  tipoDocumento,
  documento = '',
  onTipoChange,
  onDocumentoChange = () => {},
  errors,
  touched,
  onBlur,
  tipoOptions = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'CE', label: 'Carnet de Extranjería' },
  ],
  showDocumentNumber = true,
}: DocumentStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          Documento de identidad del destinatario
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona el tipo de documento{showDocumentNumber ? ' e ingresa el número' : '.'}
        </p>
      </div>

      <div className="space-y-4">
        <FieldWrapper
          label="Tipo de documento"
          required
          error={errors.tipoDocumento}
          touched={touched.tipoDocumento}
        >
          <Select value={tipoDocumento} onValueChange={onTipoChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {tipoOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        {showDocumentNumber && (
          <FieldWrapper
            label="Número de documento"
            required
            error={errors.documento}
            touched={touched.documento}
          >
            <Input
              value={documento}
              onChange={(e) => onDocumentoChange(e.target.value)}
              onBlur={() => onBlur('documento')}
              placeholder="Ingresa el número de documento"
              autoFocus
            />
          </FieldWrapper>
        )}
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
