import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type {
  Packaging,
  PackagingEquivalence,
  OperatorPackageCategory,
} from "@/types/packaging"
import { PACKAGING_TYPE_LABELS } from "@/types/packaging"

interface EquivalenceTableProps {
  packagings: Packaging[]
  equivalences: PackagingEquivalence[]
  shalomCategories: OperatorPackageCategory[]
  onAdd: (data: Omit<PackagingEquivalence, "id">) => void
  onUpdate: (id: string, data: Partial<Omit<PackagingEquivalence, "id">>) => void
  onDelete: (id: string) => void
}

interface EquivalenceModalState {
  open: boolean
  editing: PackagingEquivalence | null
  packagingId: string
  operatorCategoryId: string
  notes: string
}

export default function EquivalenceTable({
  packagings,
  equivalences,
  shalomCategories,
  onAdd,
  onUpdate,
  onDelete,
}: EquivalenceTableProps) {
  const [modal, setModal] = useState<EquivalenceModalState>({
    open: false,
    editing: null,
    packagingId: "",
    operatorCategoryId: "",
    notes: "",
  })

  function openNew() {
    setModal({
      open: true,
      editing: null,
      packagingId: "",
      operatorCategoryId: "",
      notes: "",
    })
  }

  function openEdit(eq: PackagingEquivalence) {
    setModal({
      open: true,
      editing: eq,
      packagingId: eq.packagingId,
      operatorCategoryId: eq.operatorCategoryId,
      notes: eq.notes ?? "",
    })
  }

  function handleSave() {
    if (!modal.packagingId || !modal.operatorCategoryId) return

    if (modal.editing) {
      onUpdate(modal.editing.id, {
        packagingId: modal.packagingId,
        operatorCategoryId: modal.operatorCategoryId,
        notes: modal.notes || null,
      })
    } else {
      onAdd({
        packagingId: modal.packagingId,
        operatorCategoryId: modal.operatorCategoryId,
        notes: modal.notes || null,
      })
    }
    setModal((prev) => ({ ...prev, open: false }))
  }

  function getPackagingName(id: string): string {
    return packagings.find((p) => p.id === id)?.name ?? "—"
  }

  function getPackagingType(id: string): string {
    const p = packagings.find((p) => p.id === id)
    return p ? PACKAGING_TYPE_LABELS[p.type] : "—"
  }

  function getPackagingDimensions(id: string): string {
    const p = packagings.find((p) => p.id === id)
    if (!p) return "—"
    if (p.lengthCm === null || p.widthCm === null || p.heightCm === null) {
      return "Flexible"
    }
    return `${p.lengthCm}×${p.widthCm}×${p.heightCm} cm`
  }

  function getPackagingWeight(id: string): string {
    const p = packagings.find((p) => p.id === id)
    return p ? `${p.maxWeightKg} kg` : "—"
  }

  function getCategoryName(id: string): string {
    return shalomCategories.find((c) => c.id === id)?.categoryName ?? "—"
  }

  const remainingPackagings = packagings.filter(
    (p) => p.status === "active" && !equivalences.some((e) => e.packagingId === p.id)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Define qué categoría de Shalom le corresponde a cada empaque para la cotización automática.
        </p>
        <Button variant="outline" size="sm" onClick={openNew}>
          <Plus className="size-4" />
          Agregar equivalencia
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empaque interno</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Dimensiones</TableHead>
              <TableHead>Peso máximo</TableHead>
              <TableHead>Categoría Shalom</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equivalences.map((eq) => (
              <TableRow key={eq.id}>
                <TableCell className="font-medium">
                  {getPackagingName(eq.packagingId)}
                </TableCell>
                <TableCell>{getPackagingType(eq.packagingId)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {getPackagingDimensions(eq.packagingId)}
                </TableCell>
                <TableCell>{getPackagingWeight(eq.packagingId)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getCategoryName(eq.operatorCategoryId)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {eq.notes ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(eq)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(eq.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      title="Eliminar"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {equivalences.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Aún no hay equivalencias configuradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Equivalence modal */}
      <Dialog
        open={modal.open}
        onOpenChange={(o) => setModal((prev) => ({ ...prev, open: o }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modal.editing ? "Editar equivalencia" : "Nueva equivalencia"}
            </DialogTitle>
            <DialogDescription>
              {modal.editing
                ? "Modifica la relación entre el empaque y la categoría Shalom."
                : "Relaciona un empaque interno con una categoría de Shalom."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Empaque interno</Label>
              <Select
                value={modal.packagingId}
                onValueChange={(v) =>
                  setModal((prev) => ({ ...prev, packagingId: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar empaque" />
                </SelectTrigger>
                <SelectContent>
                  {(modal.editing ? packagings : remainingPackagings).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({PACKAGING_TYPE_LABELS[p.type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría Shalom</Label>
              <Select
                value={modal.operatorCategoryId}
                onValueChange={(v) =>
                  setModal((prev) => ({ ...prev, operatorCategoryId: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {shalomCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observaciones</Label>
              <Input
                id="notes"
                value={modal.notes}
                onChange={(e) =>
                  setModal((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ej: Productos pequeños"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModal((prev) => ({ ...prev, open: false }))}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {modal.editing ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
