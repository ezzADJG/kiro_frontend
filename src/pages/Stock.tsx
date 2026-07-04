import { useEffect, useState, useCallback, useMemo } from 'react'
import { useBusiness } from '@/context/BusinessContext'
import { obtenerNegocio } from '@/services/businessService'
import {
  subscribeProducts,
  subscribeServices,
  subscribeBusinessType,
  createProduct,
  updateProduct,
  createService,
  updateService,
} from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Upload,
  Search,
  ArrowUpDown,
  Play,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Business, BusinessTypeField, BusinessModule } from '@/types/business'
import type { BusinessProduct } from '@/types'
import { hasField, buildOptionsByField } from '@/lib/inventory'
import ProductFormModal from '@/components/inventario/ProductFormModal'
import ImportModal from '@/components/inventario/ImportModal'
import BulkEditModal from '@/components/inventario/BulkEditModal'
import AvailabilityBadge from '@/components/inventario/AvailabilityBadge'

type EditableItem = Record<string, any> & { id: string }

type SortOption = 'recent' | 'oldest'

const MODULE_LABELS: Record<BusinessModule, { label: string; labelPlural: string }> = {
  stock: { label: 'Producto', labelPlural: 'Productos' },
  services: { label: 'Servicio', labelPlural: 'Servicios' },
}

function formatDate(ts: number): string {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

function formatCurrency(value: unknown): string {
  if (typeof value !== 'number') return '-'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

export default function Stock() {
  const { tieneNegocio, activeBusinessId, loadingBusiness } = useBusiness()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loadingName, setLoadingName] = useState(false)
  const [businessType, setBusinessType] = useState<any>(null)
  const [products, setProducts] = useState<Record<string, BusinessProduct> | null>(null)
  const [services, setServices] = useState<Record<string, any> | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<BusinessModule>('stock')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<EditableItem | null>(null)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  const industry = business?.industry

  useEffect(() => {
    if (activeBusinessId) {
      setLoadingName(true)
      obtenerNegocio(activeBusinessId).then(setBusiness).finally(() => setLoadingName(false))
    } else {
      setBusiness(null); setBusinessType(null)
    }
  }, [activeBusinessId])

  useEffect(() => {
    if (!industry) return
    const unsub = subscribeBusinessType(industry, (data) => setBusinessType(data))
    return () => unsub()
  }, [industry])

  const modules: BusinessModule[] = businessType?.modules ?? ['stock']
  const hasStock = modules.includes('stock')
  const hasServices = modules.includes('services')
  const showTabs = hasStock && hasServices

  useEffect(() => {
    if (!activeBusinessId || !hasStock) { if (!hasStock) setProducts(null); return }
    setLoadingData(true)
    const unsub = subscribeProducts(activeBusinessId, (data) => { setProducts(data as Record<string, BusinessProduct> | null); setLoadingData(false) })
    return () => unsub()
  }, [activeBusinessId, hasStock])

  useEffect(() => {
    if (!activeBusinessId || !hasServices) { if (!hasServices) setServices(null); return }
    setLoadingData(true)
    const unsub = subscribeServices(activeBusinessId, (data) => { setServices(data as Record<string, any> | null); setLoadingData(false) })
    return () => unsub()
  }, [activeBusinessId, hasServices])

  useEffect(() => {
    if (!modules.includes(activeTab)) setActiveTab(modules[0] || 'stock')
  }, [modules, activeTab])

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, sortBy])

  const currentSchema = activeTab === 'stock' ? businessType?.stockSchema : businessType?.serviceSchema
  const campos: BusinessTypeField[] = currentSchema?.campos || []
  const activeData = activeTab === 'stock' ? products : services
  const moduleInfo = MODULE_LABELS[activeTab]

  const booleanKey = campos.find((c) => c.tipo === 'booleano')?.key
  const showCategoryCol = hasField(campos, 'categoria')
  const showAvailabilityCol = booleanKey !== undefined
  const showPriceCol = hasField(campos, 'precio') || hasField(campos, 'precio_venta')
  const showStockCol = hasField(campos, 'stock') || hasField(campos, 'stock_actual')
  const hasStockMinimo = hasField(campos, 'stock_minimo')
  const optionsByField = useMemo(() => buildOptionsByField(campos, activeData), [campos, activeData])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const items: EditableItem[] = useMemo(() => {
    if (!activeData) return []
    const entries = Object.entries(activeData).map(([id, item]) => ({ id, ...item }))

    let filtered = entries
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = entries.filter((item) => String(item['nombre'] ?? '').toLowerCase().includes(q))
    }

    filtered.sort((a, b) => {
      const aTime = a['createdAt'] ?? 0
      const bTime = b['createdAt'] ?? 0
      return sortBy === 'recent' ? bTime - aTime : aTime - bTime
    })

    return filtered
  }, [activeData, searchQuery, sortBy])

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))
  const pageItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const hasSelection = selectedIds.size > 0

  const handleCreate = () => { setEditingItem(null); setShowModal(true) }
  const handleEdit = (item: EditableItem) => { setEditingItem(item); setShowModal(true) }

  const handleToggleField = (id: string, fieldKey: string, currentValue: unknown) => {
    if (!activeBusinessId) return
    const updateData = { [fieldKey]: !currentValue, updatedAt: Date.now() }
    if (activeTab === 'stock') {
      setProducts((prev) => (prev?.[id] ? { ...prev, [id]: { ...prev[id], [fieldKey]: !currentValue } } : prev))
      updateProduct(activeBusinessId, id, updateData).catch(() => showToast('Error al actualizar', 'error'))
    } else {
      setServices((prev) => (prev?.[id] ? { ...prev, [id]: { ...prev[id], [fieldKey]: !currentValue } } : prev))
      updateService(activeBusinessId, id, updateData).catch(() => showToast('Error al actualizar', 'error'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!activeBusinessId) return
    const updateData = { activo: false, updatedAt: Date.now() }
    try {
      if (activeTab === 'stock') await updateProduct(activeBusinessId, id, updateData)
      else await updateService(activeBusinessId, id, updateData)
      setDeleteTarget(null)
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s })
      showToast('Producto desactivado')
    } catch { showToast('Error al eliminar', 'error') }
  }

  const handleClearAll = async () => {
    if (!activeBusinessId || !activeData) return
    const ids = Object.keys(activeData)
    const updates = ids.map((id) => {
      const d = { activo: false, updatedAt: Date.now() }
      return activeTab === 'stock' ? updateProduct(activeBusinessId, id, d) : updateService(activeBusinessId, id, d)
    })
    try {
      await Promise.all(updates)
      setShowClearAllConfirm(false)
      setSelectedIds(new Set())
      showToast(`${ids.length} ${moduleInfo.labelPlural.toLowerCase()} desactivados`)
    } catch { showToast('Error al vaciar catálogo', 'error') }
  }

  const handleSave = useCallback(async (values: Record<string, any>) => {
    if (!activeBusinessId) return
    if (editingItem) {
      const d = { ...values, updatedAt: Date.now() }
      if (activeTab === 'stock') await updateProduct(activeBusinessId, editingItem.id, d)
      else await updateService(activeBusinessId, editingItem.id, d)
    } else {
      const d = { ...values, activo: true, createdAt: Date.now(), updatedAt: Date.now() }
      if (activeTab === 'stock') await createProduct(activeBusinessId, d)
      else await createService(activeBusinessId, d)
    }
    setShowModal(false); setEditingItem(null)
    showToast(editingItem ? `${moduleInfo.label} actualizado` : `${moduleInfo.label} creado`)
  }, [activeBusinessId, editingItem, activeTab, moduleInfo.label])

  const handleImport = useCallback(async (newItems: Record<string, any>[]) => {
    if (!activeBusinessId) return
    const creates = activeTab === 'stock'
      ? newItems.map((item) => createProduct(activeBusinessId, item))
      : newItems.map((item) => createService(activeBusinessId, item))
    await Promise.all(creates)
    showToast(`${newItems.length} ${moduleInfo.labelPlural.toLowerCase()} importados`)
  }, [activeBusinessId, activeTab, moduleInfo])

  const handleBulkEdit = useCallback(
    async (_newItems: Record<string, any>[], modifiedItems: { id: string; values: Record<string, any> }[]) => {
      if (!activeBusinessId) return
      const updates = activeTab === 'stock'
        ? modifiedItems.map((item) => updateProduct(activeBusinessId, item.id, item.values))
        : modifiedItems.map((item) => updateService(activeBusinessId, item.id, item.values))
      await Promise.all(updates)
      showToast(`${modifiedItems.length} ${moduleInfo.labelPlural.toLowerCase()} actualizados`)
    },
    [activeBusinessId, activeTab, moduleInfo]
  )

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === pageItems.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(pageItems.map((i) => i.id)))
  }

  // Guard clauses
  if (loadingBusiness || loadingName) {
    return <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] text-sm text-muted-foreground pt-20">Cargando...</div>
  }
  if (!tieneNegocio) {
    return <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] p-6 text-center text-muted-foreground pt-20"><p>Registra tu negocio primero para gestionar tu stock.</p></div>
  }
  if (!business) {
    return <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] p-6 text-center text-muted-foreground pt-20"><p>No se encontró el negocio.</p></div>
  }
  if (!industry || !currentSchema) {
    return <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] p-6 text-center text-muted-foreground pt-20"><p>El esquema de {activeTab === 'stock' ? 'stock' : 'servicios'} no está configurado.</p></div>
  }
  if (loadingData) {
    return <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] text-sm text-muted-foreground pt-20">Cargando {moduleInfo.labelPlural.toLowerCase()}...</div>
  }

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]">
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
          <div className={`rounded-lg border px-5 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-10 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            <span className="font-medium text-neutral-900 dark:text-white">Productos</span>
            {showTabs && (
              <span className="ml-2 inline-flex gap-1 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  onClick={() => setActiveTab('stock')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    activeTab === 'stock' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >Productos</button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    activeTab === 'services' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >Servicios</button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-neutral-300 bg-black text-white hover:bg-neutral-800 hover:text-white" onClick={() => setShowImportModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar plantilla
            </Button>
            <Button onClick={handleCreate} className="bg-black text-white hover:bg-neutral-800">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo producto
            </Button>
          </div>
        </div>
      </div>

      {/* Title + mass edit */}
      <div className="shrink-0 px-10 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{moduleInfo.labelPlural} registrados</h1>
          </div>
          <Button
            variant="outline"
            
            className={`border-neutral-300 text-sm`}
            onClick={() => setShowBulkEditModal(true)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Edición masiva
          </Button>
        </div>
        <p className="mt-1 text-sm text-neutral-400">Visualiza, edita y gestiona todos los productos de tu tienda.</p>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 px-10 pb-3">
        <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-neutral-900">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 h-4 w-4 text-neutral-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar producto"
              className="border-0 pl-9 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded-lg border border-neutral-200 bg-white px-8 py-1.5 pr-8 text-sm text-neutral-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Table area - flex-1 to fill remaining space */}
      <div className="flex min-h-0 flex-1 flex-col px-10 pb-4">
        {items.length === 0 && !searchQuery ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-neutral-400">
            <div className="rounded-full bg-neutral-200 p-6 dark:bg-neutral-800">
              <Package className="h-12 w-12 text-neutral-400" />
            </div>
            <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300">No tienes {moduleInfo.labelPlural.toLowerCase()} registrados</p>
            <p className="max-w-xs text-center text-sm text-neutral-400">Agrega tu primer producto o importa una plantilla desde Excel.</p>
            <Button onClick={handleCreate} className="mt-2 bg-black text-white hover:bg-neutral-800">
              <Plus className="mr-2 h-4 w-4" /> Nuevo producto
            </Button>
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sticky top-0 border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                      <th className="w-10 px-3 py-3"><input type="checkbox" checked={pageItems.length > 0 && selectedIds.size === pageItems.length} onChange={handleSelectAll} className="h-4 w-4 rounded border-neutral-300" /></th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Producto</th>
                      {showCategoryCol && <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Categorías</th>}
                      {showAvailabilityCol && <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Disponibilidad</th>}
                      {showPriceCol && <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Precio</th>}
                      {showStockCol && <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Stock</th>}
                      <th className="w-20 px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item) => {
                      const priceValue = item['precio'] ?? item['precio_venta']
                      const stockValue = item['stock'] ?? item['stock_actual']
                      const stockMinimoVal = hasStockMinimo ? item['stock_minimo'] : undefined
                      const booleanoActual = booleanKey ? item[booleanKey] : (item['activo'] !== false)
                      const catValue = item['categoria']

                      return (
                        <tr key={item.id} className={`border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50 ${booleanoActual !== false ? '' : 'opacity-40'}`}>
                          <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} className="h-4 w-4 rounded border-neutral-300" /></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[10px] text-neutral-400 dark:bg-neutral-800">40×40</div>
                              <div>
                                <p className="font-medium text-neutral-900 dark:text-white">{String(item['nombre'] ?? '-')}</p>
                                <p className="text-xs text-neutral-400">Creado el {formatDate(item['createdAt'])}</p>
                              </div>
                            </div>
                          </td>
                          {showCategoryCol && (
                            <td className="px-3 py-3">
                              {catValue ? (
                                <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{String(catValue)}</span>
                              ) : <span className="text-xs text-neutral-300">—</span>}
                            </td>
                          )}
                          {showAvailabilityCol && booleanKey && (
                            <td className="px-3 py-3">
                              <AvailabilityBadge
                                disponible={item[booleanKey] !== false}
                                stock={typeof stockValue === 'number' ? stockValue : undefined}
                                stockMinimo={typeof stockMinimoVal === 'number' ? stockMinimoVal : undefined}
                                onChange={(val) => handleToggleField(item.id, booleanKey, item[booleanKey])}
                              />
                            </td>
                          )}
                          {showPriceCol && <td className="px-3 py-3 font-medium text-neutral-900 dark:text-white">{formatCurrency(priceValue)}</td>}
                          {showStockCol && <td className="px-3 py-3 text-neutral-900 dark:text-white">{typeof stockValue === 'number' ? String(stockValue) : '-'}</td>}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setDeleteTarget(item)} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {pageItems.length === 0 && searchQuery && (
                      <tr><td colSpan={100} className="px-4 py-12 text-center text-sm text-neutral-400">No se encontraron resultados para "{searchQuery}"</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with pagination + vaciar catálogo */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500">
              <span>{items.length} {moduleInfo.labelPlural.toLowerCase()}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs">Filas por página</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                    className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) pageNum = i + 1
                    else if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${pageNum === currentPage ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                      >{pageNum}</button>
                    )
                  })}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Vaciar catálogo */}
            {items.length > 1 && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="text-xs text-neutral-400 underline underline-offset-2 hover:text-red-500"
                >
                  Vaciar catálogo completo ({items.length} {moduleInfo.labelPlural.toLowerCase()})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div>
                <h3 className="text-sm font-medium">¿Eliminar {String(deleteTarget['nombre'] ?? '')}?</h3>
                <p className="text-xs text-neutral-500">Esta acción desactivará el producto.</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => handleDelete(deleteTarget.id)}>Eliminar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all confirmation */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div>
                <h3 className="text-sm font-medium">¿Desactivar todos los {moduleInfo.labelPlural.toLowerCase()}?</h3>
                <p className="text-xs text-neutral-500">Esta acción desactivará los {items.length} {moduleInfo.labelPlural.toLowerCase()} registrados.</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowClearAllConfirm(false)}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleClearAll}>Sí, desactivar todos</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && currentSchema && (
        <ProductFormModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditingItem(null) }}
          campos={currentSchema.campos}
          product={editingItem}
          optionsByField={optionsByField}
          onSave={handleSave}
          dataType={activeTab}
        />
      )}

      {showImportModal && (
        <ImportModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          campos={campos}
          dataType={activeTab}
          businessId={activeBusinessId!}
          businessName={business.businessName}
          industry={industry}
          onImport={handleImport}
        />
      )}

      {showBulkEditModal && (
        <BulkEditModal
          open={showBulkEditModal}
          onClose={() => setShowBulkEditModal(false)}
          campos={campos}
          existingItems={activeData}
          dataType={activeTab}
          businessId={activeBusinessId!}
          businessName={business.businessName}
          onImport={handleBulkEdit}
        />
      )}
    </div>
  )
}
