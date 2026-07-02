import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'
import { formatFieldLabel } from '@/lib/inventory'

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  campos: BusinessTypeField[]
  product: Record<string, any> | null
  optionsByField: Record<string, string[]>
  onSave: (values: Record<string, any>) => Promise<void>
}

const CUSTOM_OPTION = '__custom__'

export default function ProductFormModal({
  open,
  onClose,
  campos,
  product,
  optionsByField,
  onSave,
}: ProductFormModalProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [customSelectFields, setCustomSelectFields] = useState<Set<string>>(
    new Set()
  )
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
        const options = optionsByField[campo.key] ?? []
        if (typeof current === 'string' && current.trim()) {
          initialValues[campo.key] = current
          if (options.length === 0 || !options.includes(current)) {
            custom.add(campo.key)
          }
        } else {
          initialValues[campo.key] = ''
          if (options.length === 0) custom.add(campo.key)
        }
        continue
      }

      initialValues[campo.key] = typeof current === 'string' ? current : ''
    }

    setValues(initialValues)
    setCustomSelectFields(custom)
    setError(null)
  }, [product, campos, open, optionsByField])

  const fieldErrors = useMemo(() => {
    const errors: string[] = []

    for (const campo of campos) {
      if (!campo.requerido) continue
      const val = values[campo.key]

      if (campo.tipo === 'booleano') continue
      if (campo.tipo === 'numero') {
        if (val === '' || val === undefined || val === null || Number.isNaN(Number(val))) {
          errors.push(`El campo "${campo.label || formatFieldLabel(campo.key)}" es obligatorio`)
        }
        continue
      }

      if (typeof val !== 'string' || !val.trim()) {
        errors.push(`El campo "${campo.label || formatFieldLabel(campo.key)}" es obligatorio`)
      }
    }

    return errors
  }, [campos, values])

  const handleChange = (key: string, tipo: string, value: string | boolean) => {
    setValues((prev) => ({
      ...prev,
      [key]:
        tipo === 'numero'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (fieldErrors.length > 0) {
      setError(fieldErrors[0])
      return
    }

    const payload: Record<string, any> = { ...values }

    for (const campo of campos) {
      if (campo.tipo !== 'numero') continue
      if (payload[campo.key] !== '' && payload[campo.key] !== undefined) {
        payload[campo.key] = Number(payload[campo.key])
      }
      if (payload[campo.key] === '') delete payload[campo.key]
    }

    setSaving(true)
    try {
      await onSave(payload)
    } catch {
      setError('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {product ? 'Editar ítem' : 'Nuevo ítem'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {campos.map((campo) => {
            const currentValue = values[campo.key]
            const options = optionsByField[campo.key] ?? []
            const isCustom = customSelectFields.has(campo.key)

            return (
              <div key={campo.key} className="space-y-1.5">
                <Label htmlFor={campo.key}>
                  {campo.label || formatFieldLabel(campo.key)}
                  {campo.requerido && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </Label>

                {campo.tipo === 'booleano' ? (
                  <button
                    type="button"
                    aria-pressed={Boolean(currentValue)}
                    onClick={() =>
                      handleChange(campo.key, 'booleano', !Boolean(currentValue))
                    }
                    className={`inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                      currentValue
                        ? 'bg-green-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentValue ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : campo.tipo === 'select' ? (
                  <div className="space-y-1.5">
                    <select
                      id={campo.key}
                      value={isCustom ? CUSTOM_OPTION : currentValue ?? ''}
                      onChange={(e) => {
                        const nextValue = e.target.value
                        if (nextValue === CUSTOM_OPTION) {
                          setCustomSelectFields((prev) => new Set(prev).add(campo.key))
                          setValues((prev) => ({ ...prev, [campo.key]: '' }))
                          return
                        }
                        setCustomSelectFields((prev) => {
                          const next = new Set(prev)
                          next.delete(campo.key)
                          return next
                        })
                        handleChange(campo.key, 'texto', nextValue)
                      }}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="">Selecciona una opción</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value={CUSTOM_OPTION}>Agregar nuevo</option>
                    </select>
                    {(isCustom || options.length === 0) && (
                      <Input
                        value={typeof currentValue === 'string' ? currentValue : ''}
                        onChange={(e) => handleChange(campo.key, 'texto', e.target.value)}
                        placeholder={campo.placeholder || 'Escribe un valor nuevo'}
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Elige una opción existente o agrega una nueva.
                    </p>
                  </div>
                ) : (
                  <Input
                    id={campo.key}
                    type={campo.tipo === 'numero' ? 'number' : 'text'}
                    value={currentValue ?? ''}
                    placeholder={campo.placeholder || formatFieldLabel(campo.key)}
                    onChange={(e) =>
                      handleChange(campo.key, campo.tipo, e.target.value)
                    }
                    step={campo.tipo === 'numero' ? '0.01' : undefined}
                    inputMode={campo.tipo === 'numero' ? 'decimal' : undefined}
                  />
                )}

                {campo.ayuda && (
                  <p className="text-xs text-muted-foreground">{campo.ayuda}</p>
                )}
              </div>
            )
          })}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear ítem'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
