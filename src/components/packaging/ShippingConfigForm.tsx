import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  OperadorEnvio,
  AgenciaShalom,
} from "@/services/shippingConfigService"
import type {
  ShippingFormState,
  OlvaFormData,
} from "@/hooks/useShippingConfig"

interface ShippingConfigFormProps {
  operador: OperadorEnvio | null
  shalomForm: ShippingFormState | null
  olvaForm: OlvaFormData | null
  agencias: AgenciaShalom[]
  guardando: boolean
  configuracionCompleta: boolean
  onOperadorChange: (op: OperadorEnvio) => void
  onTelefonoChange: (telefono: string) => void
  onAgenciaChange: (agenciaId: number) => void
  onOlvaChange: (campo: string, valor: string) => void
  onShalomPrecioChange: (campo: "precioLimaCallao" | "precioProvincias", valor: string) => void
  onGuardar: () => void
}

export default function ShippingConfigForm({
  operador,
  shalomForm,
  olvaForm,
  agencias,
  guardando,
  configuracionCompleta,
  onOperadorChange,
  onTelefonoChange,
  onAgenciaChange,
  onOlvaChange,
  onShalomPrecioChange,
  onGuardar,
}: ShippingConfigFormProps) {
  return (
    <div className="space-y-8">
      {/* Selector de operador */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onOperadorChange("shalom")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-6 py-5 text-base font-semibold transition-all",
            operador === "shalom"
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
              : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
          )}
        >
          <span className="text-lg">📦</span>
          SHALOM
        </button>
        <button
          type="button"
          onClick={() => onOperadorChange("olva")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-6 py-5 text-base font-semibold transition-all",
            operador === "olva"
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
              : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
          )}
        >
          <span className="text-lg">🚚</span>
          OLVA
        </button>
      </div>

      {/* Datos del remitente (compartido por ambos operadores) */}
      {shalomForm && (operador === "shalom" || operador === "olva") && (
        <section>
          <h3 className="mb-4 text-sm font-medium text-foreground">
            Datos del remitente
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Razón social</Label>
              <Input
                value={shalomForm.remitente.razonSocial}
                disabled
                className="cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>RUC</Label>
              <Input
                value={shalomForm.remitente.ruc}
                disabled
                className="cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                value={shalomForm.telefono}
                onChange={(e) => onTelefonoChange(e.target.value)}
                placeholder="Ingresa el teléfono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección fiscal</Label>
              <Input
                value={shalomForm.remitente.direccionFiscal}
                disabled
                className="cursor-not-allowed"
              />
            </div>
          </div>
        </section>
      )}

      {/* Formulario SHALOM */}
      {operador === "shalom" && (
        <section>
          <h3 className="mb-4 text-sm font-medium text-foreground">
            Agencia de envío
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Agencia</Label>
              <Select
                value={
                  shalomForm?.agenciaSeleccionada
                    ? String(shalomForm.agenciaSeleccionada.id)
                    : ""
                }
                onValueChange={(v) => onAgenciaChange(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agencias.map((agencia) => (
                    <SelectItem
                      key={agencia.id}
                      value={String(agencia.id)}
                    >
                      {agencia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {shalomForm?.agenciaSeleccionada && (
              <div className="space-y-1.5">
                <Label>Dirección de la agencia</Label>
                <Input
                  value={shalomForm.agenciaSeleccionada.direccion}
                  disabled
                  className="cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Precios de envío SHALOM */}
      {operador === "shalom" && shalomForm && (
        <section>
          <h3 className="mb-4 text-sm font-medium text-foreground">
            Precios de envío (S/.)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Precio Lima / Callao</Label>
              <Input
                type="number"
                step="0.10"
                min="0"
                value={shalomForm.precioLimaCallao}
                onChange={(e) => onShalomPrecioChange("precioLimaCallao", e.target.value)}
                placeholder="Ej: 10.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precio Provincias</Label>
              <Input
                type="number"
                step="0.10"
                min="0"
                value={shalomForm.precioProvincias}
                onChange={(e) => onShalomPrecioChange("precioProvincias", e.target.value)}
                placeholder="Ej: 15.00"
              />
            </div>
          </div>
        </section>
      )}

      {/* Formulario OLVA */}
      {operador === "olva" && olvaForm && (
        <section>
          <h3 className="mb-4 text-sm font-medium text-foreground">
            Datos para OLVA
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>DNI</Label>
              <Input
                value={olvaForm.dni}
                onChange={(e) => onOlvaChange("dni", e.target.value)}
                placeholder="Ingresa el DNI"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Correo</Label>
              <Input
                value={olvaForm.correo}
                onChange={(e) => onOlvaChange("correo", e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Origen</Label>
              <Input
                value={olvaForm.origen}
                onChange={(e) => onOlvaChange("origen", e.target.value)}
                placeholder="Ej: Lima"
              />
            </div>
          </div>
        </section>
      )}

      {/* Precios de envío OLVA */}
      {operador === "olva" && olvaForm && (
        <section>
          <h3 className="mb-4 text-sm font-medium text-foreground">
            Precios de envío (S/.)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Precio Lima / Callao</Label>
              <Input
                type="number"
                step="0.10"
                min="0"
                value={olvaForm.precioLimaCallao}
                onChange={(e) => onOlvaChange("precioLimaCallao", e.target.value)}
                placeholder="Ej: 10.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precio Provincias</Label>
              <Input
                type="number"
                step="0.10"
                min="0"
                value={olvaForm.precioProvincias}
                onChange={(e) => onOlvaChange("precioProvincias", e.target.value)}
                placeholder="Ej: 15.00"
              />
            </div>
          </div>
        </section>
      )}

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onGuardar}
          disabled={!configuracionCompleta || guardando}
        >
          {guardando ? "Guardando..." : "Guardar configuración"}
        </Button>
        {!configuracionCompleta && (
          <p className="text-xs text-muted-foreground">
            Completa todos los campos obligatorios para guardar.
          </p>
        )}
      </div>
    </div>
  )
}
