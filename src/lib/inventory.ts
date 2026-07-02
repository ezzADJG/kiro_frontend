import type { BusinessProduct } from '@/types'
import type { BusinessTypeField } from '@/types/business'
import type { CatalogKind } from '@/types'

export function formatFieldLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function slugifyHandle(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const CATALOG_KIND_OPTIONS: { value: CatalogKind; label: string }[] = [
  { value: 'product', label: 'Producto' },
  { value: 'variant', label: 'Variante' },
  { value: 'service', label: 'Servicio' },
  { value: 'combo', label: 'Combo / Kit' },
]

export function getCatalogKindLabel(kind: CatalogKind) {
  return CATALOG_KIND_OPTIONS.find((option) => option.value === kind)?.label ??
    'Producto'
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function getActiveFieldOptions(
  products: Record<string, BusinessProduct> | null,
  fieldKey: string
) {
  if (!products) return []

  const unique = new Set<string>()
  for (const product of Object.values(products)) {
    if (!product?.activo) continue
    const value = product[fieldKey]
    if (typeof value === 'string' && value.trim()) {
      unique.add(value.trim())
    }
  }

  return [...unique].sort((a, b) => a.localeCompare(b, 'es'))
}

export function buildOptionsByField(
  campos: BusinessTypeField[],
  products: Record<string, BusinessProduct> | null
) {
  const result: Record<string, string[]> = {}
  for (const campo of campos) {
    if (campo.tipo === 'select') {
      result[campo.key] = getActiveFieldOptions(products, campo.key)
    }
  }
  return result
}

function extractMoneyValue(text: string) {
  const moneyMatch = text.match(
    /(?:s\/?\s*)?(\d{1,6}(?:[.,]\d{1,2})?)(?=\s*(?:soles|s\b|p\b|$))/i
  )
  if (!moneyMatch) return null
  const parsed = Number(moneyMatch[1].replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function extractIntegerValue(text: string) {
  const intMatch = text.match(/\b(\d{1,6})\b/)
  if (!intMatch) return null
  const parsed = Number(intMatch[1])
  return Number.isFinite(parsed) ? parsed : null
}

export function parseDraftFromText(
  text: string,
  campos: BusinessTypeField[],
  optionsByField: Record<string, string[]>
) {
  const draft: Record<string, string | number | boolean> = {}
  const normalizedText = normalize(text)

  for (const campo of campos) {
    const normalizedKey = normalize(campo.key)
    const label = normalize(campo.label || formatFieldLabel(campo.key))

    if (campo.tipo === 'booleano') {
      if (/\b(si|sí|activo|disponible|habilitado|true|yes)\b/i.test(text)) {
        draft[campo.key] = true
      } else if (
        /\b(no|inactivo|deshabilitado|false)\b/i.test(text)
      ) {
        draft[campo.key] = false
      }
      continue
    }

    if (campo.tipo === 'numero') {
      const value = extractMoneyValue(text) ?? extractIntegerValue(text)
      if (value !== null) {
        draft[campo.key] = value
      }
      continue
    }

    if (campo.tipo === 'select') {
      const options = optionsByField[campo.key] ?? []
      const matched = options.find((option) => {
        const normalizedOption = normalize(option)
        return normalizedText.includes(normalizedOption)
      })
      if (matched) {
        draft[campo.key] = matched
        continue
      }
    }

    const keyMatch = normalizedText.match(
      new RegExp(`(?:${normalizedKey}|${label})\\s*(?:es|:)?\\s*([^,.;]+)`, 'i')
    )
    if (keyMatch?.[1]) {
      draft[campo.key] = keyMatch[1].trim()
    }
  }

  const firstTextField = campos.find(
    (campo) => campo.tipo === 'texto' && /nombre|producto|titulo|item/i.test(campo.key)
  )
  if (firstTextField && !draft[firstTextField.key]) {
    const candidate = text
      .replace(/\b(agrega|añade|anade|crear|crea|nuevo|nueva|producto|item|articulo|artículo)\b/gi, '')
      .split(/\b(?:a|de|con|por|para)\b/i)[0]
      .replace(/[.,;]+$/, '')
      .trim()
    if (candidate) {
      draft[firstTextField.key] = candidate
    }
  }

  return draft
}

export function isFieldComplete(
  field: BusinessTypeField,
  value: unknown
) {
  if (field.tipo === 'booleano') return typeof value === 'boolean'
  if (field.tipo === 'numero') return typeof value === 'number' && !Number.isNaN(value)
  if (field.tipo === 'select' || field.tipo === 'texto') {
    return typeof value === 'string' && value.trim().length > 0
  }
  return false
}
