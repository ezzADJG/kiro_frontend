import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RutaProtegida() {
  const { firebaseUser, loadingAuth } = useAuth()

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
