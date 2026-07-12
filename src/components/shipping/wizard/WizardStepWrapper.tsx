import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WizardStepWrapperProps {
  children: ReactNode
  direction: 'forward' | 'backward'
  stepKey: string
}

export function WizardStepWrapper({
  children,
  direction,
  stepKey,
}: WizardStepWrapperProps) {
  return (
    <div
      key={stepKey}
      className={cn(
        'animate-in fade-in duration-300 fill-mode-both',
        direction === 'forward'
          ? 'slide-in-from-right-4'
          : 'slide-in-from-left-4'
      )}
    >
      {children}
    </div>
  )
}
