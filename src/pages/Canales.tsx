import { useEffect, useState } from 'react'
import { onValue, off } from 'firebase/database'
import { useBusiness } from '@/context/BusinessContext'
import { registrarTelefono } from '@/services/channelService'
import { phonesNoMetaIdRef, phonesRef } from '@/lib/db'
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
import { Phone, CheckCircle2, Loader2 } from 'lucide-react'
import type { PhoneNoMetaId, PhoneChannel } from '@/types/channels'

type FormState = {
  phoneNumber: string
  description: string
}

const initialForm: FormState = { phoneNumber: '', description: '' }

export default function Canales() {
  const { tieneNegocio, activeBusinessId, loadingBusiness } = useBusiness()

  const [form, setForm] = useState<FormState>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingRecords, setPendingRecords] = useState<PhoneNoMetaId[]>([])
  const [connectedChannels, setConnectedChannels] = useState<
    (PhoneChannel & { id: string })[]
  >([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!activeBusinessId) return

    const noMetaRef = phonesNoMetaIdRef()
    const onNoMetaUpdate = onValue(noMetaRef, (snapshot) => {
      const data = snapshot.val() as Record<string, PhoneNoMetaId> | null
      if (!data) {
        setPendingRecords([])
        return
      }

      const pending = Object.values(data).filter(
        (item) =>
          item.business_id === activeBusinessId && item.estado === 'pendiente'
      )
      setPendingRecords(pending)
    })

    const phones = phonesRef()
    const onPhonesUpdate = onValue(phones, (snapshot) => {
      const data = snapshot.val() as Record<string, PhoneChannel> | null
      if (!data) {
        setConnectedChannels([])
        return
      }

      const connected = Object.entries(data)
        .filter(
          ([, item]) =>
            item.business_id === activeBusinessId && item.estado === 'conectado'
        )
        .map(([id, item]) => ({ ...item, id }))
      setConnectedChannels(connected)
    })

    return () => {
      off(noMetaRef, 'value', onNoMetaUpdate)
      off(phones, 'value', onPhonesUpdate)
    }
  }, [activeBusinessId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { phoneNumber, description } = form
    if (!phoneNumber.trim()) {
      setError('El número de teléfono es requerido')
      return
    }
    if (!description.trim()) {
      setError('La descripción es requerida')
      return
    }

    const isDuplicate = [...pendingRecords, ...connectedChannels].some(
      (c) => c.phone_number === phoneNumber.trim()
    )
    if (isDuplicate) {
      setError('Este número ya ha sido registrado')
      return
    }

    setIsSubmitting(true)
    try {
      await registrarTelefono(
        activeBusinessId!,
        phoneNumber.trim(),
        description.trim()
      )
      setForm(initialForm)
    } catch {
      setError('No se pudo registrar el canal. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingBusiness) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
              <Phone className="h-6 w-6" />
            </div>
            <CardTitle>Conecta tu WhatsApp</CardTitle>
            <CardDescription>
              Registra tu negocio primero para conectar canales.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Canales</h1>
          <p className="text-sm text-muted-foreground">
            Conecta tus n&uacute;meros de WhatsApp
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md self-center">
        <CardHeader>
          <CardTitle>Nuevo canal</CardTitle>
          <CardDescription>
            Ingresa el n&uacute;mero de WhatsApp y una descripci&oacute;n
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                N&uacute;mero de tel&eacute;fono
              </Label>
              <Input
                id="phoneNumber"
                required
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="+51999000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripci&oacute;n</Label>
              <Input
                id="description"
                required
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Ej: Sucursal Principal"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {pendingRecords.length > 0 && (
        <div className="w-full">
          <h2 className="mb-4 text-lg font-medium">Pendientes de aprobaci&oacute;n</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRecords.map((record, index) => (
              <Card key={index} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div>
                      <CardTitle>{record.phone_number}</CardTitle>
                      <CardDescription>
                        {record.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="w-full">
        <h2 className="mb-4 text-lg font-medium">Canales conectados</h2>
        {connectedChannels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            A&uacute;n no hay canales conectados.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectedChannels.map((channel) => (
              <Card key={channel.id} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle>{channel.phone_number}</CardTitle>
                      <CardDescription>
                        {channel.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
