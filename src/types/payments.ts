export interface OrderProduct {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type PaymentMethod = 'yape' | 'plin' | 'transferencia' | 'efectivo' | 'tarjeta'

export type PaymentVerificationStatus = 'pending_verification' | 'approved' | 'rejected'

export type DeliveryStatus = 'ready' | 'in_transit' | 'delivered'

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
  assignedDriver: string | null
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
  ready: 'Listo para Entregar',
  in_transit: 'En Camino',
  delivered: 'Entregado',
}
