import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
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

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSuccess(
        'Revisa tu correo para restablecer tu contraseña.'
      )
      setEmail('')
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No hay una cuenta registrada con este correo.')
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo no es válido.')
      } else {
        setError('Ocurrió un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link
            to="/"
            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground"
          >
            K
          </Link>
          <CardTitle>Recuperar Contrase&ntilde;a</CardTitle>
          <CardDescription>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contrase&ntilde;a.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {success}
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Volver a iniciar sesi&oacute;n
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electr&oacute;nico</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Volver a iniciar sesi&oacute;n
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
