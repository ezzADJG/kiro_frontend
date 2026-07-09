import type { PaymentOrder, OrderProduct } from '@/types/payments'
import type { Preorder } from '@/types/preorders'

function productsFromItems(items: Record<string, any>): OrderProduct[] {
  return Object.values(items).map((item: any) => ({
    name: item.nameSnapshot || '',
    quantity: item.quantity || 0,
    unitPrice: item.unitPrice || 0,
    totalPrice: item.total || 0,
  }))
}

function purchaseNumberFromId(preorderId: string): string {
  const short = preorderId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `PED-${short}`
}

export function mapPreorderToPaymentOrder(preorder: Preorder): PaymentOrder {
  const pm = preorder.payment

  return {
    id: preorder.id,
    purchaseNumber: purchaseNumberFromId(preorder.id),
    customerName: preorder.customerName,
    customerDNI: preorder.customerDNI,
    customerPhone: preorder.customerPhone,
    deliveryAddress: preorder.deliveryAddress,
    products: productsFromItems(preorder.items || {}),
    totalAmount: preorder.total || 0,
    currency: preorder.currency || 'PEN',
    paymentMethod: pm?.method || 'yape',
    receiptUrl: pm?.receiptUrl || 'https://placehold.co/400x600/e0f2fe/0284c7?text=Comprobante',
    paymentReference: pm?.reference || `REF-${preorder.id.slice(-4).toUpperCase()}`,
    paymentBank: pm?.bank || 'Yape - BCP',
    createdAt: preorder.createdAt || Date.now(),
    status: preorder.status,
    conversationId: preorder.conversationId,
  }
}
