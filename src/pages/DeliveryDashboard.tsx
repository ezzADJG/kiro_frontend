import { useState } from 'react'
import { MapPin, Truck, CheckCircle2, Clock, Package, ChevronRight, ListRestart, Search, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DeliveryDetailPanel from '@/components/orders/DeliveryDetailPanel'
import AssignDriverModal from '@/components/orders/AssignDriverModal'
import { mockDeliveryOrders } from '@/data/mockData'
import { DELIVERY_STATUS_LABELS } from '@/types/payments'
import { formatCurrency } from '@/data/mockData'
import type { DeliveryOrder } from '@/types/payments'

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders)
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [assignModalOrderId, setAssignModalOrderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    return (
      order.customerDNI.includes(q) ||
      order.customerName.toLowerCase().includes(q)
    )
  })

  const handleAssignDriver = (orderId: string, driverName: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, assignedDriver: driverName } : o)),
    )
    setAssignModalOrderId(null)
    showToast(`Conductor asignado: ${driverName}`)
  }

  const handleMarkInTransit = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deliveryStatus: 'in_transit' as const } : o)),
    )
    setPanelOpen(false)
    setSelectedOrder(null)
    showToast('Pedido marcado como en camino')
  }

  const handleMarkDelivered = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deliveryStatus: 'delivered' as const } : o)),
    )
    setPanelOpen(false)
    setSelectedOrder(null)
    showToast('Pedido entregado exitosamente')
  }

  const openPanel = (order: DeliveryOrder) => {
    setSelectedOrder(order)
    setPanelOpen(true)
  }

  const readyCount = orders.filter((o) => o.deliveryStatus === 'ready').length
  const inTransitCount = orders.filter((o) => o.deliveryStatus === 'in_transit').length
  const deliveredCount = orders.filter((o) => o.deliveryStatus === 'delivered').length

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard de Entregas</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {searchQuery
                ? `${filteredOrders.length} de ${orders.length} pedidos`
                : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} en gesti&oacute;n`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              {readyCount} listos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              {inTransitCount} en camino
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {deliveredCount} entregados
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por DNI o nombre de cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
                onAssignDriver={() => setAssignModalOrderId(order.id)}
                onMarkInTransit={() => handleMarkInTransit(order.id)}
                onMarkDelivered={() => handleMarkDelivered(order.id)}
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
        onAssignDriver={handleAssignDriver}
        onMarkInTransit={handleMarkInTransit}
        onMarkDelivered={handleMarkDelivered}
      />

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
  onAssignDriver,
  onMarkInTransit,
  onMarkDelivered,
  onViewDetails,
}: {
  order: DeliveryOrder
  onAssignDriver: () => void
  onMarkInTransit: () => void
  onMarkDelivered: () => void
  onViewDetails: () => void
}) {
  const statusColor =
    order.deliveryStatus === 'ready'
      ? 'text-blue-600'
      : order.deliveryStatus === 'in_transit'
        ? 'text-amber-600'
        : 'text-emerald-600'

  const StatusIcon =
    order.deliveryStatus === 'ready'
      ? Clock
      : order.deliveryStatus === 'in_transit'
        ? Truck
        : CheckCircle2

  const statusDot =
    order.deliveryStatus === 'ready'
      ? 'bg-blue-500'
      : order.deliveryStatus === 'in_transit'
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  return (
    <div
      className={`rounded-xl bg-white ring-1 ring-foreground/10 transition-all hover:ring-foreground/20 ${
        order.deliveryStatus === 'delivered' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <p className="font-mono text-xs font-medium text-foreground">{order.purchaseNumber}</p>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusColor}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot}`} />
          {DELIVERY_STATUS_LABELS[order.deliveryStatus]}
        </span>
      </div>

      <div className="space-y-1.5 px-4 py-3">
        <p className="text-sm font-medium text-foreground">{order.customerName}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>DNI: {order.customerDNI}</span>
          <span className="text-border">·</span>
          <span>{order.customerPhone}</span>
        </div>
        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{order.deliveryAddress}</span>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>
              {order.products.length} producto{order.products.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="font-medium text-foreground">
            {formatCurrency(order.totalAmount, order.currency)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          <span className="text-emerald-600 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Pago Aprobado
          </span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            {order.approvedBy}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border p-3">
        {order.deliveryStatus === 'ready' && (
          <>
            <Button
              size="xs"
              variant="outline"
              className="flex-1 gap-1"
              onClick={onAssignDriver}
            >
              <Truck className="h-3 w-3" />
              Conductor
            </Button>
            <Button
              size="xs"
              className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onMarkInTransit}
            >
              <Truck className="h-3 w-3" />
              En Camino
            </Button>
          </>
        )}
        {order.deliveryStatus === 'in_transit' && (
          <Button
            size="xs"
            className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onMarkDelivered}
          >
            <CheckCircle2 className="h-3 w-3" />
            Entregado
          </Button>
        )}
        {order.deliveryStatus === 'delivered' && (
          <div className="flex flex-1 items-center justify-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-medium">Entregado</span>
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
