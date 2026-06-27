import { useEffect, useState } from 'react'
import { onValue, off } from 'firebase/database'
import { phonesNoMetaIdRef, phonesRef } from '@/lib/db'
import { approvePhone } from '@/services/channelService'
import { obtenerNegocio } from '@/services/businessService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Phone, CheckCircle2, XCircle, Shield, Link2 } from 'lucide-react'
import type { PhoneNoMetaId, PhoneChannel } from '@/types/channels'

interface PendingEntry extends PhoneNoMetaId {
  id: string
}

interface ApprovedEntry extends PhoneChannel {
  id: string
}

export default function AdminCanales() {
  const [pendingPhones, setPendingPhones] = useState<PendingEntry[]>([])
  const [approvedPhones, setApprovedPhones] = useState<ApprovedEntry[]>([])
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({})
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Listener para solicitudes pendientes
  useEffect(() => {
    const noMetaRef = phonesNoMetaIdRef()
    const unsubscribe = onValue(noMetaRef, (snapshot) => {
      const data = snapshot.val() as Record<string, PhoneNoMetaId> | null
      if (!data) {
        setPendingPhones([])
        return
      }

      const pendientes = Object.entries(data)
        .filter(([, item]) => item.estado === 'pendiente')
        .map(([id, item]) => ({ ...item, id }))

      setPendingPhones(pendientes)
    })

    return () => off(noMetaRef, 'value', unsubscribe)
  }, [])

  // Listener para canales conectados
  useEffect(() => {
    const phonesRefVal = phonesRef()
    const unsubscribe = onValue(phonesRefVal, (snapshot) => {
      const data = snapshot.val() as Record<string, PhoneChannel> | null
      if (!data) {
        setApprovedPhones([])
        return
      }

      const conectados = Object.entries(data)
        .filter(([, item]) => item.estado === 'conectado')
        .map(([id, item]) => ({ ...item, id }))

      setApprovedPhones(conectados)
    })

    return () => off(phonesRefVal, 'value', unsubscribe)
  }, [])

  // Cargar nombres de negocios cuando cambian las listas
  useEffect(() => {
    const loadBusinessNames = async () => {
      const businessIds = new Set<string>()
      pendingPhones.forEach((p) => businessIds.add(p.business_id))
      approvedPhones.forEach((p) => businessIds.add(p.business_id))

      const names: Record<string, string> = {}
      const promises = Array.from(businessIds).map(async (id) => {
        try {
          const negocio = await obtenerNegocio(id)
          names[id] = negocio?.businessName || 'Desconocido'
        } catch {
          names[id] = 'Desconocido'
        }
      })

      await Promise.all(promises)
      setBusinessNames(names)
    }

    loadBusinessNames()
  }, [pendingPhones, approvedPhones])

  const handleApprove = async (entry: PendingEntry) => {
    setError('')

    if (!phoneNumberId.trim()) {
      setError('El ID del teléfono es requerido')
      return
    }

    setSubmitting(true)
    try {
      await approvePhone(
        entry.id,
        phoneNumberId.trim(),
        entry.phone_number,
        entry.description,
        entry.business_id
      )
      setApprovingId(null)
      setPhoneNumberId('')
    } catch {
      setError('No se pudo aprobar el canal. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderCard = (entry: PendingEntry | ApprovedEntry, isPending: boolean) => (
    <Card key={entry.id}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isPending
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}
          >
            <Phone className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <CardTitle>{entry.phone_number}</CardTitle>
            <CardDescription>{entry.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Negocio:</span>{' '}
            {businessNames[entry.business_id] || 'Cargando...'}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">ID:</span>{' '}
            {entry.business_id}
          </p>
        </div>

        {isPending && (
          <>
            {approvingId === entry.id ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor={`phone-id-${entry.id}`}>Phone Number ID</Label>
                  <Input
                    id={`phone-id-${entry.id}`}
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="Ej: 123456789"
                  />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setApprovingId(null)
                      setPhoneNumberId('')
                      setError('')
                    }}
                    disabled={submitting}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(entry as PendingEntry)}
                    disabled={submitting}
                  >
                    {submitting ? 'Aprobando...' : 'Aprobar'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full"
                onClick={() => setApprovingId(entry.id)}
              >
                Aprobar / Conectar
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Administrar canales
          </h1>
          <p className="text-sm text-muted-foreground">
            Solicitudes de conexión pendientes
          </p>
        </div>
      </div>

      {/* Sección: Solicitudes pendientes */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Solicitudes pendientes
        </h2>
        {pendingPhones.length === 0 ? (
          <Card className="w-full max-w-md self-center text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <CardTitle>Sin solicitudes pendientes</CardTitle>
              <CardDescription>
                No hay solicitudes de conexión de canales en este momento.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingPhones.map((entry) => renderCard(entry, true))}
          </div>
        )}
      </div>

      {/* Sección: Canales conectados */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Canales conectados
        </h2>
        {approvedPhones.length === 0 ? (
          <Card className="w-full max-w-md self-center text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Link2 className="h-6 w-6" />
              </div>
              <CardTitle>Sin canales conectados</CardTitle>
              <CardDescription>
                No hay canales conectados en este momento.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approvedPhones.map((entry) => renderCard(entry, false))}
          </div>
        )}
      </div>
    </div>
  )
}
