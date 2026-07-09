import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Packaging, OperatorPackageCategory, PackagingType } from "@/types/packaging"
import { PACKAGING_TYPES, isFlexibleType } from "@/types/packaging"
import type { PackagingFormData, PackagingFormErrors } from "@/hooks/usePackagingConfig"
import { validatePackagingForm } from "@/hooks/usePackagingConfig"
import { InfoIcon } from "lucide-react"

interface PackagingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<Packaging, "id" | "createdAt" | "updatedAt">) => void
  editingPackaging?: Packaging | null
  shalomCategories: OperatorPackageCategory[]
}

export default function PackagingModal({
  open,
  onOpenChange,
  onSave,
  editingPackaging,
  shalomCategories,
}: PackagingModalProps) {
  const isEditing = !!editingPackaging

  const [form, setForm] = useState<PackagingFormData>(() => ({
    name: editingPackaging?.name ?? "",
    type: editingPackaging?.type ?? "",
    lengthCm: editingPackaging?.lengthCm?.toString() ?? "",
    widthCm: editingPackaging?.widthCm?.toString() ?? "",
    heightCm: editingPackaging?.heightCm?.toString() ?? "",
    maxWeightKg: editingPackaging?.maxWeightKg?.toString() ?? "",
    operatorCategoryId: editingPackaging?.operatorCategoryId ?? "",
    status: editingPackaging?.status ?? "active",
  }))

  const [errors, setErrors] = useState<PackagingFormErrors>({})

  const flexible = form.type ? isFlexibleType(form.type as PackagingType) : false

  function handleField<K extends keyof PackagingFormData>(key: K, value: PackagingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSave() {
    const validationErrors = validatePackagingForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    onSave({
      name: form.name.trim(),
      type: form.type as PackagingType,
      lengthCm: flexible ? null : Number(form.lengthCm),
      widthCm: flexible ? null : Number(form.widthCm),
      heightCm: flexible ? null : Number(form.heightCm),
      maxWeightKg: Number(form.maxWeightKg),
      status: form.status,
      operatorCategoryId: form.operatorCategoryId,
    })

    onOpenChange(false)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setForm({
        name: "",
        type: "",
        lengthCm: "",
        widthCm: "",
        heightCm: "",
        maxWeightKg: "",
        operatorCategoryId: "",
        status: "active",
      })
      setErrors({})
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar empaque" : "Nuevo empaque"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del empaque"
              : "Registra un nuevo tipo de empaque para tus envíos"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información general */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">Información general</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre del empaque</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleField("name", e.target.value)}
                  placeholder="Ej: Caja Pequeña"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo de empaque</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => handleField("type", v)}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-xs text-destructive">{errors.type}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dimensiones */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">
              Dimensiones internas
            </h4>
            <div className="space-y-3">
              {flexible ? (
                <p className="text-xs text-muted-foreground italic">
                  Las bolsas no requieren dimensiones fijas.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="length">Largo (cm)</Label>
                      <Input
                        id="length"
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.lengthCm}
                        onChange={(e) => handleField("lengthCm", e.target.value)}
                        placeholder="0"
                      />
                      {errors.lengthCm && (
                        <p className="text-xs text-destructive">{errors.lengthCm}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="width">Ancho (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.widthCm}
                        onChange={(e) => handleField("widthCm", e.target.value)}
                        placeholder="0"
                      />
                      {errors.widthCm && (
                        <p className="text-xs text-destructive">{errors.widthCm}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="height">Alto (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.heightCm}
                        onChange={(e) => handleField("heightCm", e.target.value)}
                        placeholder="0"
                      />
                      {errors.heightCm && (
                        <p className="text-xs text-destructive">{errors.heightCm}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2">
                    <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Las dimensiones internas son el espacio útil disponible para colocar el producto.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Capacidad */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-foreground">Capacidad</h4>
            <div className="max-w-[200px] space-y-1.5">
              <Label htmlFor="weight">Peso máximo permitido (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                value={form.maxWeightKg}
                onChange={(e) => handleField("maxWeightKg", e.target.value)}
                placeholder="0"
              />
              {errors.maxWeightKg && (
                <p className="text-xs text-destructive">{errors.maxWeightKg}</p>
              )}
            </div>
          </div>

          {/* Equivalencia Shalom */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-foreground">
              Equivalencia con Shalom
            </h4>
            <p className="text-xs text-muted-foreground">
              Selecciona la categoría de Shalom que corresponde a este empaque.
            </p>
            <Select
              value={form.operatorCategoryId}
              onValueChange={(v) => handleField("operatorCategoryId", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar categoría Shalom" />
              </SelectTrigger>
              <SelectContent>
                {shalomCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.categoryName}
                    {cat.description ? ` — ${cat.description}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.operatorCategoryId && (
              <p className="text-xs text-destructive">{errors.operatorCategoryId}</p>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center gap-3">
            <Switch
              checked={form.status === "active"}
              onCheckedChange={(ch) =>
                handleField("status", ch ? "active" : "inactive")
              }
            />
            <Label className="text-sm font-normal">
              {form.status === "active" ? "Activo" : "Inactivo"}
            </Label>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? "Guardar cambios" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
