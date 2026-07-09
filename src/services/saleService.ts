import { ref, get, update, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { salesRef, customersRef, subscribeSales as subscribeSalesRaw } from '@/lib/db'
import type { Sale, RTDBCustomer } from '@/types/sales'

export { subscribeSalesRaw as subscribeSales }

export async function fetchSale(
  businessId: string,
  saleId: string
): Promise<Sale | null> {
  const snapshot = await get(ref(db, `sales/${businessId}/${saleId}`))
  if (!snapshot.exists()) return null
  return { id: saleId, ...snapshot.val() } as Sale
}

export async function fetchCustomer(
  businessId: string,
  customerId: string
): Promise<RTDBCustomer | null> {
  const snapshot = await get(ref(db, `customers/${businessId}/${customerId}`))
  if (!snapshot.exists()) return null
  return snapshot.val() as RTDBCustomer
}

export async function approveSale(
  businessId: string,
  saleId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `sales/${businessId}/${saleId}`), {
    status: 'approved',
    updatedAt: now,
    'payment/verifiedBy': agentUid,
    'payment/verifiedAt': now,
    assignedTo: agentUid,
    assignedToName: agentName,
  })
}

export async function rejectSale(
  businessId: string,
  saleId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `sales/${businessId}/${saleId}`), {
    status: 'rejected',
    updatedAt: now,
    'payment/verifiedBy': agentUid,
    'payment/verifiedAt': now,
    assignedTo: agentUid,
    assignedToName: agentName,
  })
}

export async function requestReceipt(
  businessId: string,
  saleId: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `sales/${businessId}/${saleId}`), {
    status: 'pending_payment',
    updatedAt: now,
    payment: null,
    assignedTo: null,
    assignedToName: null,
    assignedAt: null,
  })
}

export async function assignSale(
  businessId: string,
  saleId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `sales/${businessId}/${saleId}`), {
    assignedTo: agentUid,
    assignedToName: agentName,
    assignedAt: now,
    updatedAt: now,
  })
}

export async function seedMockSales(businessId: string): Promise<void> {
  const snapshot = await get(salesRef(businessId))
  if (snapshot.exists() && snapshot.val() && Object.keys(snapshot.val()).length > 0) {
    console.log('[saleService] Sales already exist, skipping seed')
    return
  }

  const now = Date.now()
  const mockSales: Record<string, any> = {
    sale_001: {
      conversationId: 'conv_001',
      customerId: 'cust_001',
      customerPhoneE164: '+51999888777',
      source: 'kiro',
      status: 'pending_verification',
      currency: 'PEN',
      subtotal: 289.60,
      discount: 0,
      total: 289.60,
      items: {
        item_001: {
          type: 'product',
          productId: 'prod_100',
          nameSnapshot: 'Polo Algodón Premium - Negro',
          unitPrice: 59.90,
          quantity: 2,
          total: 119.80,
        },
        item_002: {
          type: 'product',
          productId: 'prod_101',
          nameSnapshot: 'Jeans Slim Fit - Azul',
          unitPrice: 129.90,
          quantity: 1,
          total: 129.90,
        },
        item_003: {
          type: 'product',
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
    sale_002: {
      conversationId: 'conv_002',
      customerId: 'cust_002',
      customerPhoneE164: '+51998765432',
      source: 'kiro',
      status: 'pending_verification',
      currency: 'PEN',
      subtotal: 459.90,
      discount: 0,
      total: 459.90,
      items: {
        item_001: {
          type: 'product',
          productId: 'prod_200',
          nameSnapshot: 'Zapatillas Running Pro - Blanco',
          unitPrice: 299.00,
          quantity: 1,
          total: 299.00,
        },
        item_002: {
          type: 'product',
          productId: 'prod_201',
          nameSnapshot: 'Medias Deportivas - Pack x3',
          unitPrice: 45.90,
          quantity: 1,
          total: 45.90,
        },
        item_003: {
          type: 'product',
          productId: 'prod_202',
          nameSnapshot: 'Short Deportivo - Gris',
          unitPrice: 79.90,
          quantity: 1,
          total: 79.90,
        },
        item_004: {
          type: 'product',
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
    sale_003: {
      conversationId: 'conv_003',
      customerId: 'cust_003',
      customerPhoneE164: '+51997654321',
      source: 'kiro',
      status: 'pending_payment',
      currency: 'PEN',
      subtotal: 189.50,
      discount: 0,
      total: 189.50,
      items: {
        item_001: {
          type: 'product',
          productId: 'prod_300',
          nameSnapshot: 'Set de Sartenes Antiadherentes',
          unitPrice: 189.50,
          quantity: 1,
          total: 189.50,
        },
      },
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      createdAt: now - 1000 * 60 * 120,
      updatedAt: now - 1000 * 60 * 120,
    },
  }

  await set(salesRef(businessId), mockSales)

  const mockCustomers: Record<string, RTDBCustomer> = {
    cust_001: {
      displayName: 'María García López',
      profileName: 'María',
      phone: '51999888777',
      firstSeenAt: now - 1000 * 60 * 60 * 24 * 7,
      lastSeenAt: now,
    },
    cust_002: {
      displayName: 'Carlos Mendoza Ríos',
      profileName: 'Carlos',
      phone: '51998765432',
      firstSeenAt: now - 1000 * 60 * 60 * 24 * 3,
      lastSeenAt: now,
    },
    cust_003: {
      displayName: 'Sofía Torres Huamán',
      profileName: 'Sofía',
      phone: '51997654321',
      firstSeenAt: now - 1000 * 60 * 60 * 24,
      lastSeenAt: now,
    },
  }

  await set(customersRef(businessId), mockCustomers)
  console.log('[saleService] Mock sales and customers seeded successfully')
}
