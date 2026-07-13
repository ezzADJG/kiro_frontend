export type PackagingType =
  | "caja"
  | "sobre"
  | "otro"

export const PACKAGING_TYPE_LABELS: Record<PackagingType, string> = {
  caja: "Caja",
  sobre: "Sobre",
  otro: "Otro",
}

export const PACKAGING_TYPES: { value: PackagingType; label: string }[] = [
  { value: "caja", label: "Caja" },
  { value: "sobre", label: "Sobre" },
  { value: "otro", label: "Otro" },
]

export function isFlexibleType(type: PackagingType): boolean {
  return type === "otro"
}

export interface Packaging {
  id: string
  name: string
  type: PackagingType
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  maxWeightKg: number
  status: "active" | "inactive"
  operatorCategoryId: string | null
  createdAt: string
  updatedAt: string
}

export interface LogisticOperator {
  id: string
  name: string
  status: "active" | "inactive"
}

export interface OperatorPackageCategory {
  id: string
  operatorId: string
  categoryName: string
  description: string | null
  maxLengthCm: number | null
  maxWidthCm: number | null
  maxHeightCm: number | null
  maxWeightKg: number | null
}

