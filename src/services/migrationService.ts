import { ref, get, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { Order, OrderItem } from '@/types/order'
import { generatePurchaseNumber } from '@/services/orderService'

const MIGRATION_KEY = 'kiro_orders_migration_completed'

export function isMigrationCompleted(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true'
}

export function markMigrationCompleted(): void {
  localStorage.setItem(MIGRATION_KEY, 'true')
}

function normalizeStatus(oldStatus: string): Order['status'] {
  switch (oldStatus) {
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'pending_verification':
    case 'pending_payment':
    default:
      return 'pending_review'
  }
}

function normalizeItems(items: Record<string, any>): Record<string, OrderItem> {
  const result: Record<string, OrderItem> = {}
  for (const [key, item] of Object.entries(items)) {
    result[key] = {
      type: 'product',
      productId: item.productId || '',
      nameSnapshot: item.nameSnapshot || '',
      unitPrice: item.unitPrice || 0,
      quantity: item.quantity || 0,
      total: item.total || 0,
    }
  }
  return result
}

function normalizePayment(pm: any): Order['payment'] {
  if (!pm) return null
  return {
    method: pm.method || 'yape',
    bank: pm.bank || '',
    receiptUrl: pm.receiptUrl || null,
    reference: pm.reference || '',
    verifiedBy: pm.verifiedBy || null,
    verifiedAt: pm.verifiedAt || null,
  }
}

function normalizePreorder(id: string, raw: any): Order {
  return {
    id,
    conversationId: raw.conversationId || '',
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
    currency: raw.currency || 'PEN',
    customerDNI: raw.customerDNI || '',
    customerId: raw.customerId || '',
    customerName: raw.customerName || '',
    customerPhone: raw.customerPhone || '',
    deliveryAddress: raw.deliveryAddress || '',
    discount: raw.discount || 0,
    items: normalizeItems(raw.items || {}),
    payment: normalizePayment(raw.payment),
    source: raw.source || 'kiro',
    status: normalizeStatus(raw.status),
    subtotal: raw.subtotal || 0,
    total: raw.total || 0,
    assignedTo: raw.assignedTo || null,
    assignedToName: raw.assignedToName || null,
    assignedAt: raw.assignedAt || null,
    deliveryStatus: null,
    shippingMethod: null,
    assignedDriver: null,
    purchaseNumber: raw.purchaseNumber || generatePurchaseNumber(id),
  }
}

function normalizeSale(id: string, raw: any): Order {
  return {
    id,
    conversationId: raw.conversationId || '',
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
    currency: raw.currency || 'PEN',
    customerDNI: raw.customerDNI || '00000000',
    customerId: raw.customerId || '',
    customerName: raw.customerName || '',
    customerPhone: raw.customerPhoneE164 || raw.customerPhone || '',
    deliveryAddress: raw.deliveryAddress || '',
    discount: raw.discount || 0,
    items: normalizeItems(raw.items || {}),
    payment: normalizePayment(raw.payment),
    source: raw.source || 'kiro',
    status: normalizeStatus(raw.status),
    subtotal: raw.subtotal || 0,
    total: raw.total || 0,
    assignedTo: raw.assignedTo || null,
    assignedToName: raw.assignedToName || null,
    assignedAt: raw.assignedAt || null,
    deliveryStatus: 'received',
    shippingMethod: raw.shippingMethod || null,
    assignedDriver: raw.assignedDriver || null,
    purchaseNumber: raw.purchaseNumber || generatePurchaseNumber(id),
  }
}

export async function migrateOrders(businessId: string): Promise<{ migrated: number; skipped: number }> {
  if (isMigrationCompleted()) {
    return { migrated: 0, skipped: 0 }
  }

  const ordersSnapshot = await get(ref(db, `orders/${businessId}`))
  if (ordersSnapshot.exists() && ordersSnapshot.val() && Object.keys(ordersSnapshot.val()).length > 0) {
    markMigrationCompleted()
    return { migrated: 0, skipped: 0 }
  }

  const [preordersSnap, salesSnap] = await Promise.all([
    get(ref(db, `preorders/${businessId}`)),
    get(ref(db, `sales/${businessId}`)),
  ])

  const preorders = preordersSnap.exists() ? preordersSnap.val() : {}
  const sales = salesSnap.exists() ? salesSnap.val() : {}

  const migratedOrders: Record<string, any> = {}
  let migrated = 0

  for (const [id, raw] of Object.entries(sales) as [string, any][]) {
    migratedOrders[id] = normalizeSale(id, raw)
    migrated++
  }

  for (const [id, raw] of Object.entries(preorders) as [string, any][]) {
    if (sales[id]) continue
    migratedOrders[id] = normalizePreorder(id, raw)
    migrated++
  }

  if (migrated > 0) {
    await set(ref(db, `orders/${businessId}`), migratedOrders)
  }

  markMigrationCompleted()
  return { migrated, skipped: 0 }
}
