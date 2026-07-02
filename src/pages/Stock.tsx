import { useEffect, useState, useCallback } from 'react'
import { useBusiness } from '@/context/BusinessContext'
import { obtenerNegocio } from '@/services/businessService'
import {
  subscribeProducts,
  subscribeBusinessType,
  createProduct,
  updateProduct,
} from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Package, Sparkles } from 'lucide-react'
import type { Business, BusinessTypeField } from '@/types/business'
import type { BusinessProduct } from '@/types'
import ProductFormModal from '@/components/inventario/ProductFormModal'
import InventoryAssistantModal from '@/components/inventario/InventoryAssistantModal'
import { buildOptionsByField, formatFieldLabel } from '@/lib/inventory'

type EditableItem = BusinessProduct & { id: string }

export default function Stock() {
  const { tieneNegocio, activeBusinessId, loadingBusiness } = useBusiness()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loadingName, setLoadingName] = useState(false)
  const [businessType, setBusinessType] = useState<any>(null)
  const [products, setProducts] = useState<Record<string, BusinessProduct> | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [editingProduct, setEditingProduct] = useState<EditableItem | null>(null)

  const industry = business?.industry

  useEffect(() => {
    if (activeBusinessId) {
      setLoadingName(true)
      obtenerNegocio(activeBusinessId)
        .then(setBusiness)
        .finally(() => setLoadingName(false))
    } else {
      setBusiness(null)
      setBusinessType(null)
    }
  }, [activeBusinessId])

  useEffect(() => {
    if (!activeBusinessId) return
    setLoadingProducts(true)
    const unsub = subscribeProducts(activeBusinessId, (data) => {
      setProducts(data as Record<string, BusinessProduct> | null)
      setLoadingProducts(false)
    })
    return () => unsub()
  }, [activeBusinessId])

  useEffect(() => {
    if (!industry) return
    const unsub = subscribeBusinessType(industry, (data) => {
      setBusinessType(data)
    })
    return () => unsub()
  }, [industry])

  const campos: BusinessTypeField[] = businessType?.stockSchema?.campos || []
  const optionsByField = buildOptionsByField(campos, products)

  const handleCreate = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleOpenAssistant = () => {
    setShowAssistant(true)
  }

  const handleEdit = (item: EditableItem) => {
    setEditingProduct(item)
    setShowModal(true)
  }

  const handleToggleActivo = (id: string) => {
    if (!activeBusinessId) return
    const product = products?.[id]
    if (!product) return
    updateProduct(activeBusinessId, id, {
      activo: !product.activo,
      updatedAt: Date.now(),
    })
  }

  const handleSave = useCallback(
    async (values: Record<string, any>) => {
      if (!activeBusinessId) return
      if (editingProduct) {
        await updateProduct(activeBusinessId, editingProduct.id, {
          ...values,
          updatedAt: Date.now(),
        })
      } else {
        await createProduct(activeBusinessId, {
          ...values,
          activo: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }
      setShowModal(false)
      setEditingProduct(null)
    },
    [activeBusinessId, editingProduct]
  )

  const handleAssistantSave = useCallback(
    async (values: Record<string, any>) => {
      if (!activeBusinessId) return
      await createProduct(activeBusinessId, {
        ...values,
        activo: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      setShowAssistant(false)
    },
    [activeBusinessId]
  )

  if (loadingBusiness || loadingName) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>Registra tu negocio primero para gestionar tu stock.</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>No se encontró el negocio.</p>
      </div>
    )
  }

  if (!industry || !businessType?.stockSchema) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>El esquema de stock no está configurado para este tipo de negocio.</p>
      </div>
    )
  }

  if (loadingProducts) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Cargando productos...
      </div>
    )
  }

  const productEntries = products ? Object.entries(products) : []
  const items: EditableItem[] = productEntries.map(([id, product]) => ({
    id,
    ...product,
  }))

  const hasItems = items.length > 0
  const numberFormatter = new Intl.NumberFormat('es-PE', {
    maximumFractionDigits: 2,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Stock</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenAssistant}>
            <Sparkles className="h-4 w-4" />
            Asistente
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {!hasItems ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-400">
          <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
            <Package className="h-8 w-8" />
          </div>
          <p className="text-sm">No hay ítems registrados</p>
          <p className="text-xs text-neutral-400">
            Agrega el primero usando el formulario o el asistente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                {campos.map((campo) => (
                  <th
                    key={campo.key}
                    className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400"
                  >
                    {campo.label || formatFieldLabel(campo.key)}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                  Activo
                </th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600 dark:text-neutral-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50 ${
                    !item.activo ? 'opacity-50' : ''
                  }`}
                >
                  {campos.map((campo) => (
                    <td
                      key={campo.key}
                      className="px-4 py-3 text-neutral-900 dark:text-white"
                    >
                      {campo.tipo === 'booleano' ? (
                        <span>{item[campo.key] ? 'Sí' : 'No'}</span>
                      ) : campo.tipo === 'numero' ? (
                        <span>
                          {typeof item[campo.key] === 'number'
                            ? numberFormatter.format(Number(item[campo.key]))
                            : String(item[campo.key] ?? '-')}
                        </span>
                      ) : (
                        <span>{String(item[campo.key] ?? '-')}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActivo(item.id)}
                      className={`inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                        item.activo ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.activo ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && businessType?.stockSchema && (
        <ProductFormModal
          open={showModal}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
          campos={businessType.stockSchema.campos}
          product={editingProduct}
          optionsByField={optionsByField}
          onSave={handleSave}
        />
      )}

      {showAssistant && businessType?.stockSchema && (
        <InventoryAssistantModal
          open={showAssistant}
          onClose={() => setShowAssistant(false)}
          campos={businessType.stockSchema.campos}
          products={products}
          onConfirm={handleAssistantSave}
        />
      )}
    </div>
  )
}
