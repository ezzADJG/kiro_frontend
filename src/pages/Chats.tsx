import { useBusiness } from '@/context/BusinessContext'

export default function Chats() {
  const { tieneNegocio } = useBusiness()

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>Registra tu negocio primero para conectar tus chats.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground p-6">
      Chats (pendiente de implementar &mdash; Fase futura)
    </div>
  )
}
