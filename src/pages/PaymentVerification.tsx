import { useState } from 'react'
import { CheckCircle2, X, MapPin, Clock, Search, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PaymentDetailPanel from '@/components/orders/PaymentDetailPanel'
import { mockPaymentOrders } from '@/data/mockData'
import { PAYMENT_METHOD_LABELS } from '@/types/payments'
import { formatCurrency, formatTime } from '@/data/mockData'
import type { PaymentOrder } from '@/types/payments'

export default function PaymentVerification() {
  const [orders, setOrders] = useState<PaymentOrder[]>(mockPaymentOrders)
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
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

  const handleApprove = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setPanelOpen(false)
    setSelectedOrder(null)
    showToast('Pago aprobado — Pedido listo para entrega')
  }

  const handleReject = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setPanelOpen(false)
    setSelectedOrder(null)
    showToast('Pago rechazado')
  }

  const handleReassign = (_id: string, employeeName: string) => {
    setPanelOpen(false)
    setSelectedOrder(null)
    showToast(`Verificación reasignada a ${employeeName}`)
  }

  const openPanel = (order: PaymentOrder) => {
    setSelectedOrder(order)
    setPanelOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Verificación de Pagos</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {searchQuery
                ? `${filteredOrders.length} de ${orders.length} pedidos`
                : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} pendiente${orders.length !== 1 ? 's' : ''} de verificación`
              }
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            {orders.length} pendiente{orders.length !== 1 ? 's' : ''}
          </span>
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
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-base font-medium text-foreground">Todos los pagos verificados</h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  No hay pedidos pendientes de verificación. Los nuevos pagos aparecerán aquí automáticamente.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => (
              <PaymentCard
                key={order.id}
                order={order}
                onApprove={handleApprove}
                onReject={handleReject}
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

      <PaymentDetailPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedOrder(null) }}
        order={selectedOrder}
        onApprove={handleApprove}
        onReject={handleReject}
        onReassign={handleReassign}
      />
    </div>
  )
}

function PaymentCard({
  order,
  onApprove,
  onReject,
  onViewDetails,
}: {
  order: PaymentOrder
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onViewDetails: () => void
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-foreground/10 transition-all hover:ring-foreground/20">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{order.customerName}</p>
        </div>
        <p className="text-xs text-muted-foreground">DNI: {order.customerDNI}</p>
        <p className="font-mono text-xs text-muted-foreground">{order.purchaseNumber}</p>

        <p className="mt-2 text-sm font-semibold text-foreground">
          {formatCurrency(order.totalAmount, order.currency)}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
          <span className="text-border">·</span>
          <span>{formatTime(order.createdAt)}</span>
        </div>
        <div className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{order.deliveryAddress}</span>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pago Pendiente de Verificación
        </span>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border p-3">
        <Button
          size="xs"
          className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => onApprove(order.id)}
        >
          <CheckCircle2 className="h-3 w-3" />
          Aprobar
        </Button>
        <Button
          size="xs"
          variant="outline"
          className="flex-1 gap-1 text-destructive"
          onClick={() => onReject(order.id)}
        >
          <X className="h-3 w-3" />
          Rechazar
        </Button>
        <Button
          size="xs"
          variant="ghost"
          className="gap-1"
          onClick={onViewDetails}
        >
          <ChevronRight className="h-3 w-3" />
          Detalles
        </Button>
      </div>
    </div>
  )
}
