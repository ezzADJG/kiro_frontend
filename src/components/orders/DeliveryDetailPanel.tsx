import { useState } from 'react'
import {
  Package, User, Banknote, MapPin, Truck, CheckCircle2, Loader2, Calendar, Clock,
  ArrowRight, Map, UserCheck, Store, Hash, Sparkles, Play, PackageCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import SlidePanel from './SlidePanel'
import type { DeliveryOrder, ShippingMethod } from '@/types/payments'
import { PAYMENT_METHOD_LABELS, DELIVERY_STATUS_LABELS, SHIPPING_METHOD_LABELS } from '@/types/payments'
import { formatCurrency, formatDate, formatTime } from '@/data/mockData'
import { mockAgencies, mockShalomProducts } from '@/data/mockData'

interface DeliveryDetailPanelProps {
  open: boolean
  onClose: () => void
  order: DeliveryOrder | null
  onStatusTransition: (orderId: string, status: DeliveryOrder['deliveryStatus']) => void
  onSetShippingMethod: (orderId: string, method: ShippingMethod) => void
  onOpenShalom: (orderId: string) => void
  onOpenDriverAssignment: (orderId: string) => void
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

export default function DeliveryDetailPanel({
  open,
  onClose,
  order,
  onStatusTransition,
  onSetShippingMethod,
  onOpenShalom,
  onOpenDriverAssignment,
}: DeliveryDetailPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  if (!order) return null

  const handleAction = async (action: string, callback: () => void | Promise<void>) => {
    setActionLoading(action)
    await Promise.resolve(callback())
    setActionLoading(null)
  }

  const shippingIcon = (method: ShippingMethod | null) => {
    if (method === 'motorizado') return <Truck className="h-3.5 w-3.5" />
    if (method === 'courier') return <Package className="h-3.5 w-3.5" />
    if (method === 'recojo_en_tienda') return <Store className="h-3.5 w-3.5" />
    return null
  }

  const sd = order.shalomData
  const originAgency = sd ? mockAgencies.find((a) => a.id === sd.origin_terminal_id) : null
  const destinyAgency = sd ? mockAgencies.find((a) => a.id === sd.destiny_terminal_id) : null
  const shalomProduct = sd ? mockShalomProducts.find((p) => p.id === sd.product_id) : null

  const renderFooter = () => {
    switch (order.deliveryStatus) {
      case 'received':
        return (
          <Button
            size="sm"
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleAction('process', () => onStatusTransition(order.id, 'processing'))}
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
            onClick={() => handleAction('ready', () => onStatusTransition(order.id, 'ready'))}
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
            {!order.shippingMethod && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onOpenDriverAssignment(order.id)}
                  disabled={actionLoading !== null}
                >
                  <Truck className="h-3.5 w-3.5" />
                  Motorizado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onOpenShalom(order.id)}
                  disabled={actionLoading !== null}
                >
                  <Package className="h-3.5 w-3.5" />
                  Courier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => handleAction('pickup', () => onSetShippingMethod(order.id, 'recojo_en_tienda'))}
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
              onClick={() => handleAction('transit', () => onStatusTransition(order.id, 'in_transit'))}
              disabled={actionLoading !== null || !order.shippingMethod}
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
            onClick={() => handleAction('deliver', () => onStatusTransition(order.id, 'delivered'))}
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
            onClick={() => handleAction('confirm', () => onStatusTransition(order.id, 'confirmed'))}
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

  return (
    <>
      <SlidePanel
        open={open}
        onClose={onClose}
        title="Detalle de entrega"
        subtitle={order.purchaseNumber}
        icon={Truck}
        footer={<div className="space-y-2">{renderFooter()}</div>}
      >
        <div className="space-y-4">
          {/* Cliente */}
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

          {/* Productos */}
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

          {/* Información de entrega */}
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
                {order.deliveryStatus === 'in_transit' ? <Truck className="h-3 w-3 text-orange-600" /> :
                 order.deliveryStatus === 'delivered' || order.deliveryStatus === 'confirmed' ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> :
                 <Clock className="h-3 w-3 text-blue-600" />}
                {DELIVERY_STATUS_LABELS[order.deliveryStatus]}
              </span>
            </div>
            <Divider />
            <InfoRow label="Aprobado por" value={order.approvedBy} icon={UserCheck} />
            <InfoRow
              label="Fecha de aprobación"
              value={
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">{formatTime(order.approvedAt)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(order.approvedAt)}</div>
                </div>
              }
              icon={Calendar}
            />
          </SectionCard>

          {/* Método de envío */}
          <SectionCard title="Método de envío" icon={Truck}>
            {order.shippingMethod ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                    {shippingIcon(order.shippingMethod)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {SHIPPING_METHOD_LABELS[order.shippingMethod]}
                    </p>
                    {order.shippingMethod === 'motorizado' && order.assignedDriver && (
                      <p className="text-xs text-muted-foreground">Conductor: {order.assignedDriver}</p>
                    )}
                    {order.shippingMethod === 'recojo_en_tienda' && (
                      <p className="text-xs text-muted-foreground">El cliente recoge en tienda</p>
                    )}
                  </div>
                </div>

                {/* Shalom details */}
                {order.shippingMethod === 'courier' && order.shalomData && (
                  <div className="space-y-2 rounded-lg bg-secondary/30 p-3 ring-1 ring-foreground/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datos Shalom</p>
                    {order.shalomTracking && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono font-medium text-foreground">{order.shalomTracking.guia}</span>
                        <span className="text-muted-foreground">· {order.shalomTracking.codigo}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Origen:</span>
                        <p className="font-medium text-foreground">{originAgency?.nombre ?? `ID ${order.shalomData.origin_terminal_id}`}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Destino:</span>
                        <p className="font-medium text-foreground">{destinyAgency?.nombre ?? `ID ${order.shalomData.destiny_terminal_id}`}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Paquete:</span>
                        <p className="font-medium text-foreground">{shalomProduct?.title ?? `ID ${order.shalomData.product_id}`}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cantidad:</span>
                        <p className="font-medium text-foreground">{order.shalomData.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Código retiro:</span>
                      <span className="font-mono font-medium text-foreground">{order.shalomData.pickup_code}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground">
                <Truck className="h-6 w-6" />
                <p>Aún no se ha asignado método de envío</p>
              </div>
            )}
          </SectionCard>
        </div>
      </SlidePanel>
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
