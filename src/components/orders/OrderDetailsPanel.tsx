import { useState } from 'react'
import {
  Package, User, Banknote, MapPin, Truck, CheckCircle2, Loader2, Calendar,
  ArrowRight, Map, Store, Hash, Sparkles, Play, PackageCheck, Ban, X, Receipt,
  Building, UserCheck, Copy, Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import SlidePanel from './SlidePanel'
import ReassignModal from './ReassignModal'
import PaymentBadge from './PaymentBadge'
import { toast } from '@/hooks/use-toast'
import type { PaymentOrder, DeliveryOrder, ShippingMethod } from '@/types/payments'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_VERIFICATION_STATUS_LABELS,
  DELIVERY_STATUS_LABELS,
  SHIPPING_METHOD_LABELS,
} from '@/types/payments'
import { formatCurrency, formatDate, mockAgencies, mockShalomProducts } from '@/data/mockData'

interface EmployeeOption {
  id: string
  name: string
  email?: string
}

interface OrderDetailsPanelProps {
  open: boolean
  onClose: () => void
  order: PaymentOrder | DeliveryOrder | null
  businessId: string
  onApprovePayment: (orderId: string) => void
  onRejectPayment: (orderId: string) => void
  onReassignPayment: (orderId: string, name: string) => void
  onDeliveryStatusTransition: (orderId: string, status: DeliveryOrder['deliveryStatus']) => void
  onSetShippingMethod: (orderId: string, method: ShippingMethod) => void
  onOpenShalom: (orderId: string) => void
  onOpenDriverAssignment: (orderId: string) => void
  employees?: EmployeeOption[]
}

function isPaymentOrder(order: PaymentOrder | DeliveryOrder): order is PaymentOrder {
  return 'status' in order
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

function SectionCard({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
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

export default function OrderDetailsPanel({
  open,
  onClose,
  order,
  businessId,
  onApprovePayment,
  onRejectPayment,
  onReassignPayment,
  onDeliveryStatusTransition,
  onSetShippingMethod,
  onOpenShalom,
  onOpenDriverAssignment,
  employees = [],
}: OrderDetailsPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [reassignOpen, setReassignOpen] = useState(false)

  if (!order) return null

  const handleAction = async (action: string, callback: () => void | Promise<void>) => {
    setActionLoading(action)
    await Promise.resolve(callback())
    setActionLoading(null)
  }

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/envio/${order.id}?biz=${businessId}`
    try {
      await navigator.clipboard.writeText(link)
      toast({ title: 'Link copiado', description: 'Link de datos de envío copiado al portapapeles.', variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo copiar el link.', variant: 'error' })
    }
  }

  const isPayment = isPaymentOrder(order)
  const customerName = order.customerName
  const customerPhone = order.customerPhone
  const customerDNI = order.customerDNI
  const deliveryAddress = order.deliveryAddress
  const products = order.products
  const totalAmount = order.totalAmount
  const currency = order.currency
  const paymentMethod = order.paymentMethod
  const purchaseNumber = order.purchaseNumber

  const renderShippingIcon = (method: ShippingMethod | null) => {
    if (method === 'motorizado') return <Truck className="h-3.5 w-3.5" />
    if (method === 'courier') return <Package className="h-3.5 w-3.5" />
    if (method === 'recojo_en_tienda') return <Store className="h-3.5 w-3.5" />
    return null
  }

  const deliveryOrder = !isPayment ? (order as DeliveryOrder) : null
  const shalomData = deliveryOrder?.shalomData ?? null
  const shalomTracking = deliveryOrder?.shalomTracking ?? null
  const olvaTracking = deliveryOrder?.olvaTracking ?? null
  const transportista = deliveryOrder?.transportista ?? null
  const deliveryStatus = deliveryOrder?.deliveryStatus ?? null
  const shippingMethod = deliveryOrder?.shippingMethod ?? null
  const assignedDriver = deliveryOrder?.assignedDriver ?? null
  const approvedBy = deliveryOrder?.approvedBy ?? null
  const approvedAt = deliveryOrder?.approvedAt ?? null

  const originAgency = shalomData ? mockAgencies.find((a) => a.id === shalomData.origin_terminal_id) : null
  const destinyAgency = shalomData ? mockAgencies.find((a) => a.id === shalomData.destiny_terminal_id) : null
  const shalomProduct = shalomData ? mockShalomProducts.find((p) => p.id === shalomData.product_id) : null

  const renderFooter = () => {
    if (isPayment) {
      const po = order as PaymentOrder
      switch (po.status) {
        case 'pending_verification':
          return (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleAction('approve', () => onApprovePayment(po.id))}
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
                  onClick={() => handleAction('reject', () => onRejectPayment(po.id))}
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
            </div>
          )
        case 'rejected':
          return (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
              <Ban className="h-4 w-4 text-red-500" />
              <span className="font-medium">Este pedido fue rechazado</span>
            </div>
          )
        case 'approved':
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Pago aprobado</span>
              </div>
            </div>
          )
        default:
          return (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground/30" />
              <span className="font-medium">Esperando pago del cliente</span>
            </div>
          )
      }
    }

    if (!deliveryOrder) return null

    switch (deliveryOrder.deliveryStatus) {
      case 'received':
        return (
          <Button
            size="sm"
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleAction('process', () => onDeliveryStatusTransition(deliveryOrder.id, 'processing'))}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'process' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Iniciar preparación
          </Button>
        )
      case 'processing':
        return (
          <Button
            size="sm"
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleAction('ready', () => onDeliveryStatusTransition(deliveryOrder.id, 'ready'))}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'ready' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PackageCheck className="h-3.5 w-3.5" />
            )}
            Preparación lista
          </Button>
        )
      case 'ready':
        return (
          <div className="space-y-2">
            {!deliveryOrder.shippingMethod && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onOpenDriverAssignment(deliveryOrder.id)}
                  disabled={actionLoading !== null}
                >
                  <Truck className="h-3.5 w-3.5" />
                  Motorizado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onOpenShalom(deliveryOrder.id)}
                  disabled={actionLoading !== null}
                >
                  <Package className="h-3.5 w-3.5" />
                  Courier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => handleAction('pickup', () => onSetShippingMethod(deliveryOrder.id, 'recojo_en_tienda'))}
                  disabled={actionLoading !== null}
                >
                  <Store className="h-3.5 w-3.5" />
                  Recojo
                </Button>
              </div>
            )}
            <Button
              size="sm"
              className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleAction('transit', () => onDeliveryStatusTransition(deliveryOrder.id, 'in_transit'))}
              disabled={actionLoading !== null || !deliveryOrder.shippingMethod}
            >
              {actionLoading === 'transit' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              Marcar en camino
            </Button>
          </div>
        )
      case 'in_transit':
        return (
          <Button
            size="sm"
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleAction('deliver', () => onDeliveryStatusTransition(deliveryOrder.id, 'delivered'))}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'deliver' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Marcar entregado
          </Button>
        )
      case 'delivered':
        return (
          <Button
            size="sm"
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleAction('confirm', () => onDeliveryStatusTransition(deliveryOrder.id, 'confirmed'))}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'confirm' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Confirmar recepción
          </Button>
        )
      case 'confirmed':
        return (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">Pedido completado</span>
          </div>
        )
      default:
        return null
    }
  }

  const detectType = (): string => {
    if (isPayment) {
      const po = order as PaymentOrder
      return PAYMENT_VERIFICATION_STATUS_LABELS[po.status]
    }
    const dStatus = (order as DeliveryOrder).deliveryStatus
    return dStatus ? DELIVERY_STATUS_LABELS[dStatus] : '—'
  }

  return (
    <>
      <SlidePanel
        open={open}
        onClose={onClose}
        title={purchaseNumber}
        subtitle={detectType()}
        icon={isPayment ? Receipt : Truck}
        footer={<div className="space-y-2">{renderFooter()}</div>}
      >
        <div className="space-y-4">
          <SectionCard title="Cliente" icon={User}>
            <InfoRow label="Nombre" value={customerName} />
            <InfoRow label="DNI" value={customerDNI} />
            <InfoRow label="Teléfono" value={customerPhone} />
            <Divider />
            <div className="flex items-start gap-2 py-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <span className="text-sm text-muted-foreground">Dirección de entrega</span>
                <span className="ml-auto block text-right text-sm font-medium text-foreground">{deliveryAddress}</span>
              </div>
              <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary" title="Ver en mapa">
                <Map className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={handleCopyLink}
              >
                <Copy className="h-3.5 w-3.5" />
                <Link2 className="h-3.5 w-3.5" />
                Copiar link de envío
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Productos" icon={Package}>
            <div className="space-y-1.5">
              {products.map((product, i) => (
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
                      {formatCurrency(product.totalPrice, currency)}
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
                  {formatCurrency(totalAmount, currency)}
                </span>
              }
            />
            <InfoRow
              label="Método de pago"
              value={PAYMENT_METHOD_LABELS[paymentMethod]}
              icon={Banknote}
            />
          </SectionCard>

          <SectionCard title="Información de pago" icon={Receipt}>
            {isPayment && (order as PaymentOrder).receiptUrl ? (
              <div className="mb-3 overflow-hidden rounded-lg border border-border">
                <img
                  src={(order as PaymentOrder).receiptUrl}
                  alt={`Comprobante ${purchaseNumber}`}
                  className="w-full object-contain"
                />
              </div>
            ) : isPayment ? (
              <div className="mb-3 flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">Sin comprobante</p>
              </div>
            ) : null}
            {isPayment ? (
              <div className="space-y-1">
                <InfoRow label="Referencia" value={(order as PaymentOrder).paymentReference || '—'} />
                <InfoRow label="Banco / Plataforma" value={(order as PaymentOrder).paymentBank || '—'} icon={Building} />
                <InfoRow label="Fecha" value={formatDate((order as PaymentOrder).createdAt)} />
                <InfoRow label="Estado" value={<PaymentBadge status={(order as PaymentOrder).status} />} />
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow label="Estado de pago" value={<PaymentBadge status="approved" />} />
                <InfoRow label="Método" value={PAYMENT_METHOD_LABELS[paymentMethod]} icon={Banknote} />
              </div>
            )}
          </SectionCard>

          {!isPayment && (
            <SectionCard title="Información de envío" icon={Truck}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado de entrega</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                    {deliveryStatus === 'in_transit' ? (
                      <Truck className="h-3 w-3 text-orange-600" />
                    ) : deliveryStatus === 'delivered' || deliveryStatus === 'confirmed' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ) : deliveryStatus ? (
                      <Package className="h-3 w-3 text-blue-600" />
                    ) : null}
                    {deliveryStatus ? DELIVERY_STATUS_LABELS[deliveryStatus] : '—'}
                  </span>
                </div>
                <Divider />

                {shippingMethod ? (
                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                      {renderShippingIcon(shippingMethod)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {SHIPPING_METHOD_LABELS[shippingMethod]}
                      </p>
                      {shippingMethod === 'motorizado' && assignedDriver && (
                        <p className="text-xs text-muted-foreground">Conductor: {assignedDriver}</p>
                      )}
                      {shippingMethod === 'recojo_en_tienda' && (
                        <p className="text-xs text-muted-foreground">El cliente recoge en tienda</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground">
                    <Truck className="h-6 w-6" />
                    <p>Aún no se ha asignado método de envío</p>
                  </div>
                )}

                {shippingMethod === 'courier' && transportista === 'SHALOM' && shalomData && (
                  <div className="space-y-2 rounded-lg bg-secondary/30 p-3 ring-1 ring-foreground/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Datos Shalom
                    </p>
                    {shalomTracking && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono font-medium text-foreground">{shalomTracking.guia}</span>
                        <span className="text-muted-foreground">· {shalomTracking.codigo}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Origen:</span>
                        <p className="font-medium text-foreground">
                          {originAgency?.nombre ?? `ID ${shalomData.origin_terminal_id}`}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Destino:</span>
                        <p className="font-medium text-foreground">
                          {destinyAgency?.nombre ?? `ID ${shalomData.destiny_terminal_id}`}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Paquete:</span>
                        <p className="font-medium text-foreground">
                          {shalomProduct?.title ?? `ID ${shalomData.product_id}`}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cantidad:</span>
                        <p className="font-medium text-foreground">{shalomData.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-secondary/40 px-2 py-1 text-xs">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Código de retiro:</span>
                      <span className="font-mono font-medium text-foreground">{shalomData.pickup_code}</span>
                    </div>
                    <Divider />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Costo de envío:</span>
                        <p className="font-medium text-foreground">
                          {formatCurrency(shalomProduct ? 25 : 0, 'PEN')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dimensiones:</span>
                        {shalomData.dimensions ? (
                          <p className="font-medium text-foreground">
                            {shalomData.dimensions.weight_kg}kg &middot; {shalomData.dimensions.height_m}x{shalomData.dimensions.length_m}x{shalomData.dimensions.width_m}m
                          </p>
                        ) : shalomProduct ? (
                          <p className="font-medium text-foreground">
                            {shalomProduct.measurements.weight}kg &middot; {shalomProduct.measurements.height}x{shalomProduct.measurements.length}x{shalomProduct.measurements.width}cm
                          </p>
                        ) : (
                          <p className="text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {shippingMethod === 'courier' && transportista === 'OLVA' && (
                  <div className="space-y-2 rounded-lg bg-secondary/30 p-3 ring-1 ring-foreground/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Datos Olva
                    </p>
                    {olvaTracking && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono font-medium text-foreground">{olvaTracking.nroEnvio}</span>
                        <span className="text-muted-foreground">· {olvaTracking.codigo}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Envío registrado a través de Olva Courier.
                    </p>
                  </div>
                )}

                <Divider />
                <InfoRow label="Aprobado por" value={approvedBy ?? '—'} icon={UserCheck} />
                <InfoRow
                  label="Fecha de aprobación"
                  value={approvedAt ? formatDate(approvedAt) : '—'}
                  icon={Calendar}
                />
              </div>
            </SectionCard>
          )}
        </div>
      </SlidePanel>

      {isPayment && (
        <ReassignModal
          open={reassignOpen}
          onClose={() => setReassignOpen(false)}
          onReassign={(_, name) => {
            onReassignPayment((order as PaymentOrder).id, name)
            setReassignOpen(false)
            onClose()
          }}
          employees={employees}
          currentOrderNumber={purchaseNumber}
        />
      )}
    </>
  )
}
