export interface Order {
  id: string
  orderNumber: string
  products: OrderProduct[]
  totalAmount: number
  currency: string
  paymentMethod: PaymentMethod
  createdAt: number
  status: OrderStatus
}

export interface OrderProduct {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type PaymentMethod =
  | 'yape'
  | 'plin'
  | 'transferencia'
  | 'efectivo'
  | 'tarjeta'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export type CustomerTier = 'new' | 'returning' | 'vip'
export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'disputed'
export type FraudRisk = 'low' | 'medium' | 'high'

export interface PaymentVerification {
  id: string
  orderId: string
  receiptUrl: string
  amount: number
  currency: string
  referenceNumber: string
  bank: string
  status: PaymentStatus
  verifiedAt?: number
  verifiedBy?: string
}

export interface CustomerInfo {
  id: string
  name: string
  phone: string
  previousOrders: number
  tier: CustomerTier
  firstSeenAt: number
  lastSeenAt: number
}

export interface AIAnalysis {
  summary: string
  confidenceScore: number
  fraudRisk: FraudRisk
  observations: string[]
  recommendedAction: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  performedBy: string
  performedAt: number
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
}

export const CUSTOMER_TIER_LABELS: Record<CustomerTier, string> = {
  new: 'Nuevo',
  returning: 'Recurrente',
  vip: 'VIP',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  rejected: 'Rechazado',
  disputed: 'En disputa',
}

export const FRAUD_RISK_LABELS: Record<FraudRisk, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
}
