import type { PaymentVerificationStatus } from '@/types/payments'
import { cn } from '@/lib/utils'

interface PaymentBadgeProps {
  status: PaymentVerificationStatus
}

const config: Record<PaymentVerificationStatus, { label: string; classes: string }> = {
  pending_payment: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  pending_verification: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  approved: { label: 'Pagado', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  rejected: { label: 'Rechazado', classes: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

export default function PaymentBadge({ status }: PaymentBadgeProps) {
  const { label, classes } = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', classes)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'pending_payment' && 'bg-amber-500',
          status === 'pending_verification' && 'bg-amber-500',
          status === 'approved' && 'bg-emerald-500',
          status === 'rejected' && 'bg-red-500',
        )}
      />
      {label}
    </span>
  )
}
