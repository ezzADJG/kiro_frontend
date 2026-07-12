import type { PaymentMethod } from './payments'

export type OrderStatus = 'pending_review' | 'approved' | 'rejected'

export type DeliveryStatus = 'received' | 'processing' | 'ready' | 'in_transit' | 'delivered' | 'confirmed'

export type ShippingMethod = 'motorizado' | 'courier' | 'recojo_en_tienda'

export interface OrderItem {
  type: 'product'
  productId: string
  nameSnapshot: string
  unitPrice: number
  quantity: number
  total: number
}

export interface OrderPayment {
  method: PaymentMethod
  bank: string
  receiptUrl: string | null
  reference: string
  verifiedBy: string | null
  verifiedAt: number | null
}

export interface Order {
  id: string

  conversationId: string

  createdAt: number
  updatedAt: number

  currency: string

  customerDNI: string
  customerId: string
  customerName: string
  customerPhone: string

  deliveryAddress: string

  discount: number

  items: Record<string, OrderItem>

  payment: OrderPayment | null

  source: string

  status: OrderStatus

  subtotal: number
  total: number

  assignedTo: string | null
  assignedToName: string | null
  assignedAt: number | null

  deliveryStatus?: DeliveryStatus | null
  shippingMethod?: ShippingMethod | null
  assignedDriver?: string | null

  purchaseNumber?: string
}
