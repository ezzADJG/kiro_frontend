import type { PaymentMethod } from './payments'

export type SaleStatus =
  | 'pending_payment'
  | 'pending_verification'
  | 'approved'
  | 'rejected'

export interface SaleItem {
  type: 'product' | string
  productId: string
  nameSnapshot: string
  unitPrice: number
  quantity: number
  total: number
}

export interface SalePayment {
  method: PaymentMethod
  receiptUrl: string | null
  reference: string
  bank: string
  verifiedBy: string | null
  verifiedAt: number | null
  notes?: string
}

export interface Sale {
  id: string
  conversationId: string
  customerId: string
  customerPhoneE164: string
  source: string
  status: SaleStatus
  currency: string
  subtotal: number
  discount: number
  total: number
  items: Record<string, SaleItem>
  payment?: SalePayment
  assignedTo?: string | null
  assignedToName?: string | null
  assignedAt?: number | null
  createdAt: number
  updatedAt: number
}

export interface RTDBCustomer {
  displayName: string
  profileName: string
  phone: string
  email?: string | null
  metadata?: Record<string, any>
  firstSeenAt: number
  lastSeenAt: number
}
