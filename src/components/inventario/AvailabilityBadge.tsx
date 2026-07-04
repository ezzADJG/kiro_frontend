import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

type Availability = 'disponible' | 'agotado' | 'bajo_stock' | 'inactivo'

interface AvailabilityBadgeProps {
  disponible: boolean
  stock?: number
  stockMinimo?: number
  onChange?: (value: boolean) => void
}

const STYLES: Record<Availability, { bg: string; dot: string; label: string }> = {
  disponible: { bg: 'bg-green-50 dark:bg-green-950/30', dot: 'bg-green-500', label: 'Disponible' },
  agotado: { bg: 'bg-red-50 dark:bg-red-950/30', dot: 'bg-red-500', label: 'Agotado' },
  bajo_stock: { bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500', label: 'Bajo stock' },
  inactivo: { bg: 'bg-neutral-100 dark:bg-neutral-800', dot: 'bg-neutral-400', label: 'Inactivo' },
}

function derive(disponible: boolean, stock?: number, stockMinimo?: number): Availability {
  if (!disponible) return 'inactivo'
  if (stock !== undefined && stock <= 0) return 'agotado'
  if (stock !== undefined && stockMinimo !== undefined && stock > 0 && stock <= stockMinimo) return 'bajo_stock'
  return 'disponible'
}

export default function AvailabilityBadge({ disponible, stock, stockMinimo, onChange }: AvailabilityBadgeProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  const current = derive(disponible, stock, stockMinimo)
  const style = STYLES[current]

  const updatePosition = useCallback(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
    })
  }, [open])

  useEffect(() => {
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [updatePosition])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const menu = document.getElementById('av-menu')
        if (menu && !menu.contains(e.target as Node)) setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const actions: { label: string; value: boolean }[] = []
  if (current !== 'disponible') actions.push({ label: 'Marcar disponible', value: true })
  if (current !== 'inactivo') actions.push({ label: 'Marcar inactivo', value: false })

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${style.bg}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {style.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && actions.length > 0 && (
        <div
          id="av-menu"
          style={menuStyle}
          className="z-50 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => { onChange?.(action.value); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
