import type { PaymentOrder, OrderProduct } from '@/types/payments'
import type { Sale, RTDBCustomer } from '@/types/sales'
import type { Business } from '@/types/business'

function productsFromSaleItems(items: Record<string, any>): OrderProduct[] {
  return Object.values(items).map((item: any) => ({
    name: item.nameSnapshot || '',
    quantity: item.quantity || 0,
    unitPrice: item.unitPrice || 0,
    totalPrice: item.total || 0,
  }))
}

function purchaseNumberFromId(saleId: string): string {
  const short = saleId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `PED-${short}`
}

export function mapSaleToPaymentOrder(
  sale: Sale,
  customer: RTDBCustomer | null,
  businessAddress?: Business['address'] | null,
): PaymentOrder {
  const pm = sale.payment
  const addrParts = businessAddress
    ? [businessAddress.street, businessAddress.district, businessAddress.province].filter(Boolean)
    : ['Dirección no registrada']
  const fallbackAddr = addrParts.join(', ')

  return {
    id: sale.id,
    purchaseNumber: purchaseNumberFromId(sale.id),
    customerName: customer?.displayName || 'Cliente',
    customerDNI: '00000000',
    customerPhone: sale.customerPhoneE164 || '+51 999 999 999',
    deliveryAddress: fallbackAddr,
    products: productsFromSaleItems(sale.items || {}),
    totalAmount: sale.total || 0,
    currency: sale.currency || 'PEN',
    paymentMethod: pm?.method || 'yape',
    receiptUrl: pm?.receiptUrl || 'https://placehold.co/400x600/e0f2fe/0284c7?text=Comprobante',
    paymentReference: pm?.reference || `REF-${sale.id.slice(-4).toUpperCase()}`,
    paymentBank: pm?.bank || 'Yape - BCP',
    createdAt: sale.createdAt || Date.now(),
    status: sale.status,
    conversationId: sale.conversationId,
  }
}
