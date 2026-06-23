import { useBusiness } from '@/context/BusinessContext'

export default function Stock() {
  const { tieneNegocio } = useBusiness()

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>Registra tu negocio primero para gestionar tu stock.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground p-6">
      Stock (pendiente de implementar &mdash; Fase futura)
    </div>
  )
}
