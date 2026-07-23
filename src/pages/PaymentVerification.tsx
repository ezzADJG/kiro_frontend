import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, X, Search, ChevronRight, Receipt, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PaymentBadge from '@/components/orders/PaymentBadge'
import PaymentDetailPanel from '@/components/orders/PaymentDetailPanel'
import ReassignModal from '@/components/orders/ReassignModal'
import { useBusiness } from '@/context/BusinessContext'
import { useAuth } from '@/context/AuthContext'
import { subscribeOrders } from '@/lib/db'
import {
  approveOrder,
  rejectOrder,
  assignOrder,
  requestOrderReceipt,
} from '@/services/orderService'
import { mapOrderToPaymentOrder } from '@/utils/orderMappers'
import { migrateOrders } from '@/services/migrationService'
import { obtenerMiembrosDeNegocio, obtenerPerfilesDeUsuarios } from '@/services/businessService'
import { formatCurrency } from '@/utils/format'
import type { PaymentOrder, PaymentVerificationStatus } from '@/types/payments'
import type { Order } from '@/types/order'

interface EmployeeOption {
  id: string
  name: string
  email?: string
}

function formatDateTimeShort(timestamp: number) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

type PaymentTabFilter = 'pending' | 'approved' | 'rejected' | 'all'

export default function PaymentVerification() {
  const { activeBusinessId } = useBusiness()
  const { firebaseUser } = useAuth()

  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [activeTab, setActiveTab] = useState<PaymentTabFilter>('pending')

  const [rejectReassignOpen, setRejectReassignOpen] = useState(false)
  const [rejectReassignOrderId, setRejectReassignOrderId] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    if (!activeBusinessId) return

    migrateOrders(activeBusinessId).then(() => {
      const unsub = subscribeOrders(activeBusinessId, (data) => {
        if (!data) {
          setOrders([])
          setLoading(false)
          return
        }

        const entries = Object.entries(data) as [string, any][]

        const mapped: PaymentOrder[] = entries.map(([id, raw]) => {
          const order: Order = { id, ...raw }
          return mapOrderToPaymentOrder(order)
        })

        setOrders(mapped)
        setLoading(false)
      })

      return () => unsub()
    })
  }, [activeBusinessId])

  useEffect(() => {
    if (!activeBusinessId) return

    const loadEmployees = async () => {
      const members = await obtenerMiembrosDeNegocio(activeBusinessId)
      const activeUids = members.filter((m) => m.active).map((m) => m.uid)
      if (activeUids.length === 0) return

      const profiles = await obtenerPerfilesDeUsuarios(activeUids)
      const list: EmployeeOption[] = []
      for (const uid of activeUids) {
        const p = profiles[uid]
        if (p) {
          list.push({ id: uid, name: p.displayName || 'Sin nombre', email: p.email })
        }
      }
      setEmployees(list)
    }

    loadEmployees()
  }, [activeBusinessId])

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    return (
      order.customerDNI.includes(q) ||
      order.customerName.toLowerCase().includes(q)
    )
  })

  const tabOrders = filteredOrders.filter((order) => {
    if (activeTab === 'pending') return order.status === 'pending_review'
    if (activeTab === 'approved') return order.status === 'approved'
    if (activeTab === 'rejected') return order.status === 'rejected'
    return true
  })

  const pendingCount = orders.filter((o) => o.status === 'pending_review').length
  const approvedCount = orders.filter((o) => o.status === 'approved').length
  const rejectedCount = orders.filter((o) => o.status === 'rejected').length

  const handleApprove = async (id: string) => {
    if (!activeBusinessId) return

    try {
      const uid = firebaseUser?.uid ?? 'unknown'
      const name = firebaseUser?.displayName ?? 'Agente'
      await approveOrder(activeBusinessId, id, uid, name)
      showToast('Pago aprobado — Pedido listo para entrega')
    } catch {
      showToast('Error al aprobar el pago')
    }
  }

  const handleRejectStart = (id: string) => {
    setRejectReassignOrderId(id)
    setRejectReassignOpen(true)
  }

  const handleRejectConfirm = async (_empId: string, empName: string) => {
    if (!activeBusinessId || !rejectReassignOrderId) return

    try {
      const uid = firebaseUser?.uid ?? 'unknown'
      const name = firebaseUser?.displayName ?? 'Agente'
      await rejectOrder(activeBusinessId, rejectReassignOrderId, uid, name)
      showToast(`Pago rechazado — Chat asignado a ${empName}`)
    } catch {
      showToast('Error al rechazar el pago')
    }

    setRejectReassignOpen(false)
    setRejectReassignOrderId(null)
    setPanelOpen(false)
    setSelectedOrder(null)
  }

  const handleRejectCancel = () => {
    setRejectReassignOpen(false)
    setRejectReassignOrderId(null)
  }

  const handleReassign = async (_id: string, employeeName: string) => {
    if (!activeBusinessId) return
    try {
      const uid = firebaseUser?.uid ?? 'unknown'
      await assignOrder(activeBusinessId, _id, uid, employeeName)
      showToast(`Verificación reasignada a ${employeeName}`)
    } catch {
      showToast('Error al reasignar')
    }
    setPanelOpen(false)
    setSelectedOrder(null)
  }

  const handleRequestReceipt = async (orderId?: string) => {
    const id = orderId || selectedOrder?.id
    if (!activeBusinessId || !id) return
    try {
      await requestOrderReceipt(activeBusinessId, id)
      showToast('Solicitud de nuevo comprobante enviada al cliente')
      setPanelOpen(false)
      setSelectedOrder(null)
    } catch {
      showToast('Error al solicitar nuevo comprobante')
    }
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
                ? `${tabOrders.length} de ${orders.length} pedidos`
                : `${tabOrders.length} pedido${tabOrders.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-6 pt-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pendientes
            <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
              activeTab === 'pending'
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'approved'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Aprobados
            <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
              activeTab === 'approved'
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {approvedCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'rejected'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rechazados
            <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
              activeTab === 'rejected'
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {rejectedCount}
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
              {orders.length}
            </span>
          </button>
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
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
          </div>
        ) : tabOrders.length === 0 ? (
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
                <h3 className="text-base font-medium text-foreground">
                  {activeTab === 'pending' && 'Sin pagos pendientes'}
                  {activeTab === 'approved' && 'Sin pagos aprobados'}
                  {activeTab === 'rejected' && 'Sin pagos rechazados'}
                  {activeTab === 'all' && 'Sin pagos registrados'}
                </h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  {activeTab === 'pending' && 'No hay pagos pendientes de verificación. Los nuevos pagos aparecerán aquí automáticamente.'}
                  {activeTab === 'approved' && 'Los pagos aprobados aparecerán aquí.'}
                  {activeTab === 'rejected' && 'Los pagos rechazados aparecerán aquí.'}
                  {activeTab === 'all' && 'Los pagos aparecerán aquí una vez que los clientes realicen compras.'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tabOrders.map((order) => (
              <PaymentCard
                key={order.id}
                order={order}
                onApprove={() => handleApprove(order.id)}
                onRejectStart={() => handleRejectStart(order.id)}
                onRequestReceipt={() => handleRequestReceipt(order.id)}
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
        onApprove={() => selectedOrder && handleApprove(selectedOrder.id)}
        onRejectStart={() => selectedOrder && handleRejectStart(selectedOrder.id)}
        onReassign={handleReassign}
        onRequestReceipt={() => selectedOrder && handleRequestReceipt(selectedOrder.id)}
        employees={employees}
      />

      <ReassignModal
        open={rejectReassignOpen}
        onClose={handleRejectCancel}
        onReassign={handleRejectConfirm}
        employees={employees}
        currentOrderNumber={orders.find((o) => o.id === rejectReassignOrderId)?.purchaseNumber}
        title="Asignar chat del cliente"
        description="Selecciona a quién se asignará el chat con el cliente para gestionar el comprobante."
      />
    </div>
  )
}

function PaymentCard({
  order,
  onApprove,
  onRejectStart,
  onRequestReceipt,
  onViewDetails,
}: {
  order: PaymentOrder
  onApprove: () => void
  onRejectStart: () => void
  onRequestReceipt: () => void
  onViewDetails: () => void
}) {
  const isPending = order.status === 'pending_review'
  const isRejected = order.status === 'rejected'

  return (
    <div className="rounded-xl bg-white ring-1 ring-foreground/10 transition-all hover:ring-foreground/20">
      <div className="p-4 pb-3 space-y-0.5">
        <p className="text-sm font-medium text-foreground">
          {order.paymentReference || '—'}
        </p>
        <p className="text-sm font-medium text-foreground">
          {formatCurrency(order.totalAmount, order.currency)}
        </p>
        <p className="text-sm font-medium text-foreground">
          {order.paymentBank || '—'}
        </p>
        <p className="text-sm font-medium text-foreground">
          {formatDateTimeShort(order.createdAt)}
        </p>

        <div className="pt-2 space-y-0.5">
          <p className="text-xs text-muted-foreground">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">DNI: {order.customerDNI}</p>
          <p className="font-mono text-xs text-muted-foreground">{order.purchaseNumber}</p>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <PaymentBadge status={order.status} />
      </div>

      <div className="flex items-center gap-1.5 border-t border-border p-3">
        {isPending ? (
          <>
            <Button
              size="xs"
              className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onApprove}
            >
              <CheckCircle2 className="h-3 w-3" />
              Aprobar
            </Button>
            <Button
              size="xs"
              variant="outline"
              className="flex-1 gap-1 text-destructive"
              onClick={onRejectStart}
            >
              <X className="h-3 w-3" />
              Rechazar
            </Button>
            <Button
              size="xs"
              variant="outline"
              className="gap-1"
              onClick={onRequestReceipt}
            >
              <Receipt className="h-3 w-3" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="gap-1"
              onClick={onViewDetails}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </>
        ) : isRejected ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ban className="h-3.5 w-3.5 text-red-500" />
              Rechazado
            </span>
            <Button
              size="xs"
              variant="ghost"
              className="ml-auto gap-1"
              onClick={onViewDetails}
            >
              <ChevronRight className="h-3 w-3" />
              Detalles
            </Button>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Pagado
            </span>
            <Button
              size="xs"
              variant="ghost"
              className="ml-auto gap-1"
              onClick={onViewDetails}
            >
              <ChevronRight className="h-3 w-3" />
              Detalles
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
