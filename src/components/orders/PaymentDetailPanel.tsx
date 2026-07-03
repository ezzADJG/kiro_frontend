import { useState } from 'react'
import { Package, User, Banknote, MapPin, Building2, Receipt, CheckCircle2, Loader2, X, ArrowRight, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SlidePanel from './SlidePanel'
import ReassignModal from './ReassignModal'
import type { PaymentOrder } from '@/types/payments'
import { PAYMENT_METHOD_LABELS, PAYMENT_VERIFICATION_STATUS_LABELS } from '@/types/payments'
import { formatCurrency, formatDate } from '@/data/mockData'

interface PaymentDetailPanelProps {
  open: boolean
  onClose: () => void
  order: PaymentOrder | null
  onApprove: (orderId: string) => void
  onReject?: (orderId: string) => void
  onRejectStart?: (orderId: string) => void
  onReassign: (orderId: string, employeeName: string) => void
  onRequestReceipt?: () => void
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
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

export default function PaymentDetailPanel({
  open,
  onClose,
  order,
  onApprove,
  onReject,
  onRejectStart,
  onReassign,
  onRequestReceipt,
}: PaymentDetailPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [reassignOpen, setReassignOpen] = useState(false)

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
        title="Verificación de pago"
        subtitle={order.purchaseNumber}
        icon={Receipt}
        footer={order.status === 'rejected' ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
            <Ban className="h-4 w-4 text-red-500" />
            <span className="font-medium">Este pedido fue rechazado</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleAction('approve', () => onApprove(order.id))}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'approve' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Aprobar pago
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-destructive"
                onClick={() => handleAction('reject', () => onRejectStart ? onRejectStart(order.id) : onReject?.(order.id))}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'reject' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Rechazar pago
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => setReassignOpen(true)}
              disabled={actionLoading !== null}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Reasignar a otra persona
            </Button>
            {onRequestReceipt && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={onRequestReceipt}
                disabled={actionLoading !== null}
              >
                <Receipt className="h-3.5 w-3.5" />
                Pedir nuevo comprobante
              </Button>
            )}
          </div>
        )}
      >
        <div className="space-y-4">
          <SectionCard title="Cliente" icon={User}>
            <InfoRow label="Nombre" value={order.customerName} />
            <InfoRow label="DNI" value={order.customerDNI} />
            <InfoRow label="Teléfono" value={order.customerPhone} />
            <Divider />
            <div className="flex items-start gap-2 py-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Dirección de entrega</span>
              <span className="ml-auto text-right text-sm font-medium text-foreground">{order.deliveryAddress}</span>
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

          <SectionCard title="Comprobante de pago" icon={Receipt}>
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={order.receiptUrl}
                alt={`Comprobante ${order.purchaseNumber}`}
                className="w-full object-contain"
              />
            </div>
            <div className="mt-3 space-y-1">
              <InfoRow label="Referencia" value={order.paymentReference} />
              <InfoRow label="Banco / Plataforma" value={order.paymentBank} icon={Building2} />
              <InfoRow label="Fecha" value={formatDate(order.createdAt)} />
              <InfoRow
                label="Estado"
                value={PAYMENT_VERIFICATION_STATUS_LABELS[order.status]}
              />
            </div>
          </SectionCard>
        </div>
      </SlidePanel>

      <ReassignModal
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        onReassign={(_, name) => {
          onReassign(order.id, name)
          setReassignOpen(false)
          onClose()
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
