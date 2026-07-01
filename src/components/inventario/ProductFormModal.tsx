import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  campos: BusinessTypeField[]
  product: Record<string, any> | null
  onSave: (values: Record<string, any>) => Promise<void>
}

export default function ProductFormModal({
  open,
  onClose,
  campos,
  product,
  onSave,
}: ProductFormModalProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initial: Record<string, any> = {}
    for (const campo of campos) {
      if (product && product[campo.key] !== undefined) {
        initial[campo.key] = product[campo.key]
      } else {
        initial[campo.key] = campo.tipo === 'booleano' ? false : ''
      }
    }
    setValues(initial)
    setError(null)
  }, [product, campos, open])

  const handleChange = (key: string, tipo: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [key]: tipo === 'numero' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    for (const campo of campos) {
      if (campo.requerido && campo.tipo !== 'booleano') {
        const val = values[campo.key]
        if (val === '' || val === undefined || val === null) {
          setError(`El campo "${formatLabel(campo.key)}" es obligatorio`)
          return
        }
      }
    }

    setSaving(true)
    try {
      await onSave(values)
    } catch {
      setError('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {campos.map((campo) => (
            <div key={campo.key}>
              <Label htmlFor={campo.key}>
                {formatLabel(campo.key)}
                {campo.requerido && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </Label>
              {campo.tipo === 'booleano' ? (
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(campo.key, 'booleano', !values[campo.key])
                    }
                    className={`inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                      values[campo.key]
                        ? 'bg-green-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        values[campo.key] ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <input
                  id={campo.key}
                  type={campo.tipo === 'numero' ? 'number' : 'text'}
                  value={values[campo.key] ?? ''}
                  onChange={(e) =>
                    handleChange(campo.key, campo.tipo, e.target.value)
                  }
                  step={campo.tipo === 'numero' ? '0.01' : undefined}
                  className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Guardando...'
                : product
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
