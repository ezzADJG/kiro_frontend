import { ref, get, update, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { sendPaymentStatusMessage } from '@/services/chatApi'
import type { Order, OrderItem } from '@/types/order'

export function generateOrderId(): string {
  return crypto.randomUUID()
}

export async function fetchOrder(
  businessId: string,
  orderId: string
): Promise<Order | null> {
  const snapshot = await get(ref(db, `orders/${businessId}/${orderId}`))
  if (!snapshot.exists()) return null
  return { id: orderId, ...snapshot.val() } as Order
}

export async function createOrder(
  businessId: string,
  data: Omit<Order, 'id'>
): Promise<string> {
  const orderId = generateOrderId()
  await set(ref(db, `orders/${businessId}/${orderId}`), {
    ...data,
    id: orderId,
  })
  return orderId
}

export async function approveOrder(
  businessId: string,
  orderId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()

  const orderSnap = await get(ref(db, `orders/${businessId}/${orderId}`))
  if (!orderSnap.exists()) throw new Error('Order not found')

  await update(ref(db, `orders/${businessId}/${orderId}`), {
    status: 'approved',
    updatedAt: now,
    'payment/verifiedBy': agentUid,
    'payment/verifiedAt': now,
    assignedTo: agentUid,
    assignedToName: agentName,
    assignedAt: now,
    deliveryStatus: 'received',
  })

  const order = orderSnap.val() as Order
  if (order.conversationId) {
    const purchaseNumber = order.purchaseNumber || generatePurchaseNumber(orderId)
    sendPaymentStatusMessage(
      businessId,
      order.conversationId,
      'approved',
      purchaseNumber,
    ).catch(() => {})
  }
}

export async function rejectOrder(
  businessId: string,
  orderId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()

  const orderSnap = await get(ref(db, `orders/${businessId}/${orderId}`))
  if (!orderSnap.exists()) throw new Error('Order not found')

  await update(ref(db, `orders/${businessId}/${orderId}`), {
    status: 'rejected',
    updatedAt: now,
    'payment/verifiedBy': agentUid,
    'payment/verifiedAt': now,
    assignedTo: agentUid,
    assignedToName: agentName,
  })

  const order = orderSnap.val() as Order
  if (order.conversationId) {
    const purchaseNumber = order.purchaseNumber || generatePurchaseNumber(orderId)
    sendPaymentStatusMessage(
      businessId,
      order.conversationId,
      'rejected',
      purchaseNumber,
    ).catch(() => {})
  }
}

export async function assignOrder(
  businessId: string,
  orderId: string,
  agentUid: string,
  agentName: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `orders/${businessId}/${orderId}`), {
    assignedTo: agentUid,
    assignedToName: agentName,
    assignedAt: now,
    updatedAt: now,
  })
}

export async function requestOrderReceipt(
  businessId: string,
  orderId: string
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `orders/${businessId}/${orderId}`), {
    status: 'pending_review',
    updatedAt: now,
    payment: null,
    assignedTo: null,
    assignedToName: null,
    assignedAt: null,
  })
}

export async function updateOrderDeliveryStatus(
  businessId: string,
  orderId: string,
  deliveryStatus: Order['deliveryStatus']
): Promise<void> {
  const now = Date.now()
  await update(ref(db, `orders/${businessId}/${orderId}`), {
    deliveryStatus,
    updatedAt: now,
  })
}

export async function updateOrderShipping(
  businessId: string,
  orderId: string,
  shippingMethod: Order['shippingMethod'],
  assignedDriver?: string | null
): Promise<void> {
  const now = Date.now()
  const updateData: Record<string, any> = {
    shippingMethod,
    updatedAt: now,
  }
  if (assignedDriver !== undefined) {
    updateData.assignedDriver = assignedDriver
  }
  await update(ref(db, `orders/${businessId}/${orderId}`), updateData)
}

export function generatePurchaseNumber(id: string): string {
  const short = id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `PED-${short}`
}

export async function seedMockOrders(businessId: string): Promise<void> {
  const snapshot = await get(ref(db, `orders/${businessId}`))
  if (snapshot.exists() && snapshot.val() && Object.keys(snapshot.val()).length > 0) {
    return
  }

  const now = Date.now()

  const id1 = generateOrderId()
  const id2 = generateOrderId()
  const id3 = generateOrderId()
  const id4 = generateOrderId()
  const id5 = generateOrderId()

  const mockOrders: Record<string, any> = {
    [id1]: {
      conversationId: 'conv_001',
      customerId: 'cust_001',
      customerName: 'María García López',
      customerPhone: '+51999888777',
      customerDNI: '48293715',
      deliveryAddress: 'Av. Los Olivos 123, San Juan de Lurigancho, Lima',
      source: 'kiro',
      status: 'pending_review',
      currency: 'PEN',
      subtotal: 289.60,
      discount: 0,
      total: 289.60,
      purchaseNumber: generatePurchaseNumber(id1),
      items: {
        [`item_${id1.slice(0, 8)}_001`]: {
          type: 'product',
          productId: 'prod_100',
          nameSnapshot: 'Polo Algodón Premium - Negro',
          unitPrice: 59.90,
          quantity: 2,
          total: 119.80,
        },
        [`item_${id1.slice(0, 8)}_002`]: {
          type: 'product',
          productId: 'prod_101',
          nameSnapshot: 'Jeans Slim Fit - Azul',
          unitPrice: 129.90,
          quantity: 1,
          total: 129.90,
        },
        [`item_${id1.slice(0, 8)}_003`]: {
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
      deliveryStatus: null,
      shippingMethod: null,
      assignedDriver: null,
      createdAt: now - 1000 * 60 * 15,
      updatedAt: now - 1000 * 60 * 15,
    },
    [id2]: {
      conversationId: 'conv_002',
      customerId: 'cust_002',
      customerName: 'Carlos Mendoza Ríos',
      customerPhone: '+51998765432',
      customerDNI: '45321876',
      deliveryAddress: 'Jr. Las Paltas 456, Miraflores, Lima',
      source: 'kiro',
      status: 'pending_review',
      currency: 'PEN',
      subtotal: 189.50,
      discount: 0,
      total: 189.50,
      purchaseNumber: generatePurchaseNumber(id2),
      items: {
        [`item_${id2.slice(0, 8)}_001`]: {
          type: 'product',
          productId: 'prod_200',
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
      deliveryStatus: null,
      shippingMethod: null,
      assignedDriver: null,
      createdAt: now - 1000 * 60 * 30,
      updatedAt: now - 1000 * 60 * 30,
    },
    [id3]: {
      conversationId: 'conv_003',
      customerId: 'cust_003',
      customerName: 'Sofía Torres Huamán',
      customerPhone: '+51997654321',
      customerDNI: '56781234',
      deliveryAddress: 'Calle Los Claveles 789, Arequipa',
      source: 'kiro',
      status: 'approved',
      currency: 'PEN',
      subtotal: 324.80,
      discount: 0,
      total: 324.80,
      purchaseNumber: generatePurchaseNumber(id3),
      items: {
        [`item_${id3.slice(0, 8)}_001`]: {
          type: 'product',
          productId: 'prod_300',
          nameSnapshot: 'Café Artesanal 1kg - Tarwi',
          unitPrice: 42.90,
          quantity: 3,
          total: 128.70,
        },
        [`item_${id3.slice(0, 8)}_002`]: {
          type: 'product',
          productId: 'prod_301',
          nameSnapshot: 'Chocolate Orgánico 200g',
          unitPrice: 18.90,
          quantity: 4,
          total: 75.60,
        },
      },
      payment: {
        method: 'yape',
        receiptUrl: 'https://placehold.co/400x600/e0f2fe/0284c7?text=Comprobante+Yape',
        reference: 'YAPE-39F1-CB22',
        bank: 'Yape - BCP',
        verifiedBy: 'agent_001',
        verifiedAt: now - 1000 * 60 * 120,
      },
      assignedTo: 'agent_001',
      assignedToName: 'Agente Demo',
      assignedAt: now - 1000 * 60 * 120,
      deliveryStatus: 'received',
      shippingMethod: null,
      assignedDriver: null,
      createdAt: now - 1000 * 60 * 180,
      updatedAt: now - 1000 * 60 * 120,
    },
    [id4]: {
      conversationId: 'conv_004',
      customerId: 'cust_004',
      customerName: 'Diego Ramírez Paredes',
      customerPhone: '+51996543210',
      customerDNI: '47283019',
      deliveryAddress: 'Av. Javier Prado 2500, San Isidro, Lima',
      source: 'kiro',
      status: 'approved',
      currency: 'PEN',
      subtotal: 1249.00,
      discount: 0,
      total: 1249.00,
      purchaseNumber: generatePurchaseNumber(id4),
      items: {
        [`item_${id4.slice(0, 8)}_001`]: {
          type: 'product',
          productId: 'prod_400',
          nameSnapshot: 'Laptop Pro 15" - 16GB RAM',
          unitPrice: 1249.00,
          quantity: 1,
          total: 1249.00,
        },
      },
      payment: {
        method: 'transferencia',
        receiptUrl: 'https://placehold.co/400x600/fef3c7/d97706?text=Transferencia+BCP',
        reference: 'TRA-2024-88392',
        bank: 'BCP - Cuenta de Ahorros',
        verifiedBy: 'agent_002',
        verifiedAt: now - 1000 * 60 * 240,
      },
      assignedTo: 'agent_002',
      assignedToName: 'Supervisor Ventas',
      assignedAt: now - 1000 * 60 * 240,
      deliveryStatus: 'in_transit',
      shippingMethod: 'motorizado',
      assignedDriver: 'Juan Pérez López',
      createdAt: now - 1000 * 60 * 300,
      updatedAt: now - 1000 * 60 * 240,
    },
    [id5]: {
      conversationId: 'conv_005',
      customerId: 'cust_005',
      customerName: 'Valentina Castro Meza',
      customerPhone: '+51995432109',
      customerDNI: '49567123',
      deliveryAddress: 'Jr. Carabaya 456, Cercado de Lima, Lima',
      source: 'kiro',
      status: 'rejected',
      currency: 'PEN',
      subtotal: 89.90,
      discount: 0,
      total: 89.90,
      purchaseNumber: generatePurchaseNumber(id5),
      items: {
        [`item_${id5.slice(0, 8)}_001`]: {
          type: 'product',
          productId: 'prod_500',
          nameSnapshot: 'Crema Facial Hidratante 50ml',
          unitPrice: 29.95,
          quantity: 2,
          total: 59.90,
        },
        [`item_${id5.slice(0, 8)}_002`]: {
          type: 'product',
          productId: 'prod_501',
          nameSnapshot: 'Protector Solar SPF50',
          unitPrice: 30.00,
          quantity: 1,
          total: 30.00,
        },
      },
      payment: {
        method: 'tarjeta',
        receiptUrl: 'https://placehold.co/400x600/dbeafe/2563eb?text=Visa+****+4829',
        reference: 'VISA-2411-XXXX-4829',
        bank: 'Visa - Interbank',
        verifiedBy: 'agent_001',
        verifiedAt: now - 1000 * 60 * 400,
      },
      assignedTo: 'agent_001',
      assignedToName: 'Agente Demo',
      assignedAt: now - 1000 * 60 * 400,
      deliveryStatus: null,
      shippingMethod: null,
      assignedDriver: null,
      createdAt: now - 1000 * 60 * 500,
      updatedAt: now - 1000 * 60 * 400,
    },
  }

  await set(ref(db, `orders/${businessId}`), mockOrders)
}
