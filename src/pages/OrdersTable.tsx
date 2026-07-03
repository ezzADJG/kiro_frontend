import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search, ChevronDown, CheckCircle2, X, Truck, ListRestart, ArrowRight,
  Play, PackageCheck, Sparkles, Clock, MapPin, Hash, Store, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PaymentDetailPanel from '@/components/orders/PaymentDetailPanel'
import DeliveryDetailPanel from '@/components/orders/DeliveryDetailPanel'
import AssignDriverModal from '@/components/orders/AssignDriverModal'
import ShalomShippingModal from '@/components/orders/ShalomShippingModal'
import { mockPaymentOrders, mockDeliveryOrders, formatCurrency, formatTime, paymentToDeliveryOrder } from '@/data/mockData'
import {
  PAYMENT_METHOD_LABELS,
  UNIFIED_STATUS_LABELS,
  UNIFIED_STATUS_DOT,
  UNIFIED_STATUS_TEXT,
  SHIPPING_METHOD_LABELS,
} from '@/types/payments'
import type { PaymentOrder, DeliveryOrder, UnifiedOrderStatus, ShippingMethod, ShalomOrderPayload, ShalomTracking } from '@/types/payments'

interface UnifiedRow {
  id: string
  type: 'payment' | 'delivery'
  purchaseNumber: string
  customerName: string
  customerDNI: string
  totalAmount: number
  currency: string
  paymentMethod: string
  deliveryAddress: string
  displayTime: number
  status: UnifiedOrderStatus
  shippingMethod: ShippingMethod | null
  shalomTracking: ShalomTracking | null
}

const ALL_STATUSES: UnifiedOrderStatus[] = [
  'pending_verification',
  'rejected',
  'received',
  'processing',
  'ready',
  'in_transit',
  'delivered',
  'confirmed',
]

type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'shipping_asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Fecha (más reciente)' },
  { value: 'date_asc', label: 'Fecha (más antigua)' },
  { value: 'amount_desc', label: 'Monto (mayor primero)' },
  { value: 'amount_asc', label: 'Monto (menor primero)' },
  { value: 'shipping_asc', label: 'Método de envío (A-Z)' },
]

export default function OrdersTable() {
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>(mockPaymentOrders)
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null)
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false)
  const [deliveryPanelOpen, setDeliveryPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<UnifiedOrderStatus[]>([])
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [assignModalOrderId, setAssignModalOrderId] = useState<string | null>(null)
  const [shalomModalOrderId, setShalomModalOrderId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('date_desc')
  const [sortOpen, setSortOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const unifiedRows: UnifiedRow[] = useMemo(() => {
    const payments: UnifiedRow[] = paymentOrders.map((o) => ({
      id: o.id,
      type: 'payment' as const,
      purchaseNumber: o.purchaseNumber,
      customerName: o.customerName,
      customerDNI: o.customerDNI,
      totalAmount: o.totalAmount,
      currency: o.currency,
      paymentMethod: PAYMENT_METHOD_LABELS[o.paymentMethod],
      deliveryAddress: o.deliveryAddress,
      displayTime: o.createdAt,
      status: o.status === 'rejected' ? 'rejected' : 'pending_verification',
      shippingMethod: null,
      shalomTracking: null,
    }))
    const deliveries: UnifiedRow[] = deliveryOrders.map((o) => ({
      id: o.id,
      type: 'delivery' as const,
      purchaseNumber: o.purchaseNumber,
      customerName: o.customerName,
      customerDNI: o.customerDNI,
      totalAmount: o.totalAmount,
      currency: o.currency,
      paymentMethod: PAYMENT_METHOD_LABELS[o.paymentMethod],
      deliveryAddress: o.deliveryAddress,
      displayTime: o.approvedAt,
      status: o.deliveryStatus,
      shippingMethod: o.shippingMethod,
      shalomTracking: o.shalomTracking,
    }))
    const all = [...payments, ...deliveries]
    all.sort((a, b) => {
      switch (sortKey) {
        case 'date_desc': return b.displayTime - a.displayTime
        case 'date_asc': return a.displayTime - b.displayTime
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
    return all
  }, [paymentOrders, deliveryOrders, sortKey])

  const filteredRows = useMemo(() => {
    let rows = unifiedRows
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      rows = rows.filter(
        (r) => r.customerDNI.includes(q) || r.customerName.toLowerCase().includes(q) || r.purchaseNumber.toLowerCase().includes(q),
      )
    }
    if (statusFilter.length > 0) {
      rows = rows.filter((r) => statusFilter.includes(r.status))
    }
    return rows
  }, [unifiedRows, searchQuery, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of unifiedRows) {
      counts[row.status] = (counts[row.status] || 0) + 1
    }
    return counts
  }, [unifiedRows])

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter.length > 0

  const toggleStatusFilter = (s: UnifiedOrderStatus) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter([])
  }

  const selectedPayment = selectedPaymentId
    ? paymentOrders.find((o) => o.id === selectedPaymentId) ?? null
    : null
  const selectedDelivery = selectedDeliveryId
    ? deliveryOrders.find((o) => o.id === selectedDeliveryId) ?? null
    : null

  const openPaymentPanel = (id: string) => {
    setSelectedPaymentId(id)
    setPaymentPanelOpen(true)
  }

  const openDeliveryPanel = (id: string) => {
    setSelectedDeliveryId(id)
    setDeliveryPanelOpen(true)
  }

  const handleRowClick = (row: UnifiedRow) => {
    if (row.type === 'payment') {
      openPaymentPanel(row.id)
    } else {
      openDeliveryPanel(row.id)
    }
  }

  const handleApprove = (orderId: string) => {
    const order = paymentOrders.find((o) => o.id === orderId)
    if (!order) return
    const newDelivery = paymentToDeliveryOrder(order, 'Ana Martínez López')
    setPaymentOrders((prev) => prev.filter((o) => o.id !== orderId))
    setDeliveryOrders((prev) => [...prev, newDelivery])
    setPaymentPanelOpen(false)
    setSelectedPaymentId(null)
    showToast('Pago aprobado — Pedido listo para entrega')
  }

  const handleReject = (orderId: string) => {
    setPaymentOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'rejected' } : o)))
    setPaymentPanelOpen(false)
    setSelectedPaymentId(null)
    showToast('Pago rechazado')
  }

  const handleReassign = (_orderId: string, employeeName: string) => {
    setPaymentPanelOpen(false)
    setSelectedPaymentId(null)
    showToast(`Verificación reasignada a ${employeeName}`)
  }

  const handleAssignDriver = (orderId: string, driverName: string) => {
    setDeliveryOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, assignedDriver: driverName, shippingMethod: 'motorizado' as const }
          : o,
      ),
    )
    setAssignModalOrderId(null)
    showToast(`Conductor asignado: ${driverName}`)
  }

  const handleSetShippingMethod = (orderId: string, method: ShippingMethod) => {
    setDeliveryOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, shippingMethod: method } : o)))
    showToast(`Método de envío: ${SHIPPING_METHOD_LABELS[method]}`)
  }

  const handleShalomGenerate = (orderId: string, payload: ShalomOrderPayload, tracking: ShalomTracking) => {
    setDeliveryOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, shippingMethod: 'courier' as const, shalomData: payload, shalomTracking: tracking }
          : o,
      ),
    )
    setShalomModalOrderId(null)
    showToast(`Guía Shalom generada: ${tracking.guia}`)
  }

  const handleStatusTransition = (orderId: string, nextStatus: DeliveryOrder['deliveryStatus']) => {
    setDeliveryOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deliveryStatus: nextStatus } : o)),
    )
    setDeliveryPanelOpen(false)
    setSelectedDeliveryId(null)
    const labels: Record<string, string> = {
      processing: 'Preparación iniciada',
      ready: 'Pedido listo',
      in_transit: 'En camino',
      delivered: 'Entregado',
      confirmed: 'Recepción confirmada',
    }
    showToast(labels[nextStatus] || `Estado actualizado`)
  }

  const shalomOrder = shalomModalOrderId
    ? deliveryOrders.find((o) => o.id === shalomModalOrderId) ?? null
    : null

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Órdenes</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Gestiona todos los pedidos en un solo lugar
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {unifiedRows.length} pedido{unifiedRows.length !== 1 ? 's' : ''}
          </span>
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

          <div ref={dropdownRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="gap-1.5"
            >
              Estado
              <ChevronDown className="h-3 w-3" />
            </Button>
            {statusDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl bg-white shadow-xl ring-1 ring-foreground/10">
                <div className="p-2">
                  {ALL_STATUSES.map((s) => (
                    <label
                      key={s}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(s)}
                        onChange={() => toggleStatusFilter(s)}
                        className="h-4 w-4 rounded border-border accent-neutral-900"
                      />
                      <span>{UNIFIED_STATUS_LABELS[s]}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {statusCounts[s] ?? 0}
                      </span>
                    </label>
                  ))}
                </div>
                {statusFilter.length > 0 && (
                  <div className="border-t border-border p-2">
                    <button
                      onClick={() => setStatusFilter([])}
                      className="w-full rounded-lg px-3 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}
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

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar
            </Button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          {ALL_STATUSES.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${UNIFIED_STATUS_DOT[s]}`}
              />
              {(statusCounts[s] ?? 0)} {UNIFIED_STATUS_LABELS[s].toLowerCase()}
              {(statusCounts[s] ?? 0) !== 1 ? 's' : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredRows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-20">
            {hasActiveFilters ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary ring-1 ring-foreground/10">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground">Sin resultados</h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  No se encontraron pedidos que coincidan con los filtros aplicados.
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary ring-1 ring-foreground/10">
                  <ListRestart className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground">No hay pedidos</h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  Los pedidos aparecerán aquí una vez que los clientes realicen compras.
                </p>
              </>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-border">
                <Th># Pedido</Th>
                <Th>Cliente</Th>
                <Th>Total</Th>
                <Th>Método</Th>
                <Th>Dirección</Th>
                <Th>Hora</Th>
                <Th>Envío</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                  onClick={() => handleRowClick(row)}
                >
                  {/* # Pedido — resaltado */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-sm font-bold text-foreground tracking-tight">
                      {row.purchaseNumber}
                    </span>
                    {row.shippingMethod === 'courier' && row.shalomTracking && (
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-blue-600">
                        <Hash className="h-2.5 w-2.5" />
                        <span className="font-mono">{row.shalomTracking.guia}</span>
                      </div>
                    )}
                  </td>

                  {/* Cliente — perfil bajo */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="text-[11px] font-medium text-muted-foreground">{row.customerName}</p>
                    <p className="text-[10px] text-muted-foreground/60">DNI: {row.customerDNI}</p>
                  </td>

                  {/* Total */}
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-foreground">
                    {formatCurrency(row.totalAmount, row.currency)}
                  </td>

                  {/* Método de pago — perfil bajo */}
                  <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground/70">
                    {row.paymentMethod}
                  </td>

                  {/* Dirección — resaltada */}
                  <td className="max-w-[160px] px-4 py-3">
                    <div className="flex items-start gap-1">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground line-clamp-1" title={row.deliveryAddress}>
                        {row.deliveryAddress}
                      </span>
                    </div>
                  </td>

                  {/* Hora — resaltada */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-foreground" />
                      <span className="text-xs font-semibold text-foreground">
                        {formatTime(row.displayTime)}
                      </span>
                    </div>
                  </td>

                  {/* Método de envío */}
                  <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground">
                    {row.shippingMethod ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 font-medium text-foreground/80">
                        {row.shippingMethod === 'motorizado' && <Truck className="h-2.5 w-2.5" />}
                        {row.shippingMethod === 'courier' && <Package className="h-2.5 w-2.5" />}
                        {row.shippingMethod === 'recojo_en_tienda' && <Store className="h-2.5 w-2.5" />}
                        {SHIPPING_METHOD_LABELS[row.shippingMethod]}
                      </span>
                    ) : row.type === 'delivery' ? (
                      <span className="text-muted-foreground/50">—</span>
                    ) : null}
                  </td>

                  {/* Estado */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${UNIFIED_STATUS_TEXT[row.status]}`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${UNIFIED_STATUS_DOT[row.status]}`}
                      />
                      {UNIFIED_STATUS_LABELS[row.status]}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.status === 'pending_verification' && (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            className="gap-1 text-emerald-600"
                            onClick={() => handleApprove(row.id)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Aprobar
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="gap-1 text-destructive"
                            onClick={() => handleReject(row.id)}
                          >
                            <X className="h-3 w-3" />
                            Rechazar
                          </Button>
                        </>
                      )}

                      {row.status === 'received' && (
                        <Button
                          size="xs"
                          className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleStatusTransition(row.id, 'processing')}
                        >
                          <Play className="h-3 w-3" />
                          Preparar
                        </Button>
                      )}

                      {row.status === 'processing' && (
                        <Button
                          size="xs"
                          className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleStatusTransition(row.id, 'ready')}
                        >
                          <PackageCheck className="h-3 w-3" />
                          Listo
                        </Button>
                      )}

                      {row.status === 'ready' && (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            className="gap-1"
                            onClick={() => setAssignModalOrderId(row.id)}
                          >
                            <Truck className="h-3 w-3" />
                            Motorizado
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="gap-1"
                            onClick={() => setShalomModalOrderId(row.id)}
                          >
                            <Package className="h-3 w-3" />
                            Courier
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="gap-1 text-[11px]"
                            onClick={() => handleSetShippingMethod(row.id, 'recojo_en_tienda')}
                          >
                            <Store className="h-3 w-3" />
                            Recojo
                          </Button>
                          <Button
                            size="xs"
                            className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleStatusTransition(row.id, 'in_transit')}
                          >
                            <ArrowRight className="h-3 w-3" />
                            Enviar
                          </Button>
                        </>
                      )}

                      {row.status === 'in_transit' && (
                        <Button
                          size="xs"
                          className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleStatusTransition(row.id, 'delivered')}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Entregado
                        </Button>
                      )}

                      {row.status === 'delivered' && (
                        <Button
                          size="xs"
                          className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleStatusTransition(row.id, 'confirmed')}
                        >
                          <Sparkles className="h-3 w-3" />
                          Confirmar
                        </Button>
                      )}

                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleRowClick(row)}
                      >
                        Ver
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-5 py-3 text-sm text-background shadow-lg ring-1 ring-foreground/10">
          {toast}
        </div>
      )}

      <PaymentDetailPanel
        open={paymentPanelOpen}
        onClose={() => {
          setPaymentPanelOpen(false)
          setSelectedPaymentId(null)
        }}
        order={selectedPayment}
        onApprove={handleApprove}
        onReject={handleReject}
        onReassign={handleReassign}
      />

      <DeliveryDetailPanel
        open={deliveryPanelOpen}
        onClose={() => {
          setDeliveryPanelOpen(false)
          setSelectedDeliveryId(null)
        }}
        order={selectedDelivery}
        onStatusTransition={handleStatusTransition}
        onSetShippingMethod={handleSetShippingMethod}
        onOpenShalom={setShalomModalOrderId}
        onOpenDriverAssignment={setAssignModalOrderId}
      />

      <AssignDriverModal
        open={assignModalOrderId !== null}
        onClose={() => setAssignModalOrderId(null)}
        onAssign={(_, name) => {
          if (assignModalOrderId) handleAssignDriver(assignModalOrderId, name)
        }}
        currentOrderNumber={
          deliveryOrders.find((o) => o.id === assignModalOrderId)?.purchaseNumber ?? ''
        }
      />

      {shalomOrder && (
        <ShalomShippingModal
          open={shalomModalOrderId !== null}
          onClose={() => setShalomModalOrderId(null)}
          onGenerate={handleShalomGenerate}
          order={shalomOrder}
        />
      )}
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground ${className ?? ''}`}
    >
      {children}
    </th>
  )
}
