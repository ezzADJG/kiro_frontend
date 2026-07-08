import { useState } from 'react'
import { X, User, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockEmployees } from '@/data/mockData'

interface ReassignModalProps {
  open: boolean
  onClose: () => void
  onReassign: (employeeId: string, employeeName: string) => void
  currentOrderNumber?: string
  title?: string
  description?: string
}

export default function ReassignModal({
  open,
  onClose,
  onReassign,
  currentOrderNumber,
  title = 'Reasignar verificación',
  description,
}: ReassignModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!open) return null

  const handleReassign = () => {
    const emp = mockEmployees.find((e) => e.id === selectedId)
    if (emp) {
      onReassign(emp.id, emp.name)
      setSelectedId(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-foreground/5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {currentOrderNumber && <p className="text-xs text-muted-foreground">{currentOrderNumber}</p>}
              {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-6 py-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Seleccionar persona
            </p>
            <div className="space-y-1.5">
              {mockEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedId(emp.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    selectedId === emp.id
                      ? 'bg-muted ring-1 ring-foreground/20'
                      : 'hover:bg-secondary ring-1 ring-foreground/5'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                  </div>
                  {selectedId === emp.id && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!selectedId}
              onClick={handleReassign}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Reasignar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
