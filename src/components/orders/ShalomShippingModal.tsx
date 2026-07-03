import { useState } from 'react'
import { X, Package, MapPin, Building2, Hash, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mockAgencies, mockShalomProducts, storeProfile } from '@/data/mockData'
import type { ShalomOrderPayload, ShalomTracking, DeliveryOrder } from '@/types/payments'

interface ShalomShippingModalProps {
  open: boolean
  onClose: () => void
  onGenerate: (orderId: string, payload: ShalomOrderPayload, tracking: ShalomTracking) => void
  order: DeliveryOrder
}

type SelectorType = 'origin' | 'destiny' | 'product' | null

export default function ShalomShippingModal({ open, onClose, onGenerate, order }: ShalomShippingModalProps) {
  const [originId, setOriginId] = useState<number | null>(null)
  const [destinyId, setDestinyId] = useState<number | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [payer, setPayer] = useState<'sender' | 'receiver'>('sender')
  const [pickupCode, setPickupCode] = useState('')
  const [showSelector, setShowSelector] = useState<SelectorType>(null)
  const parsedName = order.customerName.toUpperCase().split(' ')
  const [receiverName, setReceiverName] = useState(parsedName[0] || order.customerName.toUpperCase())
  const [receiverLastName, setReceiverLastName] = useState(parsedName.slice(1, 2).join(' ') || '')
  const [receiverSurName, setReceiverSurName] = useState(parsedName.slice(2).join(' ') || '')
  const [receiverDocType, setReceiverDocType] = useState<'DNI' | 'RUC' | 'CE'>('DNI')
  const [receiverDoc, setReceiverDoc] = useState(order.customerDNI)
  const [receiverPhone, setReceiverPhone] = useState(order.customerPhone.replace(/[^0-9]/g, ''))
  const [receiverAddress, setReceiverAddress] = useState(order.deliveryAddress)
  const [weightKg, setWeightKg] = useState(1)
  const [heightM, setHeightM] = useState(0.2)
  const [lengthM, setLengthM] = useState(0.3)
  const [widthM, setWidthM] = useState(0.2)

  if (!open) return null

  const selectedProduct = mockShalomProducts.find((p) => p.id === productId)
  const isOtraMedida = selectedProduct?.title === 'Otra Medida'

  const handleProductSelect = (id: number) => {
    setProductId(id)
    setShowSelector(null)
  }

  const generatePickupCode = () => {
    const code = String(Math.floor(1000 + Math.random() * 9000))
    setPickupCode(code)
  }

  const isValid =
    originId !== null &&
    destinyId !== null &&
    productId !== null &&
    quantity >= 1 &&
    pickupCode.length === 4 &&
    receiverName.trim() !== '' &&
    receiverDoc.trim() !== '' &&
    receiverPhone.trim() !== ''

  const handleGenerate = () => {
    if (!isValid) return

    const payload: ShalomOrderPayload = {
      origin_terminal_id: originId!,
      destiny_terminal_id: destinyId!,
      product_id: productId!,
      quantity,
      payer,
      pickup_code: pickupCode,
      sender: {
        document_type: storeProfile.document_type,
        document: storeProfile.document,
        name: storeProfile.name,
        last_name: '',
        sur_name: '',
        phone: storeProfile.phone,
        email: storeProfile.email,
        address: storeProfile.address,
      },
      receiver: {
        document_type: receiverDocType,
        document: receiverDoc,
        name: receiverName,
        last_name: receiverDocType === 'RUC' ? '' : (receiverLastName || '-'),
        sur_name: receiverDocType === 'RUC' ? '' : (receiverSurName || '-'),
        phone: parseInt(receiverPhone, 10) || 0,
        address: receiverAddress,
      },
    }

    if (isOtraMedida) {
      payload.dimensions = { weight_kg: weightKg, height_m: heightM, length_m: lengthM, width_m: widthM }
    }

    const tracking: ShalomTracking = {
      guia: String(80000000 + Math.floor(Math.random() * 9999999)),
      serie: 's001',
      codigo: String(Math.random().toString(36).substring(2, 6).toUpperCase()),
    }

    onGenerate(order.id, payload, tracking)
  }

  const renderSelector = (type: SelectorType) => {
    if (showSelector !== type) return null

    if (type === 'origin' || type === 'destiny') {
      const list = mockAgencies
      const handleSelect = (id: number) => {
        if (type === 'origin') setOriginId(id)
        else setDestinyId(id)
        setShowSelector(null)
      }
      return (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setShowSelector(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-foreground/5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h4 className="text-sm font-semibold text-foreground">
                  {type === 'origin' ? 'Terminal de origen' : 'Terminal de destino'}
                </h4>
                <button onClick={() => setShowSelector(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto p-3">
                {list.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelect(a.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      (type === 'origin' ? originId : destinyId) === a.id
                        ? 'bg-muted ring-1 ring-foreground/20'
                        : 'hover:bg-secondary ring-1 ring-foreground/5'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{a.nombre}</p>
                      <p className="text-xs text-muted-foreground">{a.departamento}{a.provincia ? ` - ${a.provincia}` : ''}</p>
                    </div>
                    {(type === 'origin' ? originId : destinyId) === a.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )
    }

    if (type === 'product') {
      return (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setShowSelector(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-foreground/5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h4 className="text-sm font-semibold text-foreground">Tipo de paquete</h4>
                <button onClick={() => setShowSelector(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto p-3">
                {mockShalomProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProductSelect(p.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      productId === p.id
                        ? 'bg-muted ring-1 ring-foreground/20'
                        : 'hover:bg-secondary ring-1 ring-foreground/5'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.content}</p>
                    </div>
                    {productId === p.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )
    }

    return null
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="mx-4 flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-foreground/5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Envío por Shalom</h3>
              <p className="text-xs text-muted-foreground">{order.purchaseNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-5">
              {/* Terminales */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terminales</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 text-xs">Origen</Label>
                    <button
                      onClick={() => setShowSelector(showSelector === 'origin' ? null : 'origin')}
                      className="flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-left transition-colors hover:bg-secondary"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className={originId ? 'text-foreground' : 'text-muted-foreground'}>
                        {originId ? mockAgencies.find((a) => a.id === originId)?.nombre : 'Seleccionar'}
                      </span>
                    </button>
                  </div>
                  <div>
                    <Label className="mb-1.5 text-xs">Destino</Label>
                    <button
                      onClick={() => setShowSelector(showSelector === 'destiny' ? null : 'destiny')}
                      className="flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-left transition-colors hover:bg-secondary"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className={destinyId ? 'text-foreground' : 'text-muted-foreground'}>
                        {destinyId ? mockAgencies.find((a) => a.id === destinyId)?.nombre : 'Seleccionar'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Paquete */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paquete</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="mb-1.5 text-xs">Tipo</Label>
                    <button
                      onClick={() => setShowSelector(showSelector === 'product' ? null : 'product')}
                      className="flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-left transition-colors hover:bg-secondary"
                    >
                      <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className={productId ? 'text-foreground' : 'text-muted-foreground'}>
                        {productId ? selectedProduct?.title : 'Seleccionar'}
                      </span>
                    </button>
                  </div>
                  <div>
                    <Label className="mb-1.5 text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 text-xs">Quién paga</Label>
                    <div className="flex h-9 rounded-lg border border-input overflow-hidden">
                      <button
                        onClick={() => setPayer('sender')}
                        className={`flex-1 text-xs font-medium transition-colors ${
                          payer === 'sender' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        Remitente
                      </button>
                      <button
                        onClick={() => setPayer('receiver')}
                        className={`flex-1 text-xs font-medium transition-colors ${
                          payer === 'receiver' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        Destinatario
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensiones (solo Otra Medida) */}
              {isOtraMedida && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dimensiones</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="mb-1.5 text-xs">Peso (kg)</Label>
                      <Input type="number" min={0} step={0.1} value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Alto (m)</Label>
                      <Input type="number" min={0} step={0.01} value={heightM} onChange={(e) => setHeightM(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Largo (m)</Label>
                      <Input type="number" min={0} step={0.01} value={lengthM} onChange={(e) => setLengthM(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Ancho (m)</Label>
                      <Input type="number" min={0} step={0.01} value={widthM} onChange={(e) => setWidthM(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* Remitente */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remitente</h4>
                <div className="rounded-xl bg-secondary/50 p-4 ring-1 ring-foreground/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{storeProfile.name}</p>
                      <p className="text-xs text-muted-foreground">{storeProfile.document_type}: {storeProfile.document}</p>
                      <p className="text-xs text-muted-foreground">{storeProfile.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destinatario */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destinatario</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="mb-1.5 text-xs">Nombres</Label>
                      <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Apellido paterno</Label>
                      <Input value={receiverLastName} onChange={(e) => setReceiverLastName(e.target.value)} className="h-9 text-sm" disabled={receiverDocType === 'RUC'} />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Apellido materno</Label>
                      <Input value={receiverSurName} onChange={(e) => setReceiverSurName(e.target.value)} className="h-9 text-sm" disabled={receiverDocType === 'RUC'} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="mb-1.5 text-xs">Tipo doc.</Label>
                      <div className="flex h-9 rounded-lg border border-input overflow-hidden">
                        {(['DNI', 'RUC', 'CE'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setReceiverDocType(t)}
                            className={`flex-1 text-xs font-medium transition-colors ${
                              receiverDocType === t ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Documento</Label>
                      <Input value={receiverDoc} onChange={(e) => setReceiverDoc(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Teléfono</Label>
                      <Input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value.replace(/[^0-9]/g, ''))} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs">Dirección</Label>
                      <Input value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Código de retiro */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código de retiro</h4>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={pickupCode}
                      onChange={(e) => setPickupCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="0000"
                      maxLength={4}
                      className="h-9 pl-8 text-sm font-mono tracking-widest text-center"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={generatePickupCode} className="shrink-0 gap-1">
                    <Hash className="h-3 w-3" />
                    Generar
                  </Button>
                </div>
                {pickupCode.length > 0 && pickupCode.length < 4 && (
                  <p className="mt-1 text-[11px] text-destructive">Debe tener 4 dígitos</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" className="gap-1.5" disabled={!isValid} onClick={handleGenerate}>
              <Package className="h-3.5 w-3.5" />
              Generar guía Shalom
            </Button>
          </div>
        </div>
      </div>

      {renderSelector('origin')}
      {renderSelector('destiny')}
      {renderSelector('product')}
    </>
  )
}
