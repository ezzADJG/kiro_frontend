export interface OrderProduct {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type PaymentMethod = 'yape' | 'plin' | 'transferencia' | 'efectivo' | 'tarjeta'

export type PaymentVerificationStatus = 'pending_verification' | 'approved' | 'rejected'

export type DeliveryStatus = 'received' | 'processing' | 'ready' | 'in_transit' | 'delivered' | 'confirmed'

export type ShippingMethod = 'motorizado' | 'courier' | 'recojo_en_tienda'

export interface PaymentOrder {
  id: string
  purchaseNumber: string
  customerName: string
  customerDNI: string
  customerPhone: string
  deliveryAddress: string
  products: OrderProduct[]
  totalAmount: number
  currency: string
  paymentMethod: PaymentMethod
  receiptUrl: string
  paymentReference: string
  paymentBank: string
  createdAt: number
  status: PaymentVerificationStatus
}

export interface ShalomPerson {
  document_type: 'DNI' | 'RUC' | 'CE'
  document: string
  name: string
  last_name: string
  sur_name: string
  phone: number
  email?: string
  address?: string
}

export interface ShalomOrderPayload {
  origin_terminal_id: number
  destiny_terminal_id: number
  product_id: number
  quantity: number
  payer: 'sender' | 'receiver'
  pickup_code: string
  sender: ShalomPerson
  receiver: ShalomPerson
  dimensions?: {
    weight_kg: number
    height_m: number
    length_m: number
    width_m: number
  }
  aereo?: boolean
}

export interface ShalomTracking {
  guia: string
  serie: string
  codigo: string
}

export interface Agency {
  id: number
  nombre: string
  departamento: string
  provincia?: string
  distrito?: string
  aereo: boolean
  latitud: number
  longitud: number
}

export interface ShalomProduct {
  id: number
  title: string
  content: string
  sub_content: string
  measurements: {
    weight: number
    width: number
    height: number
    length: number
  }
}

export interface DeliveryOrder {
  id: string
  paymentOrderId: string
  purchaseNumber: string
  customerName: string
  customerDNI: string
  customerPhone: string
  deliveryAddress: string
  products: OrderProduct[]
  totalAmount: number
  currency: string
  paymentMethod: PaymentMethod
  deliveryStatus: DeliveryStatus
  shippingMethod: ShippingMethod | null
  assignedDriver: string | null
  shalomData: ShalomOrderPayload | null
  shalomTracking: ShalomTracking | null
  approvedBy: string
  approvedAt: number
}

export interface Driver {
  id: string
  name: string
  phone: string
  vehicle: string
}

export interface Employee {
  id: string
  name: string
  email: string
}

export interface StoreProfile {
  name: string
  document_type: 'DNI' | 'RUC' | 'CE'
  document: string
  last_name: string
  sur_name: string
  phone: number
  email: string
  address: string
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta de crédito/débito',
}

export const PAYMENT_VERIFICATION_STATUS_LABELS: Record<PaymentVerificationStatus, string> = {
  pending_verification: 'Pago Pendiente de Verificación',
  approved: 'Pago Aprobado',
  rejected: 'Pago Rechazado',
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  received: 'Pedido Recibido',
  processing: 'En Proceso',
  ready: 'Listo para Entregar',
  in_transit: 'En Camino',
  delivered: 'Entregado',
  confirmed: 'Concluido',
}

export const DELIVERY_STATUS_DOT: Record<DeliveryStatus, string> = {
  received: 'bg-blue-500',
  processing: 'bg-amber-500',
  ready: 'bg-violet-500',
  in_transit: 'bg-orange-500',
  delivered: 'bg-emerald-500',
  confirmed: 'bg-emerald-700',
}

export const DELIVERY_STATUS_TEXT: Record<DeliveryStatus, string> = {
  received: 'text-blue-600',
  processing: 'text-amber-600',
  ready: 'text-violet-600',
  in_transit: 'text-orange-600',
  delivered: 'text-emerald-600',
  confirmed: 'text-emerald-700',
}

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  motorizado: 'Motorizado',
  courier: 'Courier (Shalom)',
  recojo_en_tienda: 'Recojo en Tienda',
}

export type UnifiedOrderStatus = DeliveryStatus | 'pending_verification' | 'rejected'

export const UNIFIED_STATUS_LABELS: Record<UnifiedOrderStatus, string> = {
  pending_verification: 'Pago Pendiente',
  rejected: 'Rechazado',
  ...DELIVERY_STATUS_LABELS,
}

export const UNIFIED_STATUS_DOT: Record<UnifiedOrderStatus, string> = {
  pending_verification: 'bg-amber-500',
  rejected: 'bg-red-500',
  ...DELIVERY_STATUS_DOT,
}

export const UNIFIED_STATUS_TEXT: Record<UnifiedOrderStatus, string> = {
  pending_verification: 'text-amber-700',
  rejected: 'text-red-600',
  ...DELIVERY_STATUS_TEXT,
}
