import { useEffect, useState } from 'react'
import { useBusiness } from '@/context/BusinessContext'
import {
  obtenerMiembrosDeNegocio,
  obtenerPerfilesDeUsuarios,
} from '@/services/businessService'
import { X, Loader2 } from 'lucide-react'

interface Member {
  uid: string
  displayName: string
  email?: string
}

interface DelegateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (uid: string, name: string) => void
}

export default function DelegateModal({
  open,
  onClose,
  onSelect,
}: DelegateModalProps) {
  const { activeBusinessId } = useBusiness()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !activeBusinessId) return

    setLoading(true)
    ;(async () => {
      const miembrosData = await obtenerMiembrosDeNegocio(activeBusinessId)
      const uids = miembrosData.map((m) => m.uid)
      const perfiles = await obtenerPerfilesDeUsuarios(uids)
      setMembers(
        miembrosData.map((m) => ({
          uid: m.uid,
          displayName: perfiles[m.uid]?.displayName || 'Usuario',
          email: perfiles[m.uid]?.email,
        }))
      )
      setLoading(false)
    })()
  }, [open, activeBusinessId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Delegar conversación
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">
            No hay agentes disponibles
          </p>
        ) : (
          <div className="space-y-1">
            {members.map((m) => (
              <button
                key={m.uid}
                onClick={() => {
                  onSelect(m.uid, m.displayName)
                  onClose()
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {m.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {m.displayName}
                  </p>
                  {m.email && (
                    <p className="text-xs text-neutral-400">{m.email}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
