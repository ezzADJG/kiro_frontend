import { useState } from "react"
import { useBusiness } from "@/context/BusinessContext"
import { usePackagingConfig } from "@/hooks/usePackagingConfig"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import PackagingTable from "@/components/packaging/PackagingTable"
import PackagingModal from "@/components/packaging/PackagingModal"
import EquivalenceTable from "@/components/packaging/EquivalenceTable"
import DeleteConfirmDialog from "@/components/packaging/DeleteConfirmDialog"
import type { Packaging } from "@/types/packaging"

export default function ConfiguracionEmpaques() {
  const { tieneNegocio } = useBusiness()
  const navigate = useNavigate()
  const {
    packagings,
    equivalences,
    shalomCategories,
    saving,
    addPackaging,
    updatePackaging,
    deletePackaging,
    addEquivalence,
    updateEquivalence,
    deleteEquivalence,
    simulateSave,
  } = usePackagingConfig()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Packaging | null>(null)

  function handleNew() {
    setEditingPackaging(null)
    setModalOpen(true)
  }

  function handleEdit(packaging: Packaging) {
    setEditingPackaging(packaging)
    setModalOpen(true)
  }

  async function handleSave(data: Omit<Packaging, "id" | "createdAt" | "updatedAt">) {
    await simulateSave()
    if (editingPackaging) {
      updatePackaging(editingPackaging.id, data)
      toast({ title: "Empaque actualizado", variant: "success" })
    } else {
      addPackaging(data)
      toast({ title: "Empaque creado", variant: "success" })
    }
  }

  function handleDelete(packaging: Packaging) {
    setDeleteTarget(packaging)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await simulateSave()
    deletePackaging(deleteTarget.id)
    toast({ title: "Empaque eliminado", variant: "success" })
    setDeleteTarget(null)
  }

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Registra tu negocio primero para configurar empaques.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-muted-foreground"
          onClick={() => navigate("/dashboard/configuracion")}
        >
          <ArrowLeft className="size-4" />
          Configuración
        </Button>
        <h1 className="text-lg font-medium text-foreground">Empaques</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura los empaques que usas para tus envíos y relaciónalos con las
          categorías de Shalom.
        </p>
      </div>

      {/* Sección 1: Mis empaques */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-foreground">Mis empaques</h2>
        <PackagingTable
          packagings={packagings}
          shalomCategories={shalomCategories}
          onNew={handleNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </section>

      {/* Sección 2: Tabla de equivalencias */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-foreground">
          Tabla de equivalencias
        </h2>
        <EquivalenceTable
          packagings={packagings}
          equivalences={equivalences}
          shalomCategories={shalomCategories}
          onAdd={addEquivalence}
          onUpdate={updateEquivalence}
          onDelete={deleteEquivalence}
        />
      </section>

      {/* Modals */}
      <PackagingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        editingPackaging={editingPackaging}
        shalomCategories={shalomCategories}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        packagingName={deleteTarget?.name ?? ""}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
