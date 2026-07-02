import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Sparkles } from 'lucide-react'
import type { BusinessTypeField } from '@/types/business'
import {
  buildOptionsByField,
  formatFieldLabel,
  isFieldComplete,
  parseDraftFromText,
} from '@/lib/inventory'
import type { BusinessProduct } from '@/types'

type ChatRole = 'assistant' | 'user'

interface ChatMessage {
  role: ChatRole
  text: string
}

interface InventoryAssistantModalProps {
  open: boolean
  onClose: () => void
  campos: BusinessTypeField[]
  products: Record<string, BusinessProduct> | null
  onConfirm: (values: Record<string, any>) => Promise<void>
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function getNextRequiredField(
  campos: BusinessTypeField[],
  draft: Record<string, any>
) {
  return campos.find(
    (campo) => campo.requerido && !isFieldComplete(campo, draft[campo.key])
  )
}

function summarizeDraft(
  campos: BusinessTypeField[],
  draft: Record<string, any>
) {
  return campos
    .map((campo) => {
      const value = draft[campo.key]
      return `${campo.label || formatFieldLabel(campo.key)}: ${
        value === undefined || value === '' ? 'Sin definir' : String(value)
      }`
    })
    .join('\n')
}

function coerceValue(field: BusinessTypeField, raw: string, options: string[]) {
  if (field.tipo === 'numero') {
    const match = raw.match(/-?\d+(?:[.,]\d+)?/)
    return match ? Number(match[0].replace(',', '.')) : raw
  }

  if (field.tipo === 'booleano') {
    if (/\b(si|sí|true|activo|disponible|1)\b/i.test(raw)) return true
    if (/\b(no|false|inactivo|0)\b/i.test(raw)) return false
    return raw
  }

  if (field.tipo === 'select') {
    const normalized = normalize(raw)
    const match = options.find((option) => normalize(option) === normalized)
    return match || raw.trim()
  }

  return raw.trim()
}

export default function InventoryAssistantModal({
  open,
  onClose,
  campos,
  products,
  onConfirm,
}: InventoryAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [input, setInput] = useState('')
  const [pendingField, setPendingField] = useState<BusinessTypeField | null>(null)
  const [stage, setStage] = useState<'collecting' | 'confirm'>('collecting')
  const [saving, setSaving] = useState(false)

  const optionsByField = useMemo(
    () => buildOptionsByField(campos, products),
    [campos, products]
  )

  useEffect(() => {
    if (!open) return

    setMessages([
      {
        role: 'assistant',
        text: 'Describe el producto o servicio en una frase. Yo completaré lo posible y te pediré solo lo que falte.',
      },
    ])
    setDraft({})
    setInput('')
    setPendingField(null)
    setStage('collecting')
    setSaving(false)
  }, [open])

  if (!open) return null

  const sendMessage = async (raw: string) => {
    const text = raw.trim()
    if (!text || saving) return

    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')

    if (stage === 'confirm') {
      if (/\b(si|sí|confirmar|guardar|ok|dale)\b/i.test(text)) {
        setSaving(true)
        try {
          await onConfirm(draft)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: 'Listo, el producto quedó guardado en el catálogo.',
            },
          ])
          setTimeout(onClose, 350)
        } finally {
          setSaving(false)
        }
        return
      }

      setStage('collecting')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Entendido. Continuemos con la información faltante.',
        },
      ])
      return
    }

    const nextDraft = { ...draft }

    if (pendingField) {
      const options = optionsByField[pendingField.key] ?? []
      nextDraft[pendingField.key] = coerceValue(pendingField, text, options)
    } else {
      Object.assign(nextDraft, parseDraftFromText(text, campos, optionsByField))
    }

    setDraft(nextDraft)

    const nextMissing = getNextRequiredField(campos, nextDraft)
    if (nextMissing) {
      setPendingField(nextMissing)
      const options = optionsByField[nextMissing.key] ?? []
      const helper = options.length > 0 ? ` Opciones: ${options.join(', ')}.` : ''
      const question = nextMissing.label || formatFieldLabel(nextMissing.key)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Necesito ${question}.${helper} Puedes escribir uno nuevo si hace falta.`,
        },
      ])
      return
    }

    setPendingField(null)
    setStage('confirm')
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `Resumen del producto:\n${summarizeDraft(campos, nextDraft)}\n\nResponde "confirmar" para guardar o escribe lo que quieras corregir.`,
      },
    ])
  }

  const options = pendingField ? optionsByField[pendingField.key] ?? [] : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-lg dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-medium">Asistente de catálogo</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                  message.role === 'assistant'
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {stage === 'confirm' && (
            <div className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
              <p className="mb-2 font-medium">Resumen listo para guardar</p>
              <pre className="whitespace-pre-wrap text-xs text-neutral-600 dark:text-neutral-400">
                {summarizeDraft(campos, draft)}
              </pre>
            </div>
          )}

          {pendingField && options.length > 0 && stage !== 'confirm' && (
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => sendMessage(option)}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendMessage(input)
            }}
            className="space-y-3"
          >
            {pendingField && (
              <div className="text-xs text-neutral-500">
                {pendingField.label || formatFieldLabel(pendingField.key)}
                {pendingField.tipo === 'select' && ' (puedes elegir o escribir una nueva)'}
              </div>
            )}
            <Label htmlFor="assistant-input" className="sr-only">
              Mensaje del asistente
            </Label>
            <Input
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                stage === 'confirm'
                  ? 'Escribe confirmar para guardar'
                  : pendingField
                    ? `Responde: ${pendingField.label || formatFieldLabel(pendingField.key)}`
                    : 'Describe el producto'
              }
              disabled={saving}
            />
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {stage === 'confirm' ? 'Confirmar' : 'Enviar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
