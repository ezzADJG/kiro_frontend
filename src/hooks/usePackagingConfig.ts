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
const STORAGE_KEY_VERSION = "kiro-packaging-version"
const CURRENT_VERSION = 2

export const DEFAULT_SHALOM_CATEGORIES: OperatorPackageCategory[] = [
  { id: "shalom-xxs", operatorId: "shalom", categoryName: "XXS", description: "Extra extra pequeña", maxLengthCm: 10, maxWidthCm: 8, maxHeightCm: 4, maxWeightKg: 0.3 },
  { id: "shalom-xs", operatorId: "shalom", categoryName: "XS", description: "Extra pequeña", maxLengthCm: 15, maxWidthCm: 10, maxHeightCm: 5, maxWeightKg: 0.5 },
  { id: "shalom-s", operatorId: "shalom", categoryName: "S", description: "Pequeña", maxLengthCm: 25, maxWidthCm: 20, maxHeightCm: 15, maxWeightKg: 2 },
  { id: "shalom-m", operatorId: "shalom", categoryName: "M", description: "Mediana", maxLengthCm: 35, maxWidthCm: 25, maxHeightCm: 20, maxWeightKg: 5 },
  { id: "shalom-l", operatorId: "shalom", categoryName: "L", description: "Grande", maxLengthCm: 45, maxWidthCm: 35, maxHeightCm: 25, maxWeightKg: 10 },
  { id: "shalom-sobre", operatorId: "shalom", categoryName: "Sobre", description: "Sobre", maxLengthCm: null, maxWidthCm: null, maxHeightCm: null, maxWeightKg: 2 },
  { id: "shalom-otra", operatorId: "shalom", categoryName: "Otra medida", description: "Medida personalizada", maxLengthCm: null, maxWidthCm: null, maxHeightCm: null, maxWeightKg: null },
]

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function clearStorageIfOldVersion() {
  const storedVersion = loadFromStorage<number>(STORAGE_KEY_VERSION, 0)
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(STORAGE_KEY_PACKAGINGS)
    localStorage.removeItem(STORAGE_KEY_EQUIVALENCES)
    localStorage.setItem(STORAGE_KEY_VERSION, JSON.stringify(CURRENT_VERSION))
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
  const [packagings, setPackagings] = useState<Packaging[]>(() => {
    clearStorageIfOldVersion()
    return loadFromStorage<Packaging[]>(STORAGE_KEY_PACKAGINGS, [])
  })
  const [equivalences, setEquivalences] = useState<PackagingEquivalence[]>(() => {
    clearStorageIfOldVersion()
    return loadFromStorage<PackagingEquivalence[]>(STORAGE_KEY_EQUIVALENCES, [])
  })
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
