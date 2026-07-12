export type PackagingType =
  | "caja"
  | "bolsa_courier"
  | "sobre"
  | "tubo"
  | "otro"

export const PACKAGING_TYPE_LABELS: Record<PackagingType, string> = {
  caja: "Caja",
  bolsa_courier: "Bolsa Courier",
  sobre: "Sobre",
  tubo: "Tubo",
  otro: "Otro",
}

export const PACKAGING_TYPES: { value: PackagingType; label: string }[] = [
  { value: "caja", label: "Caja" },
  { value: "bolsa_courier", label: "Bolsa Courier" },
  { value: "sobre", label: "Sobre" },
  { value: "tubo", label: "Tubo" },
  { value: "otro", label: "Otro" },
]

export function isFlexibleType(type: PackagingType): boolean {
  return type === "bolsa_courier"
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

