import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2 } from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'
import {
  getRequiredFieldCount,
  getCompletedRequiredCount,
  isFieldComplete,
} from '@/lib/inventory'
import FieldCard from './FieldCard'

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  campos: BusinessTypeField[]
  product: Record<string, any> | null
  optionsByField: Record<string, string[]>
  onSave: (values: Record<string, any>) => Promise<void>
  dataType?: 'stock' | 'services'
}

const CUSTOM_OPTION = '__custom__'

export default function ProductFormModal({
  open,
  onClose,
  campos,
  product,
  optionsByField,
  onSave,
  dataType = 'stock',
}: ProductFormModalProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [customSelectFields, setCustomSelectFields] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialValues: Record<string, any> = {}
    const custom = new Set<string>()

    for (const campo of campos) {
      const current = product?.[campo.key]

      if (campo.tipo === 'booleano') {
        initialValues[campo.key] = typeof current === 'boolean' ? current : false
        continue
      }

      if (campo.tipo === 'numero') {
        initialValues[campo.key] = current ?? ''
        continue
      }

      if (campo.tipo === 'select') {
        const opts = optionsByField[campo.key] ?? []
        if (typeof current === 'string' && current.trim()) {
          initialValues[campo.key] = current
          if (opts.length === 0 || !opts.includes(current)) {
            custom.add(campo.key)
          }
        } else {
          initialValues[campo.key] = ''
          if (opts.length === 0) custom.add(campo.key)
        }
        continue
      }

      initialValues[campo.key] = typeof current === 'string' ? current : ''
    }

    setValues(initialValues)
    setCustomSelectFields(custom)
    setError(null)
  }, [product, campos, open, optionsByField])

  const totalRequired = useMemo(() => getRequiredFieldCount(campos), [campos])
  const completedRequired = useMemo(
    () => getCompletedRequiredCount(campos, values),
    [campos, values]
  )
  const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {}

    for (const campo of campos) {
      if (!campo.requerido) continue
      const val = values[campo.key]
      if (!isFieldComplete(campo, val)) {
        errors[campo.key] = `Este campo es obligatorio`
      }
    }

    return errors
  }, [campos, values])

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleToggleCustom = (key: string) => {
    setCustomSelectFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    setValues((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const firstError = Object.values(fieldErrors)[0]
    if (firstError) {
      setError(firstError)
      return
    }

    const payload: Record<string, any> = {}
    for (const campo of campos) {
      const val = values[campo.key]
      if (campo.tipo === 'numero') {
        if (val !== '' && val !== undefined && val !== null) {
          payload[campo.key] = Number(val)
        }
      } else if (campo.tipo === 'booleano') {
        payload[campo.key] = val === true
      } else {
        if (typeof val === 'string' && val.trim()) {
          payload[campo.key] = val.trim()
        }
      }
    }

    setSaving(true)
    try {
      await onSave(payload)
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const itemLabel = dataType === 'services' ? 'servicio' : 'producto'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-lg dark:bg-neutral-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-lg font-medium">
            {product ? `Editar ${itemLabel}` : `Nuevo ${itemLabel}`}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {totalRequired > 0 && (
          <div className="border-b border-neutral-100 px-6 py-3 dark:border-neutral-800">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-green-500" />
                {completedRequired} de {totalRequired} campos requeridos
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {campos.map((campo, index) => (
            <FieldCard
              key={campo.key}
              field={campo}
              value={values[campo.key]}
              options={optionsByField[campo.key] ?? []}
              isCustomSelect={customSelectFields.has(campo.key)}
              onChange={(v) => handleChange(campo.key, v)}
              onToggleCustom={() => handleToggleCustom(campo.key)}
              error={fieldErrors[campo.key] ?? null}
              index={index}
              total={campos.length}
            />
          ))}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : product ? 'Guardar cambios' : `Crear ${itemLabel}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
