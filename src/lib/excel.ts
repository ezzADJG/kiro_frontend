import ExcelJS from 'exceljs'
import type { BusinessTypeField } from '@/types/business'
import { formatFieldLabel } from './inventory'

const INDUSTRY_EXAMPLES: Record<string, Record<string, string>> = {
  restaurant: {
    nombre: 'Lomo saltado',
    categoria: 'Platos de fondo',
    precio: '28.00',
    unidad: 'plato',
  },
  retail: {
    nombre: 'Camiseta básica',
    categoria: 'Ropa',
    precio: '49.90',
    stock: '50',
    color: 'Negro',
    talla: 'M',
    marca: 'Nike',
  },
  tienda_ropa: {
    nombre: 'Camiseta básica',
    categoria: 'Ropa',
    precio: '49.90',
    stock: '50',
    color: 'Negro',
    talla: 'M',
    marca: 'Nike',
  },
  barberia: {
    nombre: 'Corte de cabello',
    categoria: 'Cortes',
    precio: '25.00',
    duracion_minutos: '30',
    stock_actual: '10',
  },
  taller_mecanico: {
    nombre: 'Cambio de aceite',
    categoria: 'Mantenimiento',
    precio_venta: '80.00',
    duracion_minutos: '60',
    stock_actual: '20',
  },
  hotel: {
    nombre: 'Habitación doble',
    categoria: 'Habitaciones',
    precio: '120.00',
    stock_actual: '10',
    duracion_minutos: '1440',
  },
  clinica: {
    nombre: 'Consulta general',
    especialidad: 'Medicina general',
    precio_venta: '50.00',
    duracion_minutos: '30',
    stock_actual: '100',
  },
  inmobiliaria: {
    nombre: 'Departamento en Miraflores',
    tipo_propiedad: 'Departamento',
    precio: '250000.00',
    area_m2: '80',
    habitaciones: '3',
    ubicacion: 'Miraflores, Lima',
  },
}

function getFileExtension(file: File): string {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return 'csv'
  if (name.endsWith('.xls')) return 'xls'
  return 'xlsx'
}

async function bufferFromFile(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

export interface ParsedRow {
  rowNumber: number
  data: Record<string, string | number | boolean>
  id?: string
}

export interface ParseError {
  row: number
  column: string
  message: string
}

export interface Modification {
  row: ParsedRow
  changes: Record<string, { from: unknown; to: unknown }>
}

export interface ImportSummary {
  newItems: ParsedRow[]
  modifiedItems: Modification[]
  unchangedCount: number
  errors: ParseError[]
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function buildHeaderMap(
  headers: string[],
  campos: BusinessTypeField[]
): Map<string, BusinessTypeField> {
  const map = new Map<string, BusinessTypeField>()
  for (const campo of campos) {
    const normalizedKey = normalizeHeader(campo.key)
    const normalizedLabel = campo.label ? normalizeHeader(campo.label) : ''
    const normalizedFormatted = normalizeHeader(formatFieldLabel(campo.key))

    for (const header of headers) {
      const nh = normalizeHeader(header)
      if (
        nh === normalizedKey ||
        nh === normalizedLabel ||
        nh === normalizedFormatted
      ) {
        map.set(header, campo)
        break
      }
    }
  }
  return map
}

function parseBooleanValue(value: string): boolean | null {
  const v = value.toLowerCase().trim()
  const trueValues = ['si', 'sí', 'yes', 'true', '1', 'activo', 'disponible', 'habilitado']
  const falseValues = ['no', 'not', 'false', '0', 'inactivo', 'deshabilitado']
  if (trueValues.includes(v)) return true
  if (falseValues.includes(v)) return false
  return null
}

function parseNumberValue(value: string): number | null {
  const cleaned = value.trim().replace(/[,$]/g, '').replace(/\s/g, '')
  if (cleaned === '') return null
  const parsed = Number(cleaned.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function convertValue(
  raw: string,
  campo: BusinessTypeField
): { value: string | number | boolean; error?: string } {
  const str = String(raw ?? '').trim()
  if (!str) return { value: str }

  if (campo.tipo === 'numero') {
    const num = parseNumberValue(str)
    if (num === null) {
      return { value: str, error: `"${str}" no es un número válido` }
    }
    return { value: num }
  }

  if (campo.tipo === 'booleano') {
    const bool = parseBooleanValue(str)
    if (bool === null) {
      return { value: str, error: `"${str}" no es Sí/No válido` }
    }
    return { value: bool }
  }

  return { value: str }
}

export async function parseFile(
  file: File,
  campos: BusinessTypeField[]
): Promise<{ rows: ParsedRow[]; errors: ParseError[] }> {
  const ext = getFileExtension(file)
  const buffer = await bufferFromFile(file)
  const workbook = new ExcelJS.Workbook()
  const errors: ParseError[] = []
  const rows: ParsedRow[] = []

  try {
    if (ext === 'csv') {
      const text = new TextDecoder().decode(buffer)
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        errors.push({ row: 0, column: '', message: 'El archivo está vacío o solo tiene encabezados' })
        return { rows, errors }
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      const headerMap = buildHeaderMap(headers, campos)
      const idIndex = headers.findIndex((h) => normalizeHeader(h) === 'id')

      const idField = campos.find((c) => c.key === 'id')
      const mappedHeaders = headers.filter((h) => headerMap.has(h))

      if (mappedHeaders.length === 0) {
        errors.push({ row: 0, column: '', message: 'Ninguna columna coincide con el esquema. Verifica los encabezados.' })
        return { rows, errors }
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const vals = parseCSVLine(line)
        const data: Record<string, string | number | boolean> = {}
        let hasError = false

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j]
          const campo = headerMap.get(header)
          if (!campo) continue
          const raw = vals[j] ?? ''
          const result = convertValue(raw, campo)
          if (result.error) {
            errors.push({ row: i + 1, column: campo.key, message: result.error })
            hasError = true
          }
          data[campo.key] = result.value
        }

        rows.push({
          rowNumber: i + 1,
          data,
          id: idIndex >= 0 ? vals[idIndex]?.trim() || undefined : undefined,
        })
      }
    } else {
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        errors.push({ row: 0, column: '', message: 'No se encontró la hoja de cálculo' })
        return { rows, errors }
      }

      const rowCount = worksheet.rowCount
      if (rowCount < 2) {
        errors.push({ row: 0, column: '', message: 'El archivo está vacío o solo tiene encabezados' })
        return { rows, errors }
      }

      const headerRow = worksheet.getRow(1)
      const headers: string[] = []
      headerRow.eachCell((cell) => {
        headers.push(String(cell.value ?? ''))
      })

      const headerMap = buildHeaderMap(headers, campos)
      const idIndex = headers.findIndex((h) => normalizeHeader(h) === 'id')

      const mappedHeaders = headers.filter((h) => headerMap.has(h))
      if (mappedHeaders.length === 0) {
        errors.push({ row: 0, column: '', message: 'Ninguna columna coincide con el esquema. Verifica los encabezados.' })
        return { rows, errors }
      }

      for (let i = 2; i <= rowCount; i++) {
        const row = worksheet.getRow(i)
        const data: Record<string, string | number | boolean> = {}
        let hasError = false

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j]
          const campo = headerMap.get(header)
          if (!campo) continue
          const cell = row.getCell(j + 1)
          let raw = String(cell.value ?? '').trim()
          if (raw === 'null' || raw === 'undefined') raw = ''

          const result = convertValue(raw, campo)
          if (result.error) {
            errors.push({ row: i, column: campo.key, message: result.error })
            hasError = true
          }
          data[campo.key] = result.value
        }

        rows.push({
          rowNumber: i,
          data,
          id: idIndex >= 0 ? String(row.getCell(idIndex + 1).value ?? '').trim() || undefined : undefined,
        })
      }
    }
  } catch (e) {
    errors.push({ row: 0, column: '', message: `Error al leer el archivo: ${e instanceof Error ? e.message : 'desconocido'}` })
  }

  return { rows, errors }
}

export function detectChanges(
  rows: ParsedRow[],
  existingItems: Record<string, any> | null
): ImportSummary {
  const newItems: ParsedRow[] = []
  const modifiedItems: Modification[] = []
  let unchangedCount = 0

  for (const row of rows) {
    if (!row.id || !existingItems?.[row.id]) {
      newItems.push(row)
      continue
    }

    const existing = existingItems[row.id]
    const changes: Record<string, { from: unknown; to: unknown }> = {}

    for (const [key, value] of Object.entries(row.data)) {
      if (key === 'activo' || key === 'createdAt' || key === 'updatedAt') continue
      const existingVal = existing[key]
      if (String(value) !== String(existingVal)) {
        changes[key] = { from: existingVal, to: value }
      }
    }

    if (Object.keys(changes).length > 0) {
      modifiedItems.push({ row, changes })
    } else {
      unchangedCount++
    }
  }

  return { newItems, modifiedItems, unchangedCount, errors: [] }
}

function buildWorkbook(
  campos: BusinessTypeField[],
  rows: Record<string, any>[],
  includeId: boolean
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Datos')

  const columns: { header: string; key: string; width: number }[] = []

  if (includeId) {
    columns.push({ header: 'id', key: 'id', width: 28 })
  }

  for (const campo of campos) {
    columns.push({
      header: campo.label || formatFieldLabel(campo.key),
      key: campo.key,
      width: Math.max(
        (campo.label || formatFieldLabel(campo.key)).length + 4,
        16
      ),
    })
  }

  ws.columns = columns
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8ECF0' },
    }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  }

  for (const row of rows) {
    ws.addRow(row)
  }

  return workbook
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadTemplate(
  campos: BusinessTypeField[],
  industry: string,
  dataType: 'stock' | 'services'
) {
  const industryExamples = INDUSTRY_EXAMPLES[industry] || {}

  const exampleRow: Record<string, any> = {}
  for (const campo of campos) {
    exampleRow[campo.key] =
      industryExamples[campo.key] ||
      (campo.tipo === 'numero' ? '0' : campo.tipo === 'booleano' ? 'Sí' : '')
  }

  const workbook = buildWorkbook(campos, [exampleRow], false)

  const label = dataType === 'services' ? 'servicios' : 'productos'
  await downloadWorkbook(workbook, `plantilla_${label}_${industry}.xlsx`)
}

export async function exportData(
  campos: BusinessTypeField[],
  items: Record<string, any>,
  businessName: string,
  dataType: 'stock' | 'services'
) {
  const rows: Record<string, any>[] = []

  for (const [id, item] of Object.entries(items)) {
    const row: Record<string, any> = { id }
    for (const campo of campos) {
      row[campo.key] = item[campo.key] ?? ''
    }
    rows.push(row)
  }

  const workbook = buildWorkbook(campos, rows, true)
  const label = dataType === 'services' ? 'servicios' : 'stock'
  const safeName = businessName.replace(/[^a-zA-Z0-9]/g, '_')
  await downloadWorkbook(workbook, `${safeName}_${label}.xlsx`)
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

import type { DeliveryOrder } from '@/types/payments'
import type { ShippingConfig } from '@/services/shippingConfigService'
import shalomTemplateUrl from '../excel/shalom.xlsx?url'
import olvaTemplateUrl from '../excel/olva.xlsx?url'

interface ShippingDataEntry {
  transportista?: string
  datosEnvio?: Record<string, any>
}

function safe(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val)
}

async function loadWorkbookFromUrl(url: string): Promise<ExcelJS.Workbook> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  return workbook
}

function splitAddress(address: string): { direccion: string; distrito: string; provincia: string; departamento: string } {
  const parts = address.split(',').map((p) => p.trim())
  return {
    direccion: parts[0] || '',
    distrito: parts[1] || '',
    provincia: parts[2] || '',
    departamento: parts[3] || '',
  }
}

function splitCustomerName(name: string): { nombres: string; apellidoPaterno: string; apellidoMaterno: string } {
  const parts = name.trim().split(/\s+/)
  return {
    nombres: parts[0] || '',
    apellidoPaterno: parts[1] || '',
    apellidoMaterno: parts.slice(2).join(' ') || '',
  }
}

function productsDescription(products: DeliveryOrder['products']): string {
  return products.map((p) => `${p.quantity}x ${p.name}`).join(', ')
}

export async function exportToShalomExcel(
  orders: DeliveryOrder[],
  shippingDataMap: Record<string, ShippingDataEntry>,
  config: ShippingConfig | null
): Promise<void> {
  const workbook = await loadWorkbookFromUrl(shalomTemplateUrl)
  const ws = workbook.getWorksheet('Hoja1')
  if (!ws) {
    throw new Error('No se encontró la hoja de cálculo en la plantilla de Shalom')
  }

  const originAgency = config?.shalom?.agenciaSeleccionada?.nombre || ''

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const sd = shippingDataMap[order.id]?.datosEnvio as Record<string, any> | undefined
    const row = ws.getRow(i + 2)

    row.getCell(2).value = safe(sd?.documentoDestinatario || order.customerDNI)
    row.getCell(3).value = safe(sd?.telefonoDestinatario || order.customerPhone)
    row.getCell(4).value = safe(sd?.documentoContacto || sd?.documentoDestinatario || order.customerDNI)
    row.getCell(5).value = safe(sd?.telefonoContacto || sd?.telefonoDestinatario || order.customerPhone)
    row.getCell(6).value = safe(order.purchaseNumber)
    row.getCell(7).value = safe(originAgency)
    row.getCell(8).value = safe(sd?.agenciaDestino || '')
    row.getCell(9).value = safe(sd?.descripcionMercaderia || productsDescription(order.products))
    row.getCell(14).value = 1

    row.commit()
  }

  await downloadWorkbook(workbook, 'envios_shalom.xlsx')
}

export async function exportToOlvaExcel(
  orders: DeliveryOrder[],
  shippingDataMap: Record<string, ShippingDataEntry>,
  _config: ShippingConfig | null
): Promise<void> {
  const workbook = await loadWorkbookFromUrl(olvaTemplateUrl)
  const ws = workbook.getWorksheet('InputData')
  if (!ws) {
    throw new Error('No se encontró la hoja InputData en la plantilla de Olva')
  }

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const sd = shippingDataMap[order.id]?.datosEnvio as Record<string, any> | undefined
    const addr = splitAddress(order.deliveryAddress)
    const nameParts = splitCustomerName(order.customerName)
    const row = ws.getRow(i + 5)

    row.getCell(1).value = safe(order.purchaseNumber)
    row.getCell(2).value = 'DOMICILIO'
    row.getCell(3).value = safe(addr.departamento)
    row.getCell(4).value = safe(addr.provincia)
    row.getCell(5).value = safe(addr.distrito)
    row.getCell(6).value = safe(addr.direccion)
    row.getCell(7).value = ''
    row.getCell(8).value = ''
    row.getCell(9).value = ''
    row.getCell(10).value = safe(sd?.tipoArticulo || '')
    row.getCell(11).value = safe(productsDescription(order.products))
    row.getCell(12).value = order.totalAmount
    row.getCell(13).value = ''
    row.getCell(14).value = ''
    row.getCell(15).value = ''
    row.getCell(16).value = ''
    row.getCell(17).value = ''
    row.getCell(18).value = ''
    row.getCell(19).value = safe(sd?.tipoDocumento || 'DNI')
    row.getCell(20).value = safe(order.customerDNI)
    row.getCell(21).value = safe(sd?.celular || order.customerPhone)
    row.getCell(22).value = safe(sd?.razonSocial || order.customerName)
    row.getCell(23).value = safe(sd?.contacto || order.customerPhone)
    row.getCell(24).value = safe(nameParts.nombres)
    row.getCell(25).value = safe(sd?.apellidoPaterno || nameParts.apellidoPaterno)
    row.getCell(26).value = safe(sd?.apellidoMaterno || nameParts.apellidoMaterno)

    row.commit()
  }

  const lastDataRow = 5 + orders.length
  for (let r = lastDataRow; r <= 104; r++) {
    const row = ws.getRow(r)
    for (let c = 1; c <= 26; c++) {
      row.getCell(c).value = null
    }
    row.commit()
  }

  await downloadWorkbook(workbook, 'envios_olva.xlsx')
}
