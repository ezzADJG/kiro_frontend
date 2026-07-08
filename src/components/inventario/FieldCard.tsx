import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tag,
  DollarSign,
  Package,
  AlertTriangle,
  FolderOpen,
  Ruler,
  Palette,
  Hash,
  Box,
  CheckCircle,
  FileText,
  Building2,
  ChefHat,
  type LucideIcon,
} from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'
import { formatFieldLabel } from '@/lib/inventory'

function getFieldIcon(key: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    nombre: Tag,
    titulo: Tag,
    name: Tag,
    precio: DollarSign,
    costo: DollarSign,
    price: DollarSign,
    stock: Package,
    stock_minimo: AlertTriangle,
    categoria: FolderOpen,
    category: FolderOpen,
    marca: Building2,
    brand: Building2,
    talla: Ruler,
    size: Ruler,
    color: Palette,
    sku: Hash,
    codigo_barra: FileText,
    barcode: FileText,
    unidad: Box,
    unit: Box,
    disponible: CheckCircle,
    descripcion_corta: FileText,
    descripcion_larga: FileText,
    description: FileText,
    proveedor: Building2,
    supplier: Building2,
    plato: ChefHat,
    duracion_minutos: AlertTriangle,
  }
  return map[key] ?? Tag
}

interface FieldCardProps {
  field: BusinessTypeField
  value: unknown
  options: string[]
  isCustomSelect?: boolean
  onChange?: (value: unknown) => void
  onToggleCustom?: () => void
  error?: string | null
  index?: number
  total?: number
}

export default function FieldCard({
  field,
  value,
  options,
  isCustomSelect = false,
  onChange,
  onToggleCustom,
  error,
  index,
  total,
}: FieldCardProps) {
  const Icon = getFieldIcon(field.key)

  const handleChange = (v: unknown) => {
    onChange?.(v)
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium leading-none">
            {field.label || formatFieldLabel(field.key)}
            {field.requerido && <span className="ml-1 text-red-500">*</span>}
          </Label>
        </div>
        {total !== undefined && index !== undefined && (
          <span className="text-xs text-muted-foreground">
            {index + 1}/{total}
          </span>
        )}
      </div>

      {field.tipo === 'booleano' ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChange(true)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              value === true
                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400'
            }`}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => handleChange(false)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              value === false
                ? 'border-neutral-400 bg-neutral-100 text-neutral-700 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-300'
                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400'
            }`}
          >
            No
          </button>
        </div>
      ) : field.tipo === 'select' ? (
        <div className="space-y-2">
          {options.length > 0 && !isCustomSelect && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChange(option)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      value === option
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                {onToggleCustom && (
                  <button
                    type="button"
                    onClick={onToggleCustom}
                    className="rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:text-neutral-300"
                  >
                    + Agregar nuevo
                  </button>
                )}
              </div>
            </>
          )}
          {(isCustomSelect || options.length === 0) && (
            <div className="space-y-2">
              <Input
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={
                  options.length === 0
                    ? field.placeholder || 'Escribe un valor'
                    : 'Escribe un valor nuevo...'
                }
                className="flex-1"
              />
              {isCustomSelect && options.length > 0 && onToggleCustom && (
                <button
                  type="button"
                  onClick={onToggleCustom}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  ← Volver a opciones
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <Input
          id={field.key}
          type={field.tipo === 'numero' ? 'number' : 'text'}
          value={
            value === undefined || value === null
              ? ''
              : String(value)
          }
          onChange={(e) => {
            const raw = e.target.value
            if (field.tipo === 'numero') {
              handleChange(raw === '' ? '' : raw)
            } else {
              handleChange(raw)
            }
          }}
          placeholder={field.placeholder || formatFieldLabel(field.key)}
          step={field.tipo === 'numero' ? '0.01' : undefined}
          inputMode={field.tipo === 'numero' ? 'decimal' : undefined}
          className="flex-1"
        />
      )}

      {field.ayuda && (
        <p className="text-xs text-muted-foreground">{field.ayuda}</p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
