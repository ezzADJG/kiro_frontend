import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  Receipt,
  User,
  Package,
  CreditCard,
  Calendar,
  Building2,
  Banknote,
  FileText,
  Star,
  RotateCcw,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Loader2,
  Clock,
  TrendingUp,
} from 'lucide-react'
import type {
  Order,
  CustomerInfo,
  PaymentVerification,
  AIAnalysis,
  ActivityLogEntry,
} from '@/types/payments'
import {
  PAYMENT_METHOD_LABELS,
  CUSTOMER_TIER_LABELS,
  PAYMENT_STATUS_LABELS,
  FRAUD_RISK_LABELS,
} from '@/types/payments'

interface PaymentVerificationPanelProps {
  open: boolean
  onClose: () => void
  order: Order | null
  customer: CustomerInfo | null
  payment: PaymentVerification | null
  analysis: AIAnalysis | null
  activityLog: ActivityLogEntry[]
  loading?: boolean
  error?: string | null
  onApprove: () => void
  onRequestReceipt: () => void
  onReject: () => void
  onReassign: () => void
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon?: React.ElementType
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white p-5 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md dark:bg-neutral-950',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | ReactNode
  icon?: React.ElementType
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="text-right text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="my-2 border-t border-border" />
}

function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'vip'
}) {
  const styles = {
    default: 'bg-secondary text-secondary-foreground ring-1 ring-foreground/5',
    success:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-800',
    warning:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-800',
    danger:
      'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-800',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800',
    vip: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 ring-1 ring-amber-200 dark:from-amber-950 dark:to-yellow-950 dark:text-amber-400 dark:ring-amber-800',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        styles[variant],
      )}
    >
      {children}
    </span>
  )
}

function StatusDot({
  status,
}: {
  status: 'verified' | 'pending' | 'rejected' | 'disputed'
}) {
  const colors = {
    verified: 'bg-emerald-500',
    pending: 'bg-amber-500',
    rejected: 'bg-red-500',
    disputed: 'bg-orange-500',
  }

  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', colors[status])}
    />
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

export default function PaymentVerificationPanel({
  open,
  onClose,
  order,
  customer,
  payment,
  analysis,
  activityLog,
  loading = false,
  error = null,
  onApprove,
  onRequestReceipt,
  onReject,
  onReassign,
}: PaymentVerificationPanelProps) {
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAction = async (
    action: string,
    callback: () => void | Promise<void>,
  ) => {
    setActionLoading(action)
    try {
      await callback()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-all duration-300',
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-2xl ring-1 ring-foreground/5 transition-all duration-300 ease-out dark:bg-neutral-950',
          open
            ? 'translate-x-0 opacity-100'
            : 'translate-x-8 opacity-0 pointer-events-none',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Verificaci&oacute;n de pago
              </h2>
              {order && (
                <p className="text-xs text-muted-foreground">
                  {order.orderNumber}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {order && <OrderSection order={order} />}
              {customer && <CustomerSection customer={customer} />}
              {payment && <PaymentSection payment={payment} />}
              {analysis && <AnalysisSection analysis={analysis} />}
              <NotesSection notes={notes} onNotesChange={setNotes} />
              {activityLog.length > 0 && (
                <ActivitySection log={activityLog} />
              )}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="space-y-2 border-t border-border p-5">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                onClick={() => handleAction('approve', onApprove)}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'approve' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Aprobar pago
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
                onClick={() => handleAction('receipt', onRequestReceipt)}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'receipt' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Solicitar comprobante
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                onClick={() => handleAction('reject', onReject)}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'reject' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Rechazar pago
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => handleAction('reassign', onReassign)}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'reassign' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5" />
                )}
                Reasignar
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function OrderSection({ order }: { order: Order }) {
  return (
    <SectionCard title="Resumen del pedido" icon={Package}>
      <InfoRow
        label="Pedido"
        value={
          <span className="font-mono text-xs">{order.orderNumber}</span>
        }
      />
      <Divider />
      <div className="space-y-1.5">
        {order.products.map((product, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-secondary/50 px-2.5 py-1.5"
          >
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-foreground">{product.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>x{product.quantity}</span>
              <span className="font-medium text-foreground">
                {formatCurrency(product.totalPrice, order.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Divider />
      <InfoRow
        label="Total"
        value={
          <span className="text-base font-semibold text-foreground">
            {formatCurrency(order.totalAmount, order.currency)}
          </span>
        }
      />
      <InfoRow
        label="M&eacute;todo de pago"
        value={
          <Badge variant="info">
            <CreditCard className="h-3 w-3" />
            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          </Badge>
        }
        icon={Banknote}
      />
      <InfoRow
        label="Fecha"
        value={formatDate(order.createdAt)}
        icon={Calendar}
      />
    </SectionCard>
  )
}

function CustomerSection({ customer }: { customer: CustomerInfo }) {
  return (
    <SectionCard title="Cliente" icon={User}>
      <InfoRow
        label="Nombre"
        value={
          <span className="font-medium">{customer.name}</span>
        }
      />
      <InfoRow
        label="Tel&eacute;fono"
        value={
          <span className="font-mono text-xs">{customer.phone}</span>
        }
      />
      <Divider />
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Pedidos anteriores
        </span>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {customer.previousOrders}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Estado</span>
        <Badge variant={customer.tier === 'vip' ? 'vip' : customer.tier === 'returning' ? 'info' : 'success'}>
          {customer.tier === 'vip' && <Star className="h-3 w-3" />}
          {CUSTOMER_TIER_LABELS[customer.tier]}
        </Badge>
      </div>
    </SectionCard>
  )
}

function PaymentSection({ payment }: { payment: PaymentVerification }) {
  const statusVariant =
    payment.status === 'verified'
      ? 'success'
      : payment.status === 'rejected'
        ? 'danger'
        : payment.status === 'disputed'
          ? 'warning'
          : 'warning'

  const [showReceipt, setShowReceipt] = useState(false)

  return (
    <SectionCard title="Verificaci&oacute;n de pago" icon={CreditCard}>
      {payment.receiptUrl && (
        <div className="mb-4">
          <div
            className="group relative flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
            onClick={() => setShowReceipt(!showReceipt)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white ring-1 ring-foreground/5 dark:bg-neutral-900">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">
                Comprobante de pago
              </p>
              <p className="text-xs text-muted-foreground">
                Haz clic para {showReceipt ? 'ocultar' : 'previsualizar'}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          {showReceipt && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border">
              <img
                src={payment.receiptUrl}
                alt="Comprobante de pago"
                className="w-full object-contain"
              />
            </div>
          )}
        </div>
      )}

      <InfoRow
        label="Monto"
        value={
          <span className="text-base font-semibold text-foreground">
            {formatCurrency(payment.amount, payment.currency)}
          </span>
        }
        icon={Banknote}
      />
      <InfoRow
        label="Referencia"
        value={
          <span className="font-mono text-xs">{payment.referenceNumber}</span>
        }
      />
      <InfoRow
        label="Banco / Plataforma"
        value={payment.bank}
        icon={Building2}
      />
      <Divider />
      <InfoRow
        label="Estado"
        value={
          <Badge variant={statusVariant}>
            <StatusDot status={payment.status} />
            {PAYMENT_STATUS_LABELS[payment.status]}
          </Badge>
        }
      />
      {payment.verifiedBy && (
        <InfoRow
          label="Verificado por"
          value={payment.verifiedBy}
        />
      )}
      {payment.verifiedAt && (
        <InfoRow
          label="Fecha verificaci&oacute;n"
          value={formatDate(payment.verifiedAt)}
        />
      )}
    </SectionCard>
  )
}

function AnalysisSection({ analysis }: { analysis: AIAnalysis }) {
  const riskVariant =
    analysis.fraudRisk === 'low'
      ? 'success'
      : analysis.fraudRisk === 'medium'
        ? 'warning'
        : 'danger'

  const RiskIcon =
    analysis.fraudRisk === 'low'
      ? Shield
      : ShieldAlert

  return (
    <SectionCard title="An&aacute;lisis IA" icon={TrendingUp}>
      <div className="rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
          <MessageSquare className="h-3 w-3" />
          Resumen de la conversaci&oacute;n
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          {analysis.summary}
        </p>
      </div>

      <Divider />

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Confianza
            </span>
            <span className="text-xs font-medium text-foreground">
              {analysis.confidenceScore}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                analysis.confidenceScore >= 80
                  ? 'bg-emerald-500'
                  : analysis.confidenceScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500',
              )}
              style={{ width: `${analysis.confidenceScore}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Riesgo de fraude
          </span>
          <Badge variant={riskVariant}>
            <RiskIcon className="h-3 w-3" />
            {FRAUD_RISK_LABELS[analysis.fraudRisk]}
          </Badge>
        </div>
      </div>

      <Divider />

      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">
          Observaciones autom&aacute;ticas
        </span>
        <ul className="space-y-1">
          {analysis.observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              {obs}
            </li>
          ))}
        </ul>
      </div>

      <Divider />

      <div className="rounded-lg bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
        <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Acci&oacute;n recomendada
        </div>
        <p className="text-sm font-medium text-foreground">
          {analysis.recommendedAction}
        </p>
      </div>
    </SectionCard>
  )
}

function NotesSection({
  notes,
  onNotesChange,
}: {
  notes: string
  onNotesChange: (value: string) => void
}) {
  return (
    <SectionCard title="Notas internas" icon={FileText}>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="A&ntilde;ade notas internas sobre esta verificaci&oacute;n..."
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-secondary/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:border-blue-600 dark:focus:ring-blue-600"
      />
      {notes.length > 0 && (
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {notes.length} caracteres
        </p>
      )}
    </SectionCard>
  )
}

function ActivitySection({ log }: { log: ActivityLogEntry[] }) {
  return (
    <SectionCard title="Actividad" icon={Clock}>
      <div className="relative space-y-0">
        {log.map((entry, i) => (
          <div key={entry.id} className="relative flex gap-3 pb-4 pl-4 last:pb-0">
            {i < log.length - 1 && (
              <div className="absolute left-[5px] top-3 h-full w-px bg-border" />
            )}
            <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-blue-500 bg-white dark:bg-neutral-950" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{entry.action}</p>
              <p className="text-xs text-muted-foreground">
                {entry.performedBy} &middot;{' '}
                {formatDate(entry.performedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl bg-white p-5 ring-1 ring-foreground/5 dark:bg-neutral-950"
        >
          <div className="mb-4 h-3 w-24 rounded bg-secondary" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-4 w-3/4 rounded bg-secondary" />
            <div className="h-4 w-1/2 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  )
}
