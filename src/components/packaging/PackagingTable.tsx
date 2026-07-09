import { useState } from "react"
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react"
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
import type { Packaging, PackagingType, OperatorPackageCategory } from "@/types/packaging"
import { PACKAGING_TYPE_LABELS, PACKAGING_TYPES } from "@/types/packaging"

interface PackagingTableProps {
  packagings: Packaging[]
  shalomCategories: OperatorPackageCategory[]
  onNew: () => void
  onEdit: (packaging: Packaging) => void
  onDelete: (packaging: Packaging) => void
}

export default function PackagingTable({
  packagings,
  shalomCategories,
  onNew,
  onEdit,
  onDelete,
}: PackagingTableProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = packagings.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || p.type === typeFilter
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  function getDimensions(p: Packaging): string {
    if (p.lengthCm === null || p.widthCm === null || p.heightCm === null) {
      return "Flexible"
    }
    return `${p.lengthCm}×${p.widthCm}×${p.heightCm} cm`
  }

  function getCategoryName(p: Packaging): string {
    if (!p.operatorCategoryId) return "—"
    const cat = shalomCategories.find((c) => c.id === p.operatorCategoryId)
    return cat?.categoryName ?? "—"
  }

  if (packagings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
        <div className="rounded-full bg-muted p-4">
          <Package className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-foreground">
          Aún no has registrado empaques
        </h3>
        <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
          Crea tu primer empaque para comenzar a cotizar envíos automáticamente.
        </p>
        <Button className="mt-4" onClick={onNew}>
          <Plus className="size-4" />
          Nuevo empaque
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onNew}>
          <Plus className="size-4" />
          Nuevo empaque
        </Button>
        <div className="relative ml-auto max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empaque..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {PACKAGING_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del empaque</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Largo</TableHead>
              <TableHead>Ancho</TableHead>
              <TableHead>Alto</TableHead>
              <TableHead>Peso máximo</TableHead>
              <TableHead>Equivalencia Shalom</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{PACKAGING_TYPE_LABELS[p.type]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {p.lengthCm ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.widthCm ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.heightCm ?? "—"}
                </TableCell>
                <TableCell>{p.maxWeightKg} kg</TableCell>
                <TableCell>{getCategoryName(p)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.status === "active" ? "success" : "default"
                    }
                  >
                    {p.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      title="Eliminar"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No se encontraron empaques con los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
