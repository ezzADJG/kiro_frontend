import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useBusiness } from '@/context/BusinessContext'
import { obtenerNegocio } from '@/services/businessService'
import type { Business } from '@/types/business'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Inicio() {
  const { userProfile } = useAuth()
  const { tieneNegocio, activeBusinessId, loadingBusiness } = useBusiness()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loadingName, setLoadingName] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (activeBusinessId) {
      setLoadingName(true)
      obtenerNegocio(activeBusinessId)
        .then(setBusiness)
        .finally(() => setLoadingName(false))
    } else {
      setBusiness(null)
    }
  }, [activeBusinessId])

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
              K
            </div>
            <CardTitle>Configura tu negocio</CardTitle>
            <CardDescription>
              A&uacute;n no has configurado tu negocio. Completa estos datos
              para empezar a usar Kiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/negocio')}>
              Configurar mi negocio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido de nuevo
        </h1>
        {loadingName ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : business ? (
          <p className="text-sm text-muted-foreground">{business.tradeName}</p>
        ) : userProfile?.displayName ? (
          <p className="text-sm text-muted-foreground">
            {userProfile.displayName}
          </p>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        M&eacute;tricas y KPIs pr&oacute;ximamente.
      </p>
    </div>
  )
}
