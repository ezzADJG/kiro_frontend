import { useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package } from "lucide-react"

export default function ConfiguracionIndex() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-lg font-medium text-foreground">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra las opciones de tu negocio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate("/dashboard/configuracion/empaques")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Package className="size-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Delivery</CardTitle>
                <CardDescription>Empaques para envíos</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
