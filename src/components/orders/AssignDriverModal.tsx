import { useState } from 'react'
import { X, Truck, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockDrivers } from '@/data/mockData'

interface AssignDriverModalProps {
  open: boolean
  onClose: () => void
  onAssign: (driverId: string, driverName: string) => void
  currentOrderNumber: string
}

export default function AssignDriverModal({ open, onClose, onAssign, currentOrderNumber }: AssignDriverModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!open) return null

  const handleAssign = () => {
    const drv = mockDrivers.find((d) => d.id === selectedId)
    if (drv) {
      onAssign(drv.id, drv.name)
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
              <h3 className="text-sm font-semibold text-foreground">Motorizado</h3>
              <p className="text-xs text-muted-foreground">{currentOrderNumber}</p>
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
              Seleccionar conductor motorizado
            </p>
            <div className="space-y-1.5">
              {mockDrivers.map((drv) => (
                <button
                  key={drv.id}
                  onClick={() => setSelectedId(drv.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    selectedId === drv.id
                      ? 'bg-muted ring-1 ring-foreground/20'
                      : 'hover:bg-secondary ring-1 ring-foreground/5'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{drv.name}</p>
                    <p className="text-xs text-muted-foreground">{drv.vehicle} · {drv.phone}</p>
                  </div>
                  {selectedId === drv.id && (
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
              onClick={handleAssign}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Asignar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
