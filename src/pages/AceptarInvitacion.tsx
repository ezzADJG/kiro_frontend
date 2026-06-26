import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  getAuth,
  signOut,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth'
import { vincularUsuarioANegocio } from '@/services/businessService'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AceptarInvitacion() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const businessId = searchParams.get('businessId')
  const inviteId = searchParams.get('inviteId')
  const emailFromUrl = searchParams.get('email')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function procesar() {
      const auth = getAuth()

      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setLoading(false)
        setError('Este enlace no es válido o ya expiró.')
        return
      }

      if (!businessId || !inviteId || !emailFromUrl) {
        setLoading(false)
        setError('Faltan parámetros en el enlace de invitación.')
        return
      }

      try {
        const result = await signInWithEmailLink(
          auth,
          emailFromUrl,
          window.location.href
        )

        await vincularUsuarioANegocio(
          businessId,
          result.user.uid,
          'agente',
          inviteId
        )

        await signOut(auth)

        setMensaje(
          'Cuenta verificada y vinculada al negocio correctamente.'
        )
        setLoading(false)

        setTimeout(() => navigate('/login?cuenta_verificada=1'), 2000)
      } catch {
        setLoading(false)
        setError(
          'No se pudo procesar la invitación. El enlace puede haber expirado.'
        )
      }
    }

    procesar()
  }, [businessId, inviteId, emailFromUrl, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <CardTitle>Verificando invitación</CardTitle>
            <CardDescription>
              Un momento...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invitaci&oacute;n inv&aacute;lida</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')}>
              Ir al inicio de sesi&oacute;n
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <CardTitle>&iexcl;Listo!</CardTitle>
          <CardDescription>{mensaje}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
