import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  Trash2,
} from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'
import {
  exportData,
  parseFile,
  detectChanges,
  type ParsedRow,
  type ParseError,
  type ImportSummary,
} from '@/lib/excel'
import { formatFieldLabel } from '@/lib/inventory'

type Step = 'download' | 'analyzing' | 'preview' | 'result'

interface BulkEditModalProps {
  open: boolean
  onClose: () => void
  campos: BusinessTypeField[]
  existingItems: Record<string, any> | null
  dataType: 'stock' | 'services'
  businessId: string
  businessName: string
  onImport: (
    newItems: Record<string, any>[],
    modifiedItems: { id: string; values: Record<string, any> }[]
  ) => Promise<void>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function BulkEditModal({
  open,
  onClose,
  campos,
  existingItems,
  dataType,
  businessId,
  businessName,
  onImport,
}: BulkEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('download')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [errors, setErrors] = useState<ParseError[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ modifiedCount: number; unchangedCount: number } | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [dropActive, setDropActive] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const hasProgress = file !== null

  const reset = () => {
    setStep('download')
    setFile(null)
    setFileName('')
    setRows([])
    setErrors([])
    setSummary(null)
    setImporting(false)
    setResult(null)
    setShowDetails(false)
    setFileError(null)
    setShowCancelConfirm(false)
  }

  useEffect(() => {
    if (!open) reset()
  }, [open])

  if (!open) return null

  const validateFile = (f: File): string | null => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return 'Formato no soportado. Usa .csv, .xlsx o .xls.'
    }
    if (f.size > MAX_FILE_SIZE) {
      const mb = (f.size / 1024 / 1024).toFixed(1)
      return `El archivo excede el límite de 10MB (${mb}MB).`
    }
    return null
  }

  const handleFile = async (f: File | null) => {
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
      setStep('download')
      return
    }
    if (result.rows.length === 0) {
      setFileError('No se encontraron datos en el archivo.')
      setStep('download')
      return
    }
    setRows(result.rows)
    const detected = detectChanges(result.rows, existingItems)
    setSummary(detected)
    setStep('preview')
  }

  const handleConfirm = async () => {
    if (!summary) return
    setImporting(true)
    const modifiedPayloads = summary.modifiedItems
      .filter((m) => Object.keys(m.changes).length > 0)
      .map((m) => ({ id: m.row.id!, values: { ...m.row.data, updatedAt: Date.now() } }))
    try {
      // For bulk edit, only modified items are sent (new items with no id are also treated as modifications)
      await onImport([], modifiedPayloads)
      setResult({ modifiedCount: modifiedPayloads.length, unchangedCount: summary.unchangedCount })
      setStep('result')
    } catch {
      setErrors([{ row: 0, column: '', message: 'Error al aplicar cambios.' }])
    } finally {
      setImporting(false)
    }
  }

  const handleDownload = () => {
    if (existingItems && Object.keys(existingItems).length > 0) {
      exportData(campos, existingItems, businessName, dataType)
    }
  }

  const handleClose = () => { reset(); onClose() }

  const handleCancelClick = () => {
    if (hasProgress && step !== 'result') setShowCancelConfirm(true)
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <button onClick={handleCancelClick} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-medium">Edición masiva</h2>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto px-6 ${step === 'download' || step === 'analyzing' ? 'flex items-center justify-center' : 'py-5'}`}>
          {step === 'download' && (
            <div className="w-full max-w-lg space-y-6">
              {/* Download current stock */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
                <h3 className="text-sm font-medium">1. Descarga tu stock actual</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Descarga el archivo con tus {itemLabel} actuales, modifica los valores y vuelve a subirlo.
                </p>
                <Button
                  className="mt-3 bg-black text-white hover:bg-neutral-800"
                  onClick={handleDownload}
                  disabled={!existingItems || Object.keys(existingItems).length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar stock actual
                </Button>
              </div>

              {/* Dropzone */}
              <div>
                <h3 className="mb-2 text-sm font-medium">2. Sube el archivo modificado</h3>
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
                  aria-label="Subir archivo modificado"
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
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {fileError}
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-600">{errors.length} error(es) de validación</p>
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
              <p className="text-sm font-medium text-neutral-700">Procesando cambios...</p>
            </div>
          )}

          {step === 'preview' && summary && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-2xl font-bold text-amber-600">{summary.modifiedItems.length}</p>
                  <p className="text-xs text-amber-500">modificados</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-2xl font-bold text-neutral-500">{summary.unchangedCount}</p>
                  <p className="text-xs text-neutral-400">sin cambios</p>
                </div>
              </div>

              <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-neutral-700">
                {showDetails ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {showDetails ? 'Ocultar detalle' : 'Ver detalle'}
              </button>

              {showDetails && summary.modifiedItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-amber-600">Modificados ({summary.modifiedItems.length})</h4>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {summary.modifiedItems.slice(0, 10).map((mod, i) => (
                      <div key={i} className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs">
                        <p className="mb-1 font-medium text-neutral-700">{campos.find(c => c.key === 'nombre') ? String(mod.row.data['nombre'] ?? '-') : `Fila ${mod.row.rowNumber}`}</p>
                        {Object.entries(mod.changes).slice(0, 4).map(([key, change]) => (
                          <p key={key} className="text-neutral-500">
                            {formatFieldLabel(key)}: <span className="text-red-500 line-through">{String(change.from ?? '-')}</span> → <span className="text-green-600">{String(change.to ?? '-')}</span>
                          </p>
                        ))}
                        {Object.keys(mod.changes).length > 4 && <p className="text-neutral-400">...y {Object.keys(mod.changes).length - 4} más</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

          {step === 'result' && result && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Cambios aplicados</h3>
              <p className="text-center text-sm text-muted-foreground">
                {result.modifiedCount} {itemLabel} actualizados, {result.unchangedCount} sin cambios
              </p>
              <Button onClick={handleClose} className="mt-2 bg-black text-white hover:bg-neutral-800">
                Cerrar
              </Button>
            </div>
          )}
        </div>

        {/* Cancel confirm */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
              <h3 className="text-sm font-medium">¿Descartar cambios?</h3>
              <p className="mt-2 text-xs text-neutral-500">Tienes un archivo cargado. Si cierras, perderás el progreso.</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Seguir editando</Button>
                <Button className="bg-black text-white hover:bg-neutral-800" onClick={() => { setShowCancelConfirm(false); handleClose() }}>Descartar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {step !== 'result' && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <Button variant="outline" onClick={handleCancelClick} className="border-neutral-300 text-neutral-700">
              Cancelar
            </Button>
            {step === 'download' && (
              <Button
                onClick={handleContinue}
                disabled={!file || !!fileError}
                className="bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500"
                title={!file ? 'Sube un archivo para continuar' : undefined}
              >
                Continuar
              </Button>
            )}
            {step === 'preview' && (
              <Button
                onClick={handleConfirm}
                disabled={importing || (summary ? summary.modifiedItems.length === 0 : true)}
                className="bg-black text-white hover:bg-neutral-800"
              >
                {importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aplicando...</> : 'Aplicar cambios'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


