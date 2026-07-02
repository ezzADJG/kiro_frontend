import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus, Trash2 } from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'
import type {
  BusinessProduct,
  CatalogComboComponent,
  CatalogKind,
} from '@/types'
import {
  CATALOG_KIND_OPTIONS,
  formatFieldLabel,
  slugifyHandle,
} from '@/lib/inventory'

type CatalogItem = BusinessProduct & { id: string; kind: CatalogKind }

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  campos: BusinessTypeField[]
  product: CatalogItem | null
  optionsByField: Record<string, string[]>
  catalogItems: CatalogItem[]
  initialKind?: CatalogKind
  onSave: (values: Record<string, any>) => Promise<void>
}

const DEFAULT_VARIANT_ROWS = 3

function emptyVariantRows() {
  return Array.from({ length: DEFAULT_VARIANT_ROWS }, () => ({
    optionName: '',
    optionValue: '',
  }))
}

function emptyComponents(): CatalogComboComponent[] {
  return [{ itemId: '', quantity: 1 }]
}

export default function ProductFormModal({
  open,
  onClose,
  campos,
  product,
  optionsByField,
  catalogItems,
  initialKind = 'product',
  onSave,
}: ProductFormModalProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [kind, setKind] = useState<CatalogKind>(initialKind)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [variantRows, setVariantRows] = useState(emptyVariantRows())
  const [parentId, setParentId] = useState('')
  const [components, setComponents] = useState<CatalogComboComponent[]>(
    emptyComponents()
  )
  const [serviceMode, setServiceMode] = useState<'onsite' | 'virtual'>('onsite')
  const [bookingMode, setBookingMode] = useState<'manual' | 'automatic'>('manual')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [bufferMinutes, setBufferMinutes] = useState('')

  useEffect(() => {
    const initial: Record<string, any> = {}
    for (const campo of campos) {
      if (product && product[campo.key] !== undefined) {
        initial[campo.key] = product[campo.key]
      } else {
        initial[campo.key] = campo.tipo === 'booleano' ? false : ''
      }
    }
    initial.kind = product?.kind ?? initialKind
    initial.handle = product?.handle ?? ''
    initial.name = product?.name ?? ''
    initial.descriptionShort = product?.descriptionShort ?? ''
    initial.descriptionFull = product?.descriptionFull ?? ''
    initial.price = product?.price ?? ''
    initial.sku = product?.sku ?? ''
    initial.stock = product?.stock ?? ''
    initial.stockMin = product?.stockMin ?? ''
    initial.brand = product?.brand ?? ''
    initial.supplier = product?.supplier ?? ''
    initial.unit = product?.unit ?? ''
    initial.category = product?.category ?? ''
    setValues(initial)
    setKind((product?.kind as CatalogKind | undefined) ?? initialKind)
    setVariantRows(
      product?.variantValues
        ? Object.entries(product.variantValues).map(([optionName, optionValue]) => ({
            optionName,
            optionValue,
          }))
        : emptyVariantRows()
    )
    setParentId(product?.parentId ?? '')
    setComponents(product?.components?.length ? product.components : emptyComponents())
    setServiceMode(product?.serviceMode ?? 'onsite')
    setBookingMode(product?.bookingMode ?? 'manual')
    setDurationMinutes(
      product?.durationMinutes !== undefined ? String(product.durationMinutes) : ''
    )
    setBufferMinutes(
      product?.appointmentBufferMinutes !== undefined
        ? String(product.appointmentBufferMinutes)
        : ''
    )
    setError(null)
  }, [product, campos, open, initialKind])

  const fieldErrors = useMemo(() => {
    const errors: string[] = []
    const required = ['name', 'price']

    for (const key of required) {
      const val = values[key]
      if (val === '' || val === undefined || val === null) {
        errors.push(`El campo "${formatFieldLabel(key)}" es obligatorio`)
      }
    }

    for (const campo of campos) {
      if (!campo.requerido) continue
      const val = values[campo.key]
      const missing =
        val === '' ||
        val === undefined ||
        val === null ||
        (campo.tipo === 'numero' && typeof val !== 'number')
      if (missing) {
        errors.push(`El campo "${campo.label || formatFieldLabel(campo.key)}" es obligatorio`)
      }
    }

    if (kind === 'variant' && !parentId) {
      errors.push('Debes seleccionar el producto padre')
    }

    if (kind === 'combo') {
      const validComponents = components.filter(
        (component) => component.itemId && Number(component.quantity) > 0
      )
      if (validComponents.length === 0) {
        errors.push('El combo debe tener al menos un componente')
      }
    }

    if (kind === 'service' && !durationMinutes) {
      errors.push('La duración del servicio es obligatoria')
    }

    return errors
  }, [campos, values, kind, parentId, components, durationMinutes])

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

  function syncHandle(value: string) {
    setValues((prev) => ({
      ...prev,
      handle: slugifyHandle(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (fieldErrors.length > 0) {
      setError(fieldErrors[0])
      return
    }

    const variantValues = Object.fromEntries(
      variantRows
        .filter((row) => row.optionName.trim() && row.optionValue.trim())
        .map((row) => [row.optionName.trim(), row.optionValue.trim()])
    )

    const cleanedComponents = components
      .filter((component) => component.itemId && Number(component.quantity) > 0)
      .map((component) => ({
        itemId: component.itemId,
        quantity: Number(component.quantity),
        name: catalogItems.find((item) => item.id === component.itemId)?.name,
      }))

    const payload: Record<string, any> = {
      ...values,
      kind,
      handle: values.handle || slugifyHandle(String(values.name || '')),
      price: Number(values.price),
      stock: values.stock === '' || values.stock === undefined ? undefined : Number(values.stock),
      stockMin:
        values.stockMin === '' || values.stockMin === undefined
          ? undefined
          : Number(values.stockMin),
    }

    if (kind === 'variant') {
      payload.parentId = parentId
      payload.variantValues = variantValues
      payload.activeVariant = true
    }

    if (kind === 'combo') {
      payload.components = cleanedComponents
    }

    if (kind === 'service') {
      payload.durationMinutes = Number(durationMinutes)
      payload.serviceMode = serviceMode
      payload.bookingMode = bookingMode
      payload.appointmentBufferMinutes = bufferMinutes
        ? Number(bufferMinutes)
        : undefined
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

  const productParents = catalogItems.filter((item) => item.kind === 'product')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-900">
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label>Tipo de ítem</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATALOG_KIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKind(option.value)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    kind === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-neutral-500">
                    Crear como {option.label.toLowerCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={values.name ?? ''}
                onChange={(e) => {
                  handleChange('name', 'texto', e.target.value)
                  if (!values.handle) syncHandle(e.target.value)
                }}
                placeholder="Ej. Camiseta básica algodón"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={values.handle ?? ''}
                onChange={(e) => handleChange('handle', 'texto', slugifyHandle(e.target.value))}
                placeholder="camiseta-basica-algodon"
              />
              <p className="text-xs text-muted-foreground">
                Identificador amigable para importaciones masivas.
              </p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="descriptionShort">Descripción WhatsApp</Label>
              <Input
                id="descriptionShort"
                value={values.descriptionShort ?? ''}
                onChange={(e) => handleChange('descriptionShort', 'texto', e.target.value)}
                placeholder="Descripción corta para compartir por chat"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="descriptionFull">Descripción completa</Label>
              <textarea
                id="descriptionFull"
                value={values.descriptionFull ?? ''}
                onChange={(e) => handleChange('descriptionFull', 'texto', e.target.value)}
                placeholder="Descripción larga, materiales, uso, recomendaciones..."
                className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                list="category-options"
                value={values.category ?? ''}
                onChange={(e) => handleChange('category', 'texto', e.target.value)}
                placeholder="Camisetas, Café, Bebidas..."
              />
              <datalist id="category-options">
                {(optionsByField.category ?? []).map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                list="brand-options"
                value={values.brand ?? ''}
                onChange={(e) => handleChange('brand', 'texto', e.target.value)}
                placeholder="Marca"
              />
              <datalist id="brand-options">
                {(optionsByField.brand ?? []).map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                list="supplier-options"
                value={values.supplier ?? ''}
                onChange={(e) => handleChange('supplier', 'texto', e.target.value)}
                placeholder="Proveedor"
              />
              <datalist id="supplier-options">
                {(optionsByField.supplier ?? []).map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unidad</Label>
              <Input
                id="unit"
                value={values.unit ?? ''}
                onChange={(e) => handleChange('unit', 'texto', e.target.value)}
                placeholder="Unidad, caja, ml, kg..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={values.sku ?? ''}
                onChange={(e) => handleChange('sku', 'texto', e.target.value)}
                placeholder="SKU interno"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                value={values.price ?? ''}
                onChange={(e) => handleChange('price', 'numero', e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={values.stock ?? ''}
                onChange={(e) => handleChange('stock', 'numero', e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stockMin">Stock mínimo</Label>
              <Input
                id="stockMin"
                type="number"
                value={values.stockMin ?? ''}
                onChange={(e) => handleChange('stockMin', 'numero', e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          {kind === 'variant' && (
            <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="space-y-1.5">
                <Label htmlFor="parentId">Producto padre</Label>
                <select
                  id="parentId"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Selecciona un producto padre</option>
                  {productParents.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name || item.handle || item.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Variantes</Label>
                <div className="space-y-2">
                  {variantRows.map((row, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <Input
                        placeholder={`Opción ${index + 1} nombre`}
                        value={row.optionName}
                        onChange={(e) => {
                          const next = [...variantRows]
                          next[index] = { ...next[index], optionName: e.target.value }
                          setVariantRows(next)
                        }}
                      />
                      <Input
                        placeholder={`Opción ${index + 1} valor`}
                        value={row.optionValue}
                        onChange={(e) => {
                          const next = [...variantRows]
                          next[index] = { ...next[index], optionValue: e.target.value }
                          setVariantRows(next)
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = variantRows.filter((_, current) => current !== index)
                          setVariantRows(next.length > 0 ? next : emptyVariantRows())
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVariantRows((prev) => [...prev, { optionName: '', optionValue: '' }])}
                >
                  <Plus className="h-4 w-4" />
                  Agregar variante
                </Button>
              </div>
            </div>
          )}

          {kind === 'combo' && (
            <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <Label>Componentes del combo</Label>
              <div className="space-y-2">
                {components.map((component, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
                    <select
                      value={component.itemId}
                      onChange={(e) => {
                        const next = [...components]
                        next[index] = { ...next[index], itemId: e.target.value }
                        setComponents(next)
                      }}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="">Selecciona un ítem</option>
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name || item.handle || item.id}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="1"
                      value={component.quantity}
                      onChange={(e) => {
                        const next = [...components]
                        next[index] = {
                          ...next[index],
                          quantity: Number(e.target.value || 1),
                        }
                        setComponents(next)
                      }}
                      placeholder="Cantidad"
                    />
                    <button
                      type="button"
                      onClick={() => setComponents((prev) => prev.filter((_, current) => current !== index))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setComponents((prev) => [...prev, { itemId: '', quantity: 1 }])}
              >
                <Plus className="h-4 w-4" />
                Agregar componente
              </Button>
            </div>
          )}

          {kind === 'service' && (
            <div className="grid gap-4 rounded-xl border border-neutral-200 p-4 md:grid-cols-2 dark:border-neutral-800">
              <div className="space-y-1.5">
                <Label htmlFor="durationMinutes">Duración (min)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appointmentBufferMinutes">Buffer (min)</Label>
                <Input
                  id="appointmentBufferMinutes"
                  type="number"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="serviceMode">Modalidad</Label>
                <select
                  id="serviceMode"
                  value={serviceMode}
                  onChange={(e) => setServiceMode(e.target.value as 'onsite' | 'virtual')}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="onsite">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bookingMode">Reserva</Label>
                <select
                  id="bookingMode"
                  value={bookingMode}
                  onChange={(e) => setBookingMode(e.target.value as 'manual' | 'automatic')}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automática</option>
                </select>
              </div>
            </div>
          )}

          {campos.map((campo) => {
            const currentValue = values[campo.key]
            const options = optionsByField[campo.key] ?? []
            const listId = `options-${campo.key}`

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
                    <Input
                      id={campo.key}
                      list={listId}
                      value={currentValue ?? ''}
                      placeholder={campo.placeholder || 'Selecciona o escribe una opción'}
                      onChange={(e) =>
                        handleChange(campo.key, 'texto', e.target.value)
                      }
                    />
                    <datalist id={listId}>
                      {options.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                    <p className="text-xs text-muted-foreground">
                      Elige una opción existente o escribe una nueva.
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
              {saving
                ? 'Guardando...'
                : product
                  ? 'Guardar cambios'
                  : 'Crear ítem'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
