import type { BusinessTypeField } from '@/types/business'

export function formatFieldLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function hasField(campos: BusinessTypeField[], key: string): boolean {
  return campos.some((c) => c.key === key)
}

export function getActiveFieldOptions(
  items: Record<string, any> | null,
  fieldKey: string
) {
  if (!items) return []

  const unique = new Set<string>()
  for (const item of Object.values(items)) {
    if (!item?.activo) continue
    const value = item[fieldKey]
    if (typeof value === 'string' && value.trim()) {
      unique.add(value.trim())
    }
  }

  return [...unique].sort((a, b) => a.localeCompare(b, 'es'))
}

export function buildOptionsByField(
  campos: BusinessTypeField[],
  items: Record<string, any> | null
) {
  const result: Record<string, string[]> = {}
  for (const campo of campos) {
    if (campo.tipo === 'select') {
      result[campo.key] = getActiveFieldOptions(items, campo.key)
    }
  }
  return result
}

export function isFieldComplete(
  field: BusinessTypeField,
  value: unknown
) {
  if (!field.requerido) return true
  if (field.tipo === 'booleano') return typeof value === 'boolean'
  if (field.tipo === 'numero') return typeof value === 'number' && !Number.isNaN(value)
  if (field.tipo === 'select' || field.tipo === 'texto') {
    return typeof value === 'string' && value.trim().length > 0
  }
  return false
}

export function getRequiredFieldCount(campos: BusinessTypeField[]) {
  return campos.filter((c) => c.requerido).length
}

export function getCompletedRequiredCount(
  campos: BusinessTypeField[],
  draft: Record<string, unknown>
) {
  return campos.filter((c) => c.requerido && isFieldComplete(c, draft[c.key])).length
}
