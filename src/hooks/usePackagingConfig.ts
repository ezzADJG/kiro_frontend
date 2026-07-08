import { useState, useEffect, useCallback } from "react"
import type {
  Packaging,
  PackagingEquivalence,
  OperatorPackageCategory,
  PackagingType,
} from "@/types/packaging"
import { isFlexibleType } from "@/types/packaging"

const STORAGE_KEY_PACKAGINGS = "kiro-packagings"
const STORAGE_KEY_EQUIVALENCES = "kiro-equivalences"

export const DEFAULT_SHALOM_CATEGORIES: OperatorPackageCategory[] = [
  { id: "shalom-xs", operatorId: "shalom", categoryName: "Caja XS", description: "Ultra pequeña", maxLengthCm: 15, maxWidthCm: 10, maxHeightCm: 5, maxWeightKg: 0.5 },
  { id: "shalom-s", operatorId: "shalom", categoryName: "Caja S", description: "Pequeña", maxLengthCm: 25, maxWidthCm: 20, maxHeightCm: 15, maxWeightKg: 2 },
  { id: "shalom-m", operatorId: "shalom", categoryName: "Caja M", description: "Mediana", maxLengthCm: 35, maxWidthCm: 25, maxHeightCm: 20, maxWeightKg: 5 },
  { id: "shalom-l", operatorId: "shalom", categoryName: "Caja L", description: "Grande", maxLengthCm: 45, maxWidthCm: 35, maxHeightCm: 25, maxWeightKg: 10 },
  { id: "shalom-xl", operatorId: "shalom", categoryName: "Caja XL", description: "Extra grande", maxLengthCm: 60, maxWidthCm: 40, maxHeightCm: 30, maxWeightKg: 20 },
  { id: "shalom-bolsa", operatorId: "shalom", categoryName: "Bolsa Courier", description: "Bolsa flexible", maxLengthCm: null, maxWidthCm: null, maxHeightCm: null, maxWeightKg: 2 },
]

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export interface PackagingFormData {
  name: string
  type: PackagingType | ""
  lengthCm: string
  widthCm: string
  heightCm: string
  maxWeightKg: string
  operatorCategoryId: string
  status: "active" | "inactive"
}

export interface PackagingFormErrors {
  name?: string
  type?: string
  lengthCm?: string
  widthCm?: string
  heightCm?: string
  maxWeightKg?: string
  operatorCategoryId?: string
}

export function validatePackagingForm(data: PackagingFormData): PackagingFormErrors {
  const errors: PackagingFormErrors = {}

  if (!data.name.trim()) errors.name = "El nombre del empaque es requerido"
  if (!data.type) errors.type = "Selecciona un tipo de empaque"

  if (data.type && !isFlexibleType(data.type as PackagingType)) {
    if (!data.lengthCm || Number(data.lengthCm) <= 0) errors.lengthCm = "Debe ser mayor a 0"
    else if (Number(data.lengthCm) < 0) errors.lengthCm = "No puede ser negativo"
    if (!data.widthCm || Number(data.widthCm) <= 0) errors.widthCm = "Debe ser mayor a 0"
    else if (Number(data.widthCm) < 0) errors.widthCm = "No puede ser negativo"
    if (!data.heightCm || Number(data.heightCm) <= 0) errors.heightCm = "Debe ser mayor a 0"
    else if (Number(data.heightCm) < 0) errors.heightCm = "No puede ser negativo"
  }

  if (!data.maxWeightKg || Number(data.maxWeightKg) <= 0) errors.maxWeightKg = "Debe ser mayor a 0"
  if (!data.operatorCategoryId) errors.operatorCategoryId = "Selecciona una categoría Shalom"

  return errors
}

export function usePackagingConfig() {
  const [packagings, setPackagings] = useState<Packaging[]>(() =>
    loadFromStorage(STORAGE_KEY_PACKAGINGS, [])
  )
  const [equivalences, setEquivalences] = useState<PackagingEquivalence[]>(() =>
    loadFromStorage(STORAGE_KEY_EQUIVALENCES, [])
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PACKAGINGS, JSON.stringify(packagings))
  }, [packagings])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIVALENCES, JSON.stringify(equivalences))
  }, [equivalences])

  const addPackaging = useCallback(
    (data: Omit<Packaging, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const packaging: Packaging = {
        ...data,
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        createdAt: now,
        updatedAt: now,
      }
      setPackagings((prev) => [...prev, packaging])
      return packaging
    },
    []
  )

  const updatePackaging = useCallback(
    (id: string, data: Partial<Omit<Packaging, "id" | "createdAt" | "updatedAt">>) => {
      setPackagings((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        )
      )
    },
    []
  )

  const deletePackaging = useCallback((id: string) => {
    setPackagings((prev) => prev.filter((p) => p.id !== id))
    setEquivalences((prev) => prev.filter((e) => e.packagingId !== id))
  }, [])

  const addEquivalence = useCallback(
    (data: Omit<PackagingEquivalence, "id">) => {
      const equivalence: PackagingEquivalence = {
        ...data,
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      }
      setEquivalences((prev) => [...prev, equivalence])
      return equivalence
    },
    []
  )

  const updateEquivalence = useCallback(
    (id: string, data: Partial<Omit<PackagingEquivalence, "id">>) => {
      setEquivalences((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      )
    },
    []
  )

  const deleteEquivalence = useCallback((id: string) => {
    setEquivalences((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const simulateSave = useCallback(async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
  }, [])

  return {
    packagings,
    equivalences,
    shalomCategories: DEFAULT_SHALOM_CATEGORIES,
    saving,
    addPackaging,
    updatePackaging,
    deletePackaging,
    addEquivalence,
    updateEquivalence,
    deleteEquivalence,
    simulateSave,
  }
}
