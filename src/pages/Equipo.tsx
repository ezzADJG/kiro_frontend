import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useBusiness } from '@/context/BusinessContext'
import {
  obtenerMiembrosDeNegocio,
  obtenerPerfilesDeUsuarios,
  invitarUsuario,
  eliminarMiembroDeNegocio,
  obtenerInvitacionesPendientes,
  obtenerNegocio,
} from '@/services/businessService'
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserMinus, Mail, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface Miembro {
  uid: string
  role: 'owner' | 'agente'
  active: boolean
  joinedAt: number
  displayName?: string
  email?: string
}

interface Invitacion {
  id: string
  email: string
  role: string
  status: string
  createdAt: number
}

export default function Equipo() {
  const { firebaseUser } = useAuth()
  const { tieneNegocio, activeBusinessId, loadingBusiness } = useBusiness()

  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'agente'>('agente')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const esOwner =
    miembros.find((m) => m.uid === firebaseUser?.uid)?.role === 'owner'

  async function cargarMiembros() {
    if (!activeBusinessId) return

    const miembrosData = await obtenerMiembrosDeNegocio(activeBusinessId)
    const uids = miembrosData.map((m) => m.uid)
    const perfiles = await obtenerPerfilesDeUsuarios(uids)

    setMiembros(
      miembrosData.map((m) => ({
        ...m,
        displayName: perfiles[m.uid]?.displayName || 'Usuario',
        email: perfiles[m.uid]?.email,
      }))
    )
  }

  async function cargarInvitaciones() {
    if (!activeBusinessId) return
    const data = await obtenerInvitacionesPendientes(activeBusinessId)
    setInvitaciones(data)
  }

  useEffect(() => {
    if (!activeBusinessId || !tieneNegocio) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([cargarMiembros(), cargarInvitaciones()]).finally(() =>
      setLoading(false)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusinessId, tieneNegocio])

  const handleInvitar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!inviteEmail.trim()) {
      setError('El correo es requerido')
      return
    }
    if (!/\S+@\S+\.\S+/.test(inviteEmail)) {
      setError('El correo no es válido')
      return
    }

    setSubmitting(true)
    try {
      const negocio = await obtenerNegocio(activeBusinessId!)
      const businessName = negocio?.tradeName || 'Mi Negocio'

      const inviteId = await invitarUsuario(
        activeBusinessId!,
        inviteEmail.trim(),
        inviteRole,
        businessName
      )

      const redirectUrl = `${window.location.origin}/invitar?businessId=${activeBusinessId}&businessName=${encodeURIComponent(businessName)}&inviteId=${inviteId}&email=${encodeURIComponent(inviteEmail.trim())}`

      console.log('[Equipo] actionCodeSettings URL:', redirectUrl)

      const actionCodeSettings = {
        url: redirectUrl,
        handleCodeInApp: true,
      }

      await sendSignInLinkToEmail(
        getAuth(),
        inviteEmail.trim(),
        actionCodeSettings
      )

      console.log('[Equipo] sendSignInLinkToEmail successful for:', inviteEmail.trim())

      setSuccess(
        `Correo de invitación enviado a ${inviteEmail.trim()}`
      )
      setInviteEmail('')
      await cargarInvitaciones()
    } catch (err: any) {
      console.error('[Equipo] Error sendSignInLinkToEmail:', err.code, err.message)
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          'El inicio de sesión con vínculo de correo no está habilitado. Actívalo en Firebase Console.'
        )
      } else {
        setError(err.message || 'No se pudo enviar la invitación. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEliminar = async (uid: string) => {
    if (!activeBusinessId) return
    await eliminarMiembroDeNegocio(activeBusinessId, uid)
    await cargarMiembros()
  }

  if (loadingBusiness || loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground p-6">
        Cargando...
      </div>
    )
  }

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>Registra tu negocio primero para gestionar tu equipo.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los miembros de tu negocio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Miembros actuales</CardTitle>
          <CardDescription>
            {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} en este
            negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {miembros.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay miembros en este negocio.
            </p>
          ) : (
            <div className="divide-y">
              {miembros.map((m) => (
                <div
                  key={m.uid}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {m.displayName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {m.displayName || 'Usuario'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {m.role === 'owner' ? 'Dueño' : 'Agente'}
                    </span>
                    {m.active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {esOwner && m.uid !== firebaseUser?.uid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEliminar(m.uid)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invitaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones pendientes</CardTitle>
            <CardDescription>
              {invitaciones.length} invitaci&oacute;n
              {invitaciones.length !== 1 ? 'es' : ''} por confirmar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {invitaciones.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{inv.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(inv.createdAt).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Pendiente
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {esOwner && (
        <Card className="w-full max-w-md self-start">
          <CardHeader>
            <CardTitle>Invitar miembro</CardTitle>
            <CardDescription>
              Env&iacute;a una invitaci&oacute;n por correo electr&oacute;nico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvitar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Correo electr&oacute;nico</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteRole">Rol</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) =>
                    v !== null && setInviteRole(v as 'agente')
                  }
                >
                  <SelectTrigger id="inviteRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agente">Agente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {success}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar invitación'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
