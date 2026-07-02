import { useState } from 'react'
import { Package, User, CreditCard, Banknote, MapPin, Truck, CheckCircle2, Loader2, Calendar, Clock, ArrowRight, Map, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SlidePanel from './SlidePanel'
import StatusBadge from './StatusBadge'
import AssignDriverModal from './AssignDriverModal'
import type { DeliveryOrder } from '@/types/payments'
import { PAYMENT_METHOD_LABELS, DELIVERY_STATUS_LABELS } from '@/types/payments'
import { formatCurrency, formatDate } from '@/data/mockData'

interface DeliveryDetailPanelProps {
  open: boolean
  onClose: () => void
  order: DeliveryOrder | null
  onAssignDriver: (orderId: string, driverName: string) => void
  onMarkInTransit: (orderId: string) => void
  onMarkDelivered: (orderId: string) => void
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="text-right text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function Divider() {
  return <div className="my-2 border-t border-border" />
}

export default function DeliveryDetailPanel({
  open,
  onClose,
  order,
  onAssignDriver,
  onMarkInTransit,
  onMarkDelivered,
}: DeliveryDetailPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  if (!order) return null

  const handleAction = async (action: string, callback: () => void | Promise<void>) => {
    setActionLoading(action)
    await Promise.resolve(callback())
    setActionLoading(null)
  }

  return (
    <>
      <SlidePanel
        open={open}
        onClose={onClose}
        title="Detalle de entrega"
        subtitle={order.purchaseNumber}
        icon={Truck}
        footer={
          <div className="space-y-2">
            {order.deliveryStatus === 'ready' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => setAssignModalOpen(true)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'assign' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Truck className="h-3.5 w-3.5" />
                  )}
                  Asignar conductor
                </Button>
                <Button
                  size="sm"
                  className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleAction('transit', () => onMarkInTransit(order.id))}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'transit' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  Marcar en camino
                </Button>
              </>
            )}
            {order.deliveryStatus === 'in_transit' && (
              <Button
                size="sm"
                className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleAction('deliver', () => onMarkDelivered(order.id))}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'deliver' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Marcar entregado
              </Button>
            )}
            {order.deliveryStatus === 'delivered' && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Pedido entregado exitosamente</span>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <SectionCard title="Cliente" icon={User}>
            <InfoRow label="Nombre" value={order.customerName} />
            <InfoRow label="DNI" value={order.customerDNI} />
            <InfoRow label="Teléfono" value={order.customerPhone} />
            <Divider />
            <div className="flex items-start gap-2 py-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <span className="text-sm text-muted-foreground">Dirección de entrega</span>
                <span className="ml-auto block text-right text-sm font-medium text-foreground">{order.deliveryAddress}</span>
              </div>
              <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary" title="Ver en mapa">
                <Map className="h-4 w-4" />
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Productos" icon={Package}>
            <div className="space-y-1.5">
              {order.products.map((product, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-foreground">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>x{product.quantity}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(product.totalPrice, order.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Divider />
            <InfoRow
              label="Total"
              value={
                <span className="text-base font-semibold text-foreground">
                  {formatCurrency(order.totalAmount, order.currency)}
                </span>
              }
            />
            <InfoRow
              label="Método de pago"
              value={PAYMENT_METHOD_LABELS[order.paymentMethod]}
              icon={Banknote}
            />
          </SectionCard>

          <SectionCard title="Información de entrega" icon={Truck}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado de pago</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Pago Aprobado
              </span>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado de entrega</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                {order.deliveryStatus === 'in_transit' ? <Truck className="h-3 w-3 text-amber-600" /> : order.deliveryStatus === 'delivered' ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-blue-600" />}
                {DELIVERY_STATUS_LABELS[order.deliveryStatus]}
              </span>
            </div>
            <Divider />
            <InfoRow
              label="Aprobado por"
              value={order.approvedBy}
              icon={UserCheck}
            />
            <InfoRow
              label="Fecha de aprobación"
              value={formatDate(order.approvedAt)}
              icon={Calendar}
            />
            {order.assignedDriver && (
              <>
                <Divider />
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.assignedDriver}</p>
                    <p className="text-xs text-muted-foreground">Conductor asignado</p>
                  </div>
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </SlidePanel>

      <AssignDriverModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={(_, name) => {
          onAssignDriver(order.id, name)
          setAssignModalOpen(false)
        }}
        currentOrderNumber={order.purchaseNumber}
      />
    </>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}
