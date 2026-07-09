import { ref, get, update, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { sendPaymentStatusMessage } from '@/services/chatApi'
import type { Preorder, PreorderItem } from '@/types/preorders'
import type { SaleItem } from '@/types/sales'

function mapItemsToSaleItems(items: Record<string, PreorderItem>): Record<string, SaleItem> {
  const result: Record<string, SaleItem> = {}
  for (const [key, item] of Object.entries(items)) {
    result[key] = {
      type: 'product',
      productId: item.productId,
      nameSnapshot: item.nameSnapshot,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: item.total,
    }
  }
  return result
}

function purchaseNumberFromId(preorderId: string): string {
  const short = preorderId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `PED-${short}`
}

export async function fetchPreorder(
  businessId: string,
  preorderId: string
): Promise<Preorder | null> {
  const snapshot = await get(ref(db, `preorders/${businessId}/${preorderId}`))
  if (!snapshot.exists()) return null
  return { id: preorderId, ...snapshot.val() } as Preorder
}

export async function approvePreorder(
  businessId: string,
  preorderId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()

  const preorderSnap = await get(ref(db, `preorders/${businessId}/${preorderId}`))
  if (!preorderSnap.exists()) throw new Error('Preorder not found')
  const preorder = preorderSnap.val()

  await update(ref(db, `preorders/${businessId}/${preorderId}`), {
    status: 'approved',
    updatedAt: now,
    'payment/verifiedBy': agentUid,
    'payment/verifiedAt': now,
    assignedTo: agentUid,
    assignedToName: agentName,
  })

  const saleData = {
    ...preorder,
    status: 'approved',
    updatedAt: now,
    payment: {
      ...(preorder.payment || {}),
      verifiedBy: agentUid,
      verifiedAt: now,
    },
    assignedTo: agentUid,
    assignedToName: agentName,
    assignedAt: preorder.assignedAt || now,
    items: mapItemsToSaleItems(preorder.items || {}),
  }
  await set(ref(db, `sales/${businessId}/${preorderId}`), saleData)

  if (preorder.conversationId) {
    sendPaymentStatusMessage(
      businessId,
      preorder.conversationId,
      'approved',
      purchaseNumberFromId(preorderId),
    ).catch(() => {})
  }
}

export async function rejectPreorder(
  businessId: string,
  preorderId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `preorders/${businessId}/${preorderId}`), {
    status: 'rejected',
    updatedAt: now,
    'payment/verifiedBy': agentUid,
    'payment/verifiedAt': now,
    assignedTo: agentUid,
    assignedToName: agentName,
  })

  const preorder = await fetchPreorder(businessId, preorderId)
  if (preorder?.conversationId) {
    sendPaymentStatusMessage(
      businessId,
      preorder.conversationId,
      'rejected',
      purchaseNumberFromId(preorderId),
    ).catch(() => {})
  }
}

export async function requestPreorderReceipt(
  businessId: string,
  preorderId: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `preorders/${businessId}/${preorderId}`), {
    status: 'pending_payment',
    updatedAt: now,
    payment: null,
    assignedTo: null,
    assignedToName: null,
    assignedAt: null,
  })
}

export async function assignPreorder(
  businessId: string,
  preorderId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `preorders/${businessId}/${preorderId}`), {
    assignedTo: agentUid,
    assignedToName: agentName,
    assignedAt: now,
    updatedAt: now,
  })
}

export async function seedMockPreorders(businessId: string): Promise<void> {
  const snapshot = await get(ref(db, `preorders/${businessId}`))
  if (snapshot.exists() && snapshot.val() && Object.keys(snapshot.val()).length > 0) {
    console.log('[preorderService] Preorders already exist, skipping seed')
    return
  }

  const now = Date.now()
  const mockPreorders: Record<string, any> = {
    pre_001: {
      conversationId: 'conv_001',
      customerId: 'cust_001',
      customerName: 'María García López',
      customerPhone: '+51999888777',
      customerDNI: '12345678',
      deliveryAddress: 'Av. Los Olivos 123, San Juan de Lurigancho, Lima',
      source: 'kiro',
      status: 'pending_verification',
      currency: 'PEN',
      subtotal: 289.60,
      discount: 0,
      total: 289.60,
      items: {
        item_001: {
          productId: 'prod_100',
          nameSnapshot: 'Polo Algodón Premium - Negro',
          unitPrice: 59.90,
          quantity: 2,
          total: 119.80,
        },
        item_002: {
          productId: 'prod_101',
          nameSnapshot: 'Jeans Slim Fit - Azul',
          unitPrice: 129.90,
          quantity: 1,
          total: 129.90,
        },
        item_003: {
          productId: 'prod_102',
          nameSnapshot: 'Gorra Urban - Beige',
          unitPrice: 39.90,
          quantity: 1,
          total: 39.90,
        },
      },
      payment: {
        method: 'yape',
        receiptUrl: 'https://placehold.co/400x600/e0f2fe/0284c7?text=Comprobante+Yape',
        reference: 'YAPE-2847-AA92',
        bank: 'Yape - BCP',
        verifiedBy: null,
        verifiedAt: null,
      },
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      createdAt: now - 1000 * 60 * 15,
      updatedAt: now - 1000 * 60 * 15,
    },
    pre_002: {
      conversationId: 'conv_002',
      customerId: 'cust_002',
      customerName: 'Carlos Mendoza Ríos',
      customerPhone: '+51998765432',
      customerDNI: '87654321',
      deliveryAddress: 'Jr. Las Paltas 456, Miraflores, Lima',
      source: 'kiro',
      status: 'pending_verification',
      currency: 'PEN',
      subtotal: 459.90,
      discount: 0,
      total: 459.90,
      items: {
        item_001: {
          productId: 'prod_200',
          nameSnapshot: 'Zapatillas Running Pro - Blanco',
          unitPrice: 299.00,
          quantity: 1,
          total: 299.00,
        },
        item_002: {
          productId: 'prod_201',
          nameSnapshot: 'Medias Deportivas - Pack x3',
          unitPrice: 45.90,
          quantity: 1,
          total: 45.90,
        },
        item_003: {
          productId: 'prod_202',
          nameSnapshot: 'Short Deportivo - Gris',
          unitPrice: 79.90,
          quantity: 1,
          total: 79.90,
        },
        item_004: {
          productId: 'prod_203',
          nameSnapshot: 'Botella Térmica 1L',
          unitPrice: 35.10,
          quantity: 1,
          total: 35.10,
        },
      },
      payment: {
        method: 'plin',
        receiptUrl: 'https://placehold.co/400x600/e0f2fe/0284c7?text=Comprobante+Plin',
        reference: 'PLIN-9B84-MK71',
        bank: 'Plin - BBVA',
        verifiedBy: null,
        verifiedAt: null,
      },
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      createdAt: now - 1000 * 60 * 42,
      updatedAt: now - 1000 * 60 * 42,
    },
    pre_003: {
      conversationId: 'conv_003',
      customerId: 'cust_003',
      customerName: 'Sofía Torres Huamán',
      customerPhone: '+51997654321',
      customerDNI: '56781234',
      deliveryAddress: 'Calle Los Claveles 789, Arequipa',
      source: 'kiro',
      status: 'pending_payment',
      currency: 'PEN',
      subtotal: 189.50,
      discount: 0,
      total: 189.50,
      items: {
        item_001: {
          productId: 'prod_300',
          nameSnapshot: 'Set de Sartenes Antiadherentes',
          unitPrice: 189.50,
          quantity: 1,
          total: 189.50,
        },
      },
      payment: null,
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      createdAt: now - 1000 * 60 * 120,
      updatedAt: now - 1000 * 60 * 120,
    },
  }

  await set(ref(db, `preorders/${businessId}`), mockPreorders)
  console.log('[preorderService] Mock preorders seeded successfully')
}
