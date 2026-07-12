import { cn } from '@/lib/utils'

interface WizardProgressBarProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function WizardProgressBar({
  currentStep,
  totalSteps,
  className,
}: WizardProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Paso {currentStep} de {totalSteps}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {percentage}% completado
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
