import type { PaymentOrder, OrderProduct, DeliveryStatus } from '@/types/payments'
import type { DeliveryOrder, ShalomOrderPayload, ShalomTracking, OlvaTracking } from '@/types/payments'
import type { Order } from '@/types/order'
import type { Transportista } from '@/types/shipping'
import { generatePurchaseNumber } from '@/services/orderService'

function productsFromItems(items: Record<string, any>): OrderProduct[] {
  return Object.values(items).map((item: any) => ({
    name: item.nameSnapshot || '',
    quantity: item.quantity || 0,
    unitPrice: item.unitPrice || 0,
    totalPrice: item.total || 0,
  }))
}

export function mapOrderToPaymentOrder(order: Order): PaymentOrder {
  const pm = order.payment

  return {
    id: order.id,
    purchaseNumber: order.purchaseNumber || generatePurchaseNumber(order.id),
    customerName: order.customerName,
    customerDNI: order.customerDNI,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    products: productsFromItems(order.items || {}),
    totalAmount: order.total || 0,
    currency: order.currency || 'PEN',
    paymentMethod: pm?.method || 'yape',
    receiptUrl: pm?.receiptUrl || '',
    paymentReference: pm?.reference || '',
    paymentBank: pm?.bank || '',
    createdAt: order.createdAt || Date.now(),
    status: order.status,
    conversationId: order.conversationId,
  }
}

export function mapOrderToDeliveryOrder(
  order: Order,
  shalomData?: ShalomOrderPayload | null,
  shalomTracking?: ShalomTracking | null,
  transportista?: Transportista | null,
  olvaTracking?: OlvaTracking | null,
): DeliveryOrder {
  return {
    id: order.id,
    paymentOrderId: order.id,
    purchaseNumber: order.purchaseNumber || generatePurchaseNumber(order.id),
    customerName: order.customerName,
    customerDNI: order.customerDNI,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    products: productsFromItems(order.items || {}),
    totalAmount: order.total || 0,
    currency: order.currency || 'PEN',
    paymentMethod: order.payment?.method || 'yape',
    deliveryStatus: (order.deliveryStatus as DeliveryStatus) || null,
    shippingMethod: order.shippingMethod || null,
    transportista: transportista || null,
    assignedDriver: order.assignedDriver || null,
    shalomData: shalomData || null,
    shalomTracking: shalomTracking || null,
    olvaTracking: olvaTracking || null,
    approvedBy: order.assignedToName || order.payment?.verifiedBy || '—',
    approvedAt: order.payment?.verifiedAt || order.assignedAt || order.createdAt,
  }
}
