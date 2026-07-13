import { useState, useEffect, useCallback } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import {
  MapPin, Truck, CheckCircle2, Package, ChevronRight, ListRestart,
  Search, UserCheck, Clock, Store, Hash, ArrowRight,
  Play, PackageCheck, Sparkles, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DeliveryDetailPanel from '@/components/orders/DeliveryDetailPanel'
import AssignDriverModal from '@/components/orders/AssignDriverModal'
import CourierShippingModal from '@/components/orders/CourierShippingModal'
import { useBusiness } from '@/context/BusinessContext'
import { subscribeOrders } from '@/lib/db'
import {
  updateOrderDeliveryStatus,
  updateOrderShipping,
} from '@/services/orderService'
import { saveShippingData } from '@/services/shippingDataService'
import { fetchShippingConfig } from '@/services/shippingConfigService'
import { mapOrderToDeliveryOrder } from '@/utils/orderMappers'
import { migrateOrders } from '@/services/migrationService'
import { exportToShalomExcel, exportToOlvaExcel } from '@/lib/excel'
import {
  DELIVERY_STATUS_LABELS, DELIVERY_STATUS_DOT, DELIVERY_STATUS_TEXT,
  SHIPPING_METHOD_LABELS,
} from '@/types/payments'
import { formatCurrency, formatTime, formatDate } from '@/data/mockData'
import type { DeliveryOrder, ShippingMethod, ShalomOrderPayload, ShalomTracking, OlvaTracking } from '@/types/payments'
import type { Order } from '@/types/order'
import type { ShippingConfig } from '@/services/shippingConfigService'
import type { Transportista } from '@/types/shipping'
import type { Packaging } from '@/types/packaging'

type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'shipping_asc'
type CarrierFilter = 'all' | 'shalom' | 'olva'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Fecha (más reciente)' },
  { value: 'date_asc', label: 'Fecha (más antigua)' },
  { value: 'amount_desc', label: 'Monto (mayor primero)' },
  { value: 'amount_asc', label: 'Monto (menor primero)' },
  { value: 'shipping_asc', label: 'Método de envío (A-Z)' },
]

const CARRIER_FILTERS: { value: CarrierFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'shalom', label: 'Shalom' },
  { value: 'olva', label: 'Olva' },
]

export default function DeliveryDashboard() {
  const { activeBusinessId } = useBusiness()
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [shippingDataMap, setShippingDataMap] = useState<Record<string, any>>({})
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null)
  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [carrierFilter, setCarrierFilter] = useState<CarrierFilter>('all')
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [assignModalOrderId, setAssignModalOrderId] = useState<string | null>(null)
  const [courierModalOrderId, setCourierModalOrderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date_desc')
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    if (!activeBusinessId) return

    const stored = localStorage.getItem('kiro-packagings')
    if (stored) {
      try { setPackagings(JSON.parse(stored)) } catch { /* ignore */ }
    }

    fetchShippingConfig(activeBusinessId).then(setShippingConfig)

    const shippingRef = ref(db, `shippingData/${activeBusinessId}`)
    const unsubShipping = onValue(shippingRef, (snap) => {
      setShippingDataMap(snap.val() || {})
    })

    return () => {
      unsubShipping()
    }
  }, [activeBusinessId])

  useEffect(() => {
    if (!activeBusinessId) return

    migrateOrders(activeBusinessId).then(() => {
      const unsub = subscribeOrders(activeBusinessId, (data) => {
        if (!data) {
          setOrders([])
          return
        }

        const entries = Object.entries(data) as [string, any][]
        const approved = entries.filter(([, o]) => o.status === 'approved')

        const mapped: DeliveryOrder[] = approved.map(([id, raw]) => {
          const order: Order = { id, ...raw }
          const sd = shippingDataMap[id] as Record<string, any> | undefined
          const transportista = (sd?.transportista as Transportista) || null
          return mapOrderToDeliveryOrder(order, undefined, undefined, transportista)
        })

        setOrders(mapped)
      })

      return () => unsub()
    })
  }, [activeBusinessId, shippingDataMap])

  const filteredOrders = orders
    .filter((order) => {
      if (carrierFilter === 'shalom') return order.transportista === 'SHALOM'
      if (carrierFilter === 'olva') return order.transportista === 'OLVA'
      return true
    })
    .filter((order) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.trim().toLowerCase()
      return (
        order.customerDNI.includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.purchaseNumber.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'date_desc': return b.approvedAt - a.approvedAt
        case 'date_asc': return a.approvedAt - b.approvedAt
        case 'amount_desc': return b.totalAmount - a.totalAmount
        case 'amount_asc': return a.totalAmount - b.totalAmount
        case 'shipping_asc': {
          const ma = a.shippingMethod ?? ''
          const mb = b.shippingMethod ?? ''
          return ma.localeCompare(mb)
        }
        default: return 0
      }
    })

  const handleSetShippingMethod = async (orderId: string, method: ShippingMethod) => {
    if (!activeBusinessId) return
    await updateOrderShipping(activeBusinessId, orderId, method)
  }

  const handleAssignDriver = async (orderId: string, driverName: string) => {
    if (!activeBusinessId) return
    await updateOrderShipping(activeBusinessId, orderId, 'motorizado', driverName)
    setAssignModalOrderId(null)
    showToast(`Conductor asignado: ${driverName}`)
  }

  const handleCourierGenerate = async (
    orderId: string,
    payload: ShalomOrderPayload | Record<string, any>,
    tracking: ShalomTracking | OlvaTracking,
  ) => {
    if (!activeBusinessId) return
    const sd = shippingDataMap[orderId] as Record<string, any> | undefined
    const isShalom = sd?.transportista === 'SHALOM'
    await updateOrderShipping(activeBusinessId, orderId, 'courier')
    await saveShippingData(activeBusinessId, orderId, { type: 'courier', tracking }, payload)
    setCourierModalOrderId(null)
    if ('guia' in tracking) {
      showToast(`Guía Shalom generada: ${(tracking as ShalomTracking).guia}`)
    } else {
      showToast(`Guía Olva generada: ${(tracking as OlvaTracking).nroEnvio}`)
    }
  }

  const handleExportExcel = useCallback(async () => {
    if (!activeBusinessId) return
    if (carrierFilter === 'shalom') {
      await exportToShalomExcel(filteredOrders, shippingDataMap, shippingConfig)
    } else if (carrierFilter === 'olva') {
      await exportToOlvaExcel(filteredOrders, shippingDataMap, shippingConfig)
    }
  }, [activeBusinessId, carrierFilter, filteredOrders, shippingDataMap, shippingConfig])

  const handleStatusTransition = async (orderId: string, nextStatus: DeliveryOrder['deliveryStatus']) => {
    if (!activeBusinessId) return
    await updateOrderDeliveryStatus(activeBusinessId, orderId, nextStatus)
    setPanelOpen(false)
    setSelectedOrder(null)
    const labels: Record<string, string> = {
      processing: 'Preparación iniciada',
      ready: 'Pedido listo para entrega',
      in_transit: 'Pedido en camino',
      delivered: 'Pedido entregado',
      confirmed: 'Recepción confirmada',
    }
    showToast(labels[nextStatus] || `Estado actualizado: ${DELIVERY_STATUS_LABELS[nextStatus]}`)
  }

  const openPanel = (order: DeliveryOrder) => {
    setSelectedOrder(order)
    setPanelOpen(true)
  }

  const statusCounts = (status: DeliveryOrder['deliveryStatus']) =>
    orders.filter((o) => o.deliveryStatus === status).length

  const courierOrder = courierModalOrderId ? orders.find((o) => o.id === courierModalOrderId) ?? null : null
  const courierTransportista = courierOrder ? (shippingDataMap[courierOrder.id]?.transportista as Transportista) || null : null

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard de Entregas</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {searchQuery
                ? `${filteredOrders.length} de ${orders.length} pedidos`
                : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} en gestión`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              {statusCounts('received')} recibidos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              {statusCounts('processing')} en proceso
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
              {statusCounts('ready')} listos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
              {statusCounts('in_transit')} en camino
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {statusCounts('delivered')} entregados
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por DNI, nombre o pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-secondary p-0.5 ring-1 ring-foreground/5">
            {CARRIER_FILTERS.map((cf) => (
              <button
                key={cf.value}
                onClick={() => setCarrierFilter(cf.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  carrierFilter === cf.value
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cf.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOpen(!sortOpen)}
              className="gap-1.5"
            >
              <ArrowRight className="h-3 w-3 rotate-90" />
              {SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? 'Ordenar'}
            </Button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl bg-white shadow-xl ring-1 ring-foreground/10">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortKey(opt.value); setSortOpen(false) }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors hover:bg-secondary ${
                        sortKey === opt.value ? 'font-medium text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {sortKey === opt.value && <CheckCircle2 className="h-3 w-3 text-primary" />}
                      <span className={sortKey === opt.value ? '' : 'ml-5'}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {(carrierFilter === 'shalom' || carrierFilter === 'olva') && filteredOrders.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-1.5"
            >
              <Download className="h-3 w-3" />
              Exportar Excel ({carrierFilter === 'shalom' ? 'Shalom' : 'Olva'})
            </Button>
          )}

          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filteredOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-20">
            {searchQuery ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary ring-1 ring-foreground/10">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground">Sin resultados</h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  No se encontraron pedidos que coincidan con "{searchQuery}".
                </p>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Limpiar búsqueda
                </Button>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary ring-1 ring-foreground/10">
                  <ListRestart className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground">No hay entregas activas</h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  Los pedidos con pago aprobado aparecerán aquí para ser preparados y despachados.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                onSetShippingMethod={(method) => {
                  if (method === 'motorizado') setAssignModalOrderId(order.id)
                  else if (method === 'courier') setCourierModalOrderId(order.id)
                  else handleSetShippingMethod(order.id, method)
                }}
                onStatusTransition={(s) => handleStatusTransition(order.id, s)}
                onViewDetails={() => openPanel(order)}
              />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-5 py-3 text-sm text-background shadow-lg ring-1 ring-foreground/10">
          {toast}
        </div>
      )}

      <DeliveryDetailPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedOrder(null) }}
        order={selectedOrder}
        onStatusTransition={(id, s) => handleStatusTransition(id, s)}
        onSetShippingMethod={(id, m) => handleSetShippingMethod(id, m)}
        onOpenShalom={(id) => setCourierModalOrderId(id)}
        onOpenDriverAssignment={(id) => setAssignModalOrderId(id)}
      />

      {courierOrder && courierTransportista && (
        <CourierShippingModal
          open={courierModalOrderId !== null}
          onClose={() => setCourierModalOrderId(null)}
          onGenerate={handleCourierGenerate}
          order={courierOrder}
          transportista={courierTransportista}
          shippingData={shippingDataMap[courierOrder.id]}
          shippingConfig={shippingConfig}
          packagings={packagings}
        />
      )}

      <AssignDriverModal
        open={assignModalOrderId !== null}
        onClose={() => setAssignModalOrderId(null)}
        onAssign={(_, name) => {
          if (assignModalOrderId) handleAssignDriver(assignModalOrderId, name)
        }}
        currentOrderNumber={orders.find((o) => o.id === assignModalOrderId)?.purchaseNumber ?? ''}
      />
    </div>
  )
}

function DeliveryCard({
  order,
  onSetShippingMethod,
  onStatusTransition,
  onViewDetails,
}: {
  order: DeliveryOrder
  onSetShippingMethod: (method: ShippingMethod) => void
  onStatusTransition: (status: DeliveryOrder['deliveryStatus']) => void
  onViewDetails: () => void
}) {
  const [showMethodMenu, setShowMethodMenu] = useState(false)

  const isTerminal = order.deliveryStatus === 'confirmed' || order.deliveryStatus === 'delivered'

  const shippingIcon = (method: ShippingMethod | null) => {
    if (method === 'motorizado') return <Truck className="h-3.5 w-3.5" />
    if (method === 'courier') return <Package className="h-3.5 w-3.5" />
    if (method === 'recojo_en_tienda') return <Store className="h-3.5 w-3.5" />
    return null
  }

  return (
    <div
      className={`rounded-xl bg-white ring-1 ring-foreground/10 transition-all hover:ring-foreground/20 ${
        isTerminal ? 'opacity-60' : ''
      }`}
    >
      {/* Header: Order number + Status */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-foreground tracking-tight">
              {order.purchaseNumber}
            </span>
            {order.shippingMethod === 'courier' && order.shalomTracking && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 ring-1 ring-blue-200">
                <Hash className="h-2.5 w-2.5" />
                {order.shalomTracking.guia}
              </span>
            )}
            {order.shippingMethod === 'courier' && order.olvaTracking && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 ring-1 ring-blue-200">
                <Hash className="h-2.5 w-2.5" />
                {order.olvaTracking.nroEnvio}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-foreground" />
            <span className="text-xs font-semibold text-foreground">
              {formatTime(order.approvedAt)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(order.approvedAt)}
            </span>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${order.deliveryStatus ? DELIVERY_STATUS_TEXT[order.deliveryStatus] : 'text-gray-500'} ${order.deliveryStatus ? DELIVERY_STATUS_DOT[order.deliveryStatus].replace('bg-', 'bg-').replace('500', '100') : 'bg-gray-100'} bg-opacity-20`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${order.deliveryStatus ? DELIVERY_STATUS_DOT[order.deliveryStatus] : 'bg-gray-400'}`} />
          {order.deliveryStatus ? DELIVERY_STATUS_LABELS[order.deliveryStatus] : 'Sin estado'}
        </span>
      </div>

      {/* Body: Address (prominent) */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground leading-snug">
            {order.deliveryAddress}
          </span>
        </div>
      </div>

      {/* Secondary info (low profile) */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
          <span className="font-medium text-muted-foreground/90">{order.customerName}</span>
          <span>·</span>
          <span>DNI: {order.customerDNI}</span>
          <span>·</span>
          <span>{order.customerPhone}</span>
        </div>
      </div>

      {/* Meta row: products + total + payment */}
      <div className="border-t border-border/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
            <Package className="h-3 w-3" />
            <span>{order.products.length} producto{order.products.length !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-xs font-semibold text-foreground">
            {formatCurrency(order.totalAmount, order.currency)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
          <span className="text-emerald-600 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Pago Aprobado
          </span>
          <span className="text-border/50">·</span>
          <span className="text-muted-foreground/70 inline-flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            {order.approvedBy}
          </span>
        </div>
      </div>

      {/* Shipping method display */}
      {order.shippingMethod && (
        <div className="border-t border-border/50 px-4 py-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/5">
            {shippingIcon(order.shippingMethod)}
            {order.shippingMethod === 'courier'
              ? `Courier (${order.transportista || '—'})`
              : SHIPPING_METHOD_LABELS[order.shippingMethod]}
            {order.shippingMethod === 'motorizado' && order.assignedDriver && (
              <span className="text-muted-foreground/70">· {order.assignedDriver}</span>
            )}
            {order.shippingMethod === 'recojo_en_tienda' && (
              <span className="text-muted-foreground/70">· Cliente recoge</span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Actions */}
      <div className="flex items-center gap-1.5 border-t border-border p-3">
        {/* received → processing */}
        {order.deliveryStatus === 'received' && (
          <Button
            size="xs"
            className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onStatusTransition('processing')}
          >
            <Play className="h-3 w-3" />
            Iniciar preparación
          </Button>
        )}

        {/* processing → ready */}
        {order.deliveryStatus === 'processing' && (
          <Button
            size="xs"
            className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onStatusTransition('ready')}
          >
            <PackageCheck className="h-3 w-3" />
            Preparación lista
          </Button>
        )}

        {/* ready → choose shipping method → in_transit */}
        {order.deliveryStatus === 'ready' && (
          <>
            <div className="relative flex-1">
              <Button
                size="xs"
                variant="outline"
                className="w-full gap-1"
                onClick={() => setShowMethodMenu(!showMethodMenu)}
              >
                <Truck className="h-3 w-3" />
                {order.shippingMethod ? SHIPPING_METHOD_LABELS[order.shippingMethod] : 'Método de envío'}
              </Button>
              {showMethodMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMethodMenu(false)} />
                  <div className="absolute bottom-full left-0 z-20 mb-1 w-full min-w-40 rounded-xl bg-white shadow-xl ring-1 ring-foreground/10">
                    {(['motorizado', 'courier', 'recojo_en_tienda'] as ShippingMethod[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => { onSetShippingMethod(m); setShowMethodMenu(false) }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-foreground transition-colors hover:bg-secondary first:rounded-t-xl last:rounded-b-xl"
                      >
                        {shippingIcon(m)}
                        {SHIPPING_METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Button
              size="xs"
              className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={!order.shippingMethod}
              onClick={() => onStatusTransition('in_transit')}
            >
              <ArrowRight className="h-3 w-3" />
              En Camino
            </Button>
          </>
        )}

        {/* in_transit → delivered */}
        {order.deliveryStatus === 'in_transit' && (
          <Button
            size="xs"
            className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onStatusTransition('delivered')}
          >
            <CheckCircle2 className="h-3 w-3" />
            Entregado
          </Button>
        )}

        {/* delivered → confirmed */}
        {order.deliveryStatus === 'delivered' && (
          <Button
            size="xs"
            className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onStatusTransition('confirmed')}
          >
            <Sparkles className="h-3 w-3" />
            Confirmar recepción
          </Button>
        )}

        {/* confirmed: terminal state */}
        {order.deliveryStatus === 'confirmed' && (
          <div className="flex flex-1 items-center justify-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-medium">Completado</span>
          </div>
        )}

        <Button size="xs" variant="ghost" className="gap-1" onClick={onViewDetails}>
          <ChevronRight className="h-3 w-3" />
          Detalles
        </Button>
      </div>
    </div>
  )
}
