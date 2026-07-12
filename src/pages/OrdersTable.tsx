import { useState, useMemo, useEffect } from 'react'
import {
  Search, Check, X, Download, Circle, CircleDot,
  Clock, Truck, Package, Store, ListRestart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toaster } from '@/components/ui/toaster'
import OrderDetailsPanel from '@/components/orders/OrderDetailsPanel'
import AssignDriverModal from '@/components/orders/AssignDriverModal'
import ShalomShippingModal from '@/components/orders/ShalomShippingModal'
import PaymentBadge from '@/components/orders/PaymentBadge'
import { useBusiness } from '@/context/BusinessContext'
import { useAuth } from '@/context/AuthContext'
import { subscribeOrders } from '@/lib/db'
import {
  approveOrder,
  rejectOrder,
  assignOrder,
  updateOrderDeliveryStatus,
  updateOrderShipping,
} from '@/services/orderService'
import { saveShippingData } from '@/services/shippingDataService'
import { mapOrderToPaymentOrder, mapOrderToDeliveryOrder } from '@/utils/orderMappers'
import { migrateOrders } from '@/services/migrationService'
import { toast } from '@/hooks/use-toast'
import { SHIPPING_METHOD_LABELS } from '@/types/payments'
import { formatCurrency } from '@/data/mockData'
import type { PaymentOrder, DeliveryOrder, ShippingMethod, PaymentVerificationStatus, UnifiedOrderStatus, ShalomOrderPayload, ShalomTracking } from '@/types/payments'
import type { Order } from '@/types/order'

interface UnifiedRow {
  id: string
  type: 'payment' | 'delivery'
  purchaseNumber: string
  customerName: string
  customerPhone: string
  customerDNI: string
  products: { name: string; quantity: number }[]
  totalAmount: number
  currency: string
  displayTime: number
  status: UnifiedOrderStatus | null
  paymentStatus: PaymentVerificationStatus
  shippingMethod: ShippingMethod | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending_review', label: 'Pendiente de revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'received', label: 'Recibido' },
  { value: 'processing', label: 'En proceso' },
  { value: 'ready', label: 'Listo para entregar' },
  { value: 'in_transit', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'confirmed', label: 'Concluido' },
]

const PAYMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas las condiciones' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Pagado' },
  { value: 'rejected', label: 'Rechazado' },
]

const SHIPPING_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los envíos' },
  { value: 'unassigned', label: 'Sin asignar' },
  { value: 'motorizado', label: 'Motorizado' },
  { value: 'courier', label: 'Courier (Shalom)' },
  { value: 'recojo_en_tienda', label: 'Recojo en tienda' },
]

const PENDING_STATUSES: UnifiedOrderStatus[] = ['pending_review']

function formatTableDate(ts: number) {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts))
}

function formatProductsBrief(products: { name: string; quantity: number }[]) {
  if (products.length === 0) return '—'
  if (products.length === 1) return `${products[0].quantity}x ${products[0].name}`
  return `${products.length} productos`
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground ${className ?? ''}`}>
      {children}
    </th>
  )
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3">
          <div className="h-4 w-4 rounded-full bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-6 w-14 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export default function OrdersTable() {
  const { activeBusinessId } = useBusiness()
  const { firebaseUser } = useAuth()
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([])
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'new' | 'all'>('new')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [shippingFilter, setShippingFilter] = useState('all')

  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | DeliveryOrder | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const [assignModalOrderId, setAssignModalOrderId] = useState<string | null>(null)
  const [shalomModalOrderId, setShalomModalOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeBusinessId) return

    migrateOrders(activeBusinessId).then(() => {
      const unsub = subscribeOrders(activeBusinessId, (data) => {
        setLoading(false)
        if (!data) {
          setPaymentOrders([])
          setDeliveryOrders([])
          return
        }

        const entries = Object.entries(data) as [string, any][]

        const payments: PaymentOrder[] = []
        const deliveries: DeliveryOrder[] = []

        for (const [id, raw] of entries) {
          const order: Order = { id, ...raw }
          if (order.status === 'pending_review' || order.status === 'rejected') {
            payments.push(mapOrderToPaymentOrder(order))
          } else if (order.status === 'approved') {
            deliveries.push(mapOrderToDeliveryOrder(order))
          }
        }

        setPaymentOrders(payments)
        setDeliveryOrders(deliveries)
      })

      return () => unsub()
    })
  }, [activeBusinessId])

  useEffect(() => {
    if (!selectedOrder) return
    const id = selectedOrder.id
    const isPayment = 'status' in selectedOrder
    const updated = isPayment
      ? paymentOrders.find((o) => o.id === id)
      : deliveryOrders.find((o) => o.id === id)
    if (updated && updated !== selectedOrder) {
      setSelectedOrder(updated)
    }
  }, [paymentOrders, deliveryOrders])

  const unifiedRows: UnifiedRow[] = useMemo(() => {
    const payments: UnifiedRow[] = paymentOrders.map((o) => ({
      id: o.id,
      type: 'payment' as const,
      purchaseNumber: o.purchaseNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerDNI: o.customerDNI,
      products: o.products,
      totalAmount: o.totalAmount,
      currency: o.currency,
      displayTime: o.createdAt,
      status: o.status as UnifiedOrderStatus,
      paymentStatus: o.status,
      shippingMethod: null,
    }))
    const deliveries: UnifiedRow[] = deliveryOrders.map((o) => ({
      id: o.id,
      type: 'delivery' as const,
      purchaseNumber: o.purchaseNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerDNI: o.customerDNI,
      products: o.products,
      totalAmount: o.totalAmount,
      currency: o.currency,
      displayTime: o.approvedAt,
      status: o.deliveryStatus ?? null,
      paymentStatus: 'approved' as PaymentVerificationStatus,
      shippingMethod: o.shippingMethod,
    }))
    return [...payments, ...deliveries]
  }, [paymentOrders, deliveryOrders])

  const filteredRows = useMemo(() => {
    let rows = unifiedRows

    if (activeTab === 'new') {
      rows = rows.filter((r) => PENDING_STATUSES.includes(r.status as any))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      rows = rows.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.customerDNI.includes(q) ||
          r.customerPhone.includes(q) ||
          r.purchaseNumber.toLowerCase().includes(q),
      )
    }

    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter)
    }

    if (paymentFilter !== 'all') {
      if (paymentFilter === 'pending') {
        rows = rows.filter((r) => r.paymentStatus === 'pending_review')
      } else {
        rows = rows.filter((r) => r.paymentStatus === paymentFilter)
      }
    }

    if (shippingFilter !== 'all') {
      if (shippingFilter === 'unassigned') {
        rows = rows.filter((r) => r.type === 'delivery' && r.shippingMethod === null)
      } else {
        rows = rows.filter((r) => r.shippingMethod === shippingFilter)
      }
    }

    rows.sort((a, b) => b.displayTime - a.displayTime)

    return rows
  }, [unifiedRows, activeTab, searchQuery, statusFilter, paymentFilter, shippingFilter])

  const newOrdersCount = useMemo(
    () => unifiedRows.filter((r) => PENDING_STATUSES.includes(r.status as any)).length,
    [unifiedRows],
  )

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || paymentFilter !== 'all' || shippingFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setShippingFilter('all')
  }

  const openPanel = (row: UnifiedRow) => {
    setSelectedRowId(row.id)
    if (row.type === 'payment') {
      const order = paymentOrders.find((o) => o.id === row.id)
      if (order) {
        setSelectedOrder(order)
        setPanelOpen(true)
      }
    } else {
      const order = deliveryOrders.find((o) => o.id === row.id)
      if (order) {
        setSelectedOrder(order)
        setPanelOpen(true)
      }
    }
  }

  const closePanel = () => {
    setPanelOpen(false)
    setSelectedOrder(null)
    setSelectedRowId(null)
  }

  const handleApprove = async (orderId: string) => {
    if (!activeBusinessId) return
    try {
      const uid = firebaseUser?.uid ?? 'unknown'
      const name = firebaseUser?.displayName ?? 'Agente'
      await approveOrder(activeBusinessId, orderId, uid, name)
      toast({ title: 'Pago aprobado', description: 'El pedido está listo para entrega', variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo aprobar el pago', variant: 'error' })
    }
  }

  const handleReject = async (orderId: string) => {
    if (!activeBusinessId) return
    try {
      const uid = firebaseUser?.uid ?? 'unknown'
      const name = firebaseUser?.displayName ?? 'Agente'
      await rejectOrder(activeBusinessId, orderId, uid, name)
      toast({ title: 'Pago rechazado', variant: 'info' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo rechazar el pago', variant: 'error' })
    }
  }

  const handleReassign = async (orderId: string, employeeName: string) => {
    if (!activeBusinessId) return
    try {
      const uid = firebaseUser?.uid ?? 'unknown'
      await assignOrder(activeBusinessId, orderId, uid, employeeName)
      toast({ title: 'Verificación reasignada', description: `Reasignado a ${employeeName}`, variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo reasignar', variant: 'error' })
    }
  }

  const handleAssignDriver = async (orderId: string, driverName: string) => {
    if (!activeBusinessId) return
    await updateOrderShipping(activeBusinessId, orderId, 'motorizado', driverName)
    setAssignModalOrderId(null)
    toast({ title: 'Conductor asignado', description: driverName, variant: 'success' })
  }

  const handleSetShippingMethod = async (orderId: string, method: ShippingMethod) => {
    if (!activeBusinessId) return
    await updateOrderShipping(activeBusinessId, orderId, method)
    toast({ title: 'Método de envío actualizado', description: SHIPPING_METHOD_LABELS[method], variant: 'success' })
  }

  const handleShalomGenerate = async (orderId: string, payload: ShalomOrderPayload, tracking: ShalomTracking) => {
    if (!activeBusinessId) return
    await updateOrderShipping(activeBusinessId, orderId, 'courier')
    await saveShippingData(activeBusinessId, orderId, { type: 'courier', tracking }, payload)
    setShalomModalOrderId(null)
    toast({ title: 'Guía Shalom generada', description: tracking.guia, variant: 'success' })
  }

  const handleStatusTransition = async (orderId: string, nextStatus: DeliveryOrder['deliveryStatus']) => {
    if (!activeBusinessId) return
    await updateOrderDeliveryStatus(activeBusinessId, orderId, nextStatus)
    const labels: Record<string, string> = {
      processing: 'Preparación iniciada',
      ready: 'Pedido listo para entrega',
      in_transit: 'Pedido en camino',
      delivered: 'Pedido entregado',
      confirmed: 'Recepción confirmada',
    }
    toast({ title: labels[nextStatus] || 'Estado actualizado', variant: 'success' })
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

      <div className="border-b border-border px-6 pt-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('new')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nuevos pedidos
            <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
              activeTab === 'new'
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {newOrdersCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
            <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
              activeTab === 'all'
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {unifiedRows.length}
            </span>
          </button>
        </div>
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI, celular o pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado del pedido" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={(v) => v !== null && setPaymentFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Condición de pago" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={shippingFilter} onValueChange={(v) => v !== null && setShippingFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado del envío" />
            </SelectTrigger>
            <SelectContent>
              {SHIPPING_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" disabled className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="px-6 py-6">
            <TableSkeleton />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary ring-1 ring-foreground/10">
              <ListRestart className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground">
              {hasActiveFilters ? 'Sin resultados' : 'No hay pedidos'}
            </h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'No se encontraron pedidos que coincidan con los filtros aplicados.'
                : 'Los pedidos aparecerán aquí una vez que los clientes realicen compras.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-border">
                <Th className="w-10" />
                <Th># Pedido</Th>
                <Th>Cliente</Th>
                <Th>Celular</Th>
                <Th>Fecha</Th>
                <Th>Productos</Th>
                <Th>Total</Th>
                <Th>Pago</Th>
                <Th>Envío</Th>
                <Th>Validación</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={`${row.type}-${row.id}`}
                  className={`cursor-pointer border-b border-border transition-colors hover:bg-muted/50 ${
                    selectedRowId === row.id ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => openPanel(row)}
                >
                  <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openPanel(row)}
                      className="flex items-center justify-center"
                    >
                      {selectedRowId === row.id ? (
                        <CircleDot className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground" />
                      )}
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-foreground tracking-tight">
                      {row.purchaseNumber}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{row.customerName}</p>
                    <p className="text-xs text-muted-foreground">DNI: {row.customerDNI}</p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground/80">
                    {row.customerPhone}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {formatTableDate(row.displayTime)}
                    </div>
                  </td>

                  <td className="max-w-[180px] truncate px-4 py-3 text-xs text-foreground/70">
                    {formatProductsBrief(row.products)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-foreground">
                    {formatCurrency(row.totalAmount, row.currency)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <PaymentBadge status={row.paymentStatus} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {row.shippingMethod ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-xs font-medium text-foreground/80">
                        {row.shippingMethod === 'motorizado' && <Truck className="h-3 w-3" />}
                        {row.shippingMethod === 'courier' && <Package className="h-3 w-3" />}
                        {row.shippingMethod === 'recojo_en_tienda' && <Store className="h-3 w-3" />}
                        {SHIPPING_METHOD_LABELS[row.shippingMethod]}
                      </span>
                    ) : row.type === 'delivery' ? (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {row.type === 'payment' && row.status === 'pending_review' && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 w-7 rounded-full p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => handleApprove(row.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 w-7 rounded-full p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleReject(row.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {row.type === 'delivery' && row.status === 'received' && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => handleStatusTransition(row.id, 'processing')}
                        >
                          Preparar
                        </Button>
                      </div>
                    )}
                    {row.type === 'delivery' && row.status === 'processing' && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs font-medium text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                          onClick={() => handleStatusTransition(row.id, 'ready')}
                        >
                          Listo
                        </Button>
                      </div>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="xs" variant="ghost" className="gap-1 text-xs" onClick={() => openPanel(row)}>
                      Detalles
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <OrderDetailsPanel
        open={panelOpen}
        onClose={closePanel}
        order={selectedOrder}
        businessId={activeBusinessId ?? ''}
        onApprovePayment={handleApprove}
        onRejectPayment={handleReject}
        onReassignPayment={handleReassign}
        onDeliveryStatusTransition={handleStatusTransition}
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

      <Toaster />
    </div>
  )
}
