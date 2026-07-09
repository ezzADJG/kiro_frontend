import type { PaymentMethod } from './payments'

export type PreorderStatus = 'pending_payment' | 'pending_verification' | 'approved' | 'rejected'

export interface PreorderItem {
  productId: string
  nameSnapshot: string
  unitPrice: number
  quantity: number
  total: number
}

export interface PreorderPayment {
  method: PaymentMethod
  receiptUrl: string | null
  reference: string
  bank: string
  verifiedBy: string | null
  verifiedAt: number | null
}

export interface Preorder {
  id: string
  conversationId: string
  customerId: string
  customerName: string
  customerPhone: string
  customerDNI: string
  deliveryAddress: string
  source: string
  status: PreorderStatus
  currency: string
  subtotal: number
  discount: number
  total: number
  items: Record<string, PreorderItem>
  payment?: PreorderPayment | null
  assignedTo: string | null
  assignedToName: string | null
  assignedAt: number | null
  createdAt: number
  updatedAt: number
}
