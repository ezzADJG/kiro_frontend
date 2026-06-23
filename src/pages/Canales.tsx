import { useBusiness } from '@/context/BusinessContext'

export default function Canales() {
  const { tieneNegocio } = useBusiness()

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>Registra tu negocio primero para conectar canales.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground p-6">
      Conexi&oacute;n de canales &mdash; pr&oacute;ximamente
    </div>
  )
}
