import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Trash2,
} from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'
import { downloadTemplate, parseFile, type ParsedRow, type ParseError } from '@/lib/excel'
import { formatFieldLabel } from '@/lib/inventory'

type Step = 'select' | 'analyzing' | 'preview' | 'result'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  campos: BusinessTypeField[]
  dataType: 'stock' | 'services'
  businessId: string
  businessName: string
  industry: string
  onImport: (newItems: Record<string, any>[]) => Promise<void>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function ImportModal({
  open,
  onClose,
  campos,
  dataType,
  businessId,
  businessName,
  industry,
  onImport,
}: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('select')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [errors, setErrors] = useState<ParseError[]>([])
  const [importing, setImporting] = useState(false)
  const [importCount, setImportCount] = useState(0)
  const [dropActive, setDropActive] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const reset = () => {
    setStep('select')
    setFile(null); setFileName(''); setFileSize(0)
    setRows([]); setErrors([])
    setImporting(false); setImportCount(0)
    setFileError(null); setShowCancelConfirm(false)
  }

  useEffect(() => { if (!open) reset() }, [open])

  if (!open) return null

  const validateFile = (f: File): string | null => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) return 'Formato no soportado. Usa .csv, .xlsx o .xls.'
    if (f.size > MAX_FILE_SIZE) return `El archivo excede el límite de 10MB (${(f.size / 1024 / 1024).toFixed(1)}MB).`
    return null
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFileError(null)
    const err = validateFile(f)
    if (err) { setFileError(err); return }
    setFile(f)
    setFileName(f.name)
    setFileSize(f.size)
  }

  const handleContinue = async () => {
    if (!file) return
    setStep('analyzing')
    setErrors([])
    const result = await parseFile(file, campos)
    if (result.errors.length > 0) {
      setErrors(result.errors)
      setStep('select')
      return
    }
    if (result.rows.length === 0) {
      setFileError('No se encontraron datos en el archivo.')
      setStep('select')
      return
    }
    setRows(result.rows)
    setStep('preview')
  }

  const handleImportConfirm = async () => {
    setImporting(true)
    const payloads = rows.map((r) => ({
      ...r.data,
      activo: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
    try {
      await onImport(payloads)
      setImportCount(payloads.length)
      setStep('result')
    } catch {
      setErrors([{ row: 0, column: '', message: 'Error al importar los datos.' }])
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => { reset(); onClose() }
  const handleCancelClick = () => {
    if (file && step !== 'result') setShowCancelConfirm(true)
    else handleClose()
  }
  const removeFile = () => {
    setFile(null); setFileName(''); setFileSize(0); setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const itemLabel = dataType === 'services' ? 'servicios' : 'productos'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-lg dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <button onClick={handleCancelClick} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-medium">Importar {itemLabel}</h2>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto px-6 ${step === 'select' || step === 'analyzing' ? 'flex items-center justify-center' : 'py-5'}`}>
          {step === 'select' && (
            <div className="w-full max-w-lg space-y-6">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
                <h3 className="mb-1 text-sm font-medium">Descargar modelo de planilla</h3>
                <p className="mb-3 text-xs text-neutral-500">Completa la plantilla con tus {itemLabel} y súbela cuando esté lista.</p>
                <Button className="bg-black text-white hover:bg-neutral-800" onClick={() => downloadTemplate(campos, industry, dataType)}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar plantilla
                </Button>
              </div>

              <div
                onDrop={(e) => { e.preventDefault(); setDropActive(false); handleFile(e.dataTransfer.files[0]) }}
                onDragOver={(e) => { e.preventDefault(); setDropActive(true) }}
                onDragLeave={() => setDropActive(false)}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors ${
                  dropActive ? 'border-neutral-500 bg-neutral-50' : fileError ? 'border-red-300 bg-red-50/50' : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-600'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' && !file) fileInputRef.current?.click() }}
                aria-label="Seleccionar archivo"
              >
                {!file ? (
                  <>
                    <Upload className="h-10 w-10 text-neutral-300" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Arrastra y suelta tu archivo aquí</p>
                      <p className="mt-1 text-xs text-neutral-400">Formatos: CSV, XLSX, XLS (máx 10MB)</p>
                    </div>
                    <Button variant="outline" className="rounded-full bg-black text-white hover:bg-neutral-800 hover:text-white" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                      Seleccionar archivo
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <FileText className="h-8 w-8 text-neutral-600" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{fileName}</p>
                      <p className="text-xs text-neutral-400">{(fileSize / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={removeFile} className="ml-4 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </div>

              {fileError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{fileError}
                </div>
              )}
              {errors.length > 0 && (
                <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-600">{errors.length} error(es)</p>
                  {errors.slice(0, 3).map((err, i) => (
                    <p key={i} className="text-xs text-red-500">{err.row > 0 ? `Fila ${err.row}: ` : ''}{err.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-neutral-600" />
              <p className="text-sm font-medium text-neutral-700">Procesando archivo...</p>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-5">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-2xl font-bold text-blue-600">{rows.length}</p>
                <p className="text-xs text-blue-500">{itemLabel} nuevos</p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-neutral-700">Vista previa ({rows.length} filas)</h3>
                <div className="max-h-64 overflow-x-auto rounded-lg border border-neutral-200 bg-white text-xs dark:bg-neutral-800">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-800">
                        <th className="px-3 py-2 text-left text-neutral-500">#</th>
                        {campos.slice(0, 6).map((c) => (
                          <th key={c.key} className="px-3 py-2 text-left text-neutral-500">{c.label || formatFieldLabel(c.key)}</th>
                        ))}
                        {campos.length > 6 && <th className="px-3 py-2 text-left text-neutral-400">...</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                          <td className="px-3 py-2 text-neutral-400">{row.rowNumber}</td>
                          {campos.slice(0, 6).map((c) => (
                            <td key={c.key} className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{String(row.data[c.key] ?? '-')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && <p className="mt-1 text-center text-xs text-neutral-400">Mostrando 10 de {rows.length} filas.</p>}
              </div>

              {errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-600">{errors.length} error(es) de validación</p>
                  {errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="mt-1 text-xs text-red-500">
                      {err.row > 0 ? `Fila ${err.row}: ` : ''}{err.column ? `Columna "${formatFieldLabel(err.column)}": ` : ''}{err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'result' && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Importación completada</h3>
              <p className="text-sm text-muted-foreground">{importCount} {itemLabel} importados</p>
              <Button onClick={handleClose} className="mt-2 bg-black text-white hover:bg-neutral-800">Cerrar</Button>
            </div>
          )}
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
              <h3 className="text-sm font-medium">¿Descartar archivo?</h3>
              <p className="mt-2 text-xs text-neutral-500">Si cierras, perderás el archivo cargado.</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Seguir</Button>
                <Button className="bg-black text-white hover:bg-neutral-800" onClick={() => { setShowCancelConfirm(false); handleClose() }}>Descartar</Button>
              </div>
            </div>
          </div>
        )}

        {step !== 'result' && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <Button variant="outline" onClick={handleCancelClick} className="border-neutral-300 text-neutral-700">Cancelar</Button>
            <Button
              onClick={step === 'preview' ? handleImportConfirm : handleContinue}
              disabled={importing || (step === 'select' ? !file || !!fileError : false)}
              className="bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              {importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</> : step === 'preview' ? 'Importar productos' : 'Continuar'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
