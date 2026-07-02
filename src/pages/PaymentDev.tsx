import { useState } from 'react'
import PaymentVerificationPanel from '@/components/payments/PaymentVerificationPanel'
import { Button } from '@/components/ui/button'
import { Receipt } from 'lucide-react'
import type {
  Order,
  CustomerInfo,
  PaymentVerification,
  AIAnalysis,
  ActivityLogEntry,
} from '@/types/payments'

const mockOrder: Order = {
  id: 'ord_001',
  orderNumber: 'PED-2024-00421',
  products: [
    { name: 'Polo Algodón Premium - Negro', quantity: 2, unitPrice: 59.90, totalPrice: 119.80 },
    { name: 'Jeans Slim Fit - Azul', quantity: 1, unitPrice: 129.90, totalPrice: 129.90 },
    { name: 'Gorra Urban - Beige', quantity: 1, unitPrice: 39.90, totalPrice: 39.90 },
  ],
  totalAmount: 289.60,
  currency: 'PEN',
  paymentMethod: 'yape',
  createdAt: Date.now() - 1000 * 60 * 15,
  status: 'pending',
}

const mockCustomer: CustomerInfo = {
  id: 'cus_001',
  name: 'María García López',
  phone: '+51 999 888 777',
  previousOrders: 12,
  tier: 'vip',
  firstSeenAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
  lastSeenAt: Date.now() - 1000 * 60 * 30,
}

const mockPayment: PaymentVerification = {
  id: 'pay_001',
  orderId: 'ord_001',
  receiptUrl: 'https://placehold.co/600x800/eee/999/png?text=Comprobante+de+Pago',
  amount: 289.60,
  currency: 'PEN',
  referenceNumber: 'YAPE-2847-AA92',
  bank: 'Yape - BCP',
  status: 'pending',
}

const mockAnalysis: AIAnalysis = {
  summary:
    'El cliente solicitó 4 productos y envió comprobante de Yape 15 minutos después. El monto coincide con el total del pedido. El cliente tiene 12 pedidos previos sin incidencias. El número de referencia sigue el formato estándar de Yape.',
  confidenceScore: 92,
  fraudRisk: 'low',
  observations: [
    'Monto transferido coincide exactamente con el total del pedido',
    'Cliente recurrente con historial limpio (12 pedidos)',
    'Comprobante recibido 15 min después del pedido (tiempo normal)',
    'Número de referencia con formato Yape válido',
    'IP de origen coincide con ubicación habitual del cliente',
  ],
  recommendedAction:
    'Aprobar pago. Cliente confiable y documentación en orden.',
}

const mockActivityLog: ActivityLogEntry[] = [
  {
    id: 'log_1',
    action: 'Pago marcado como pendiente de verificación',
    performedBy: 'Sistema',
    performedAt: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'log_2',
    action: 'Asignado a agente para revisión manual',
    performedBy: 'Sistema',
    performedAt: Date.now() - 1000 * 60 * 14,
  },
  {
    id: 'log_3',
    action: 'Análisis IA completado — confianza 92%',
    performedBy: 'AI Assistant',
    performedAt: Date.now() - 1000 * 60 * 13,
  },
]

export default function PaymentDev() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [order, setOrder] = useState<Order>(mockOrder)
  const [analysis, setAnalysis] = useState<AIAnalysis>(mockAnalysis)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Payment Verification Panel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          P&aacute;gina de desarrollo para probar el componente
        </p>
      </div>

      <Button
        size="lg"
        className="gap-2"
        onClick={() => setPanelOpen(true)}
      >
        <Receipt className="h-4 w-4" />
        Abrir panel de verificaci&oacute;n
      </Button>

      <div className="flex flex-wrap gap-4 text-center text-xs text-muted-foreground">
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="font-medium text-foreground">Cliente</p>
          <p>{mockCustomer.name}</p>
          <p className="text-[10px]">{mockCustomer.tier.toUpperCase()}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="font-medium text-foreground">Pedido</p>
          <p>{mockOrder.orderNumber}</p>
          <p className="text-[10px]">S/ {mockOrder.totalAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="font-medium text-foreground">Confianza IA</p>
          <p>{mockAnalysis.confidenceScore}%</p>
          <p className="text-[10px]">Riesgo: {mockAnalysis.fraudRisk}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <button
          className="underline hover:text-foreground"
          onClick={() => {
            setOrder({ ...mockOrder, totalAmount: 999999.99, paymentMethod: 'transferencia' })
            setAnalysis(mockAnalysis)
            setPanelOpen(true)
          }}
        >
          Simular monto alto
        </button>
        <button
          className="underline hover:text-foreground"
          onClick={() => {
            setOrder(mockOrder)
            setAnalysis({ ...mockAnalysis, fraudRisk: 'high', confidenceScore: 23, recommendedAction: 'Rechazar pago. Alta sospecha de fraude — el monto no coincide con el pedido.' })
            setPanelOpen(true)
          }}
        >
          Simular fraude
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg transition-all">
          {toast}
        </div>
      )}

      <PaymentVerificationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        order={order}
        customer={mockCustomer}
        payment={mockPayment}
        analysis={analysis}
        activityLog={mockActivityLog}
        onApprove={() => showToast('✅ Pago aprobado exitosamente')}
        onRequestReceipt={() => showToast('🟡 Solicitud de nuevo comprobante enviada')}
        onReject={() => showToast('❌ Pago rechazado')}
        onReassign={() => showToast('🔄 Caso reasignado a otro agente')}
      />
    </div>
  )
}
