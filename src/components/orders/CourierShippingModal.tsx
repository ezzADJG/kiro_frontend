import { useState } from 'react'
import { X, Package, Building2, MapPin, Hash, User, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ShalomOrderPayload, ShalomTracking, OlvaTracking, DeliveryOrder } from '@/types/payments'
import type { ShippingConfig } from '@/services/shippingConfigService'
import type { Packaging } from '@/types/packaging'
import type { Transportista } from '@/types/shipping'

interface ShippingDataEntry {
  transportista?: string
  datosEnvio?: Record<string, any>
}

interface CourierShippingModalProps {
  open: boolean
  onClose: () => void
  onGenerate: (orderId: string, payload: ShalomOrderPayload | Record<string, any>, tracking: ShalomTracking | OlvaTracking) => void
  order: DeliveryOrder
  transportista: Transportista
  shippingData: ShippingDataEntry | undefined
  shippingConfig: ShippingConfig | null
  packagings: Packaging[]
}

export default function CourierShippingModal({
  open,
  onClose,
  onGenerate,
  order,
  transportista,
  shippingData,
  shippingConfig,
  packagings,
}: CourierShippingModalProps) {
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>('')
  const [showPackagingSelector, setShowPackagingSelector] = useState(false)
  const [pickupCode, setPickupCode] = useState('')

  if (!open) return null

  const isShalom = transportista === 'SHALOM'
  const sd = shippingData?.datosEnvio as Record<string, any> | undefined
  const sender = isShalom ? shippingConfig?.shalom?.remitente : null
  const olvaCfg = !isShalom ? shippingConfig?.olva : null

  const selectedPackaging = packagings.find((p) => p.id === selectedPackagingId)

  const generatePickupCode = () => {
    setPickupCode(String(Math.floor(1000 + Math.random() * 9000)))
  }

  const isValid = selectedPackagingId !== '' && (!isShalom || pickupCode.length === 4)

  const handleGenerate = () => {
    if (!isValid) return

    if (isShalom) {
      const payload: ShalomOrderPayload = {
        origin_terminal_id: 0,
        destiny_terminal_id: sd?.agenciaDestino || 0,
        product_id: 0,
        quantity: 1,
        payer: 'sender',
        pickup_code: pickupCode,
        sender: {
          document_type: sender?.ruc ? 'RUC' : 'DNI',
          document: sender?.ruc || '',
          name: sender?.razonSocial || '',
          last_name: '',
          sur_name: '',
          phone: parseInt(sender?.telefono || '0', 10),
          address: sender?.direccionFiscal || '',
        },
        receiver: {
          document_type: sd?.tipoDocumento || 'DNI',
          document: sd?.documentoDestinatario || order.customerDNI,
          name: sd?.nombreDestinatario || order.customerName,
          last_name: '',
          sur_name: '',
          phone: parseInt(sd?.telefonoDestinatario || order.customerPhone.replace(/[^0-9]/g, ''), 10),
          address: sd?.direccion || order.deliveryAddress,
        },
        dimensions: selectedPackaging ? {
          weight_kg: selectedPackaging.maxWeightKg,
          height_m: (selectedPackaging.heightCm || 0) / 100,
          length_m: (selectedPackaging.lengthCm || 0) / 100,
          width_m: (selectedPackaging.widthCm || 0) / 100,
        } : undefined,
      }

      const tracking: ShalomTracking = {
        guia: String(80000000 + Math.floor(Math.random() * 9999999)),
        serie: 's001',
        codigo: String(Math.random().toString(36).substring(2, 6).toUpperCase()),
      }

      onGenerate(order.id, payload, tracking)
    } else {
      const tracking: OlvaTracking = {
        nroEnvio: order.purchaseNumber,
        codigo: String(Math.random().toString(36).substring(2, 8).toUpperCase()),
      }

      onGenerate(order.id, { packaging: selectedPackaging?.name || '' }, tracking)
    }
  }

  const receiverName = order.customerName.toUpperCase()
  const receiverParts = receiverName.split(' ')

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
              <h3 className="text-sm font-semibold text-foreground">
                Envío por {isShalom ? 'Shalom' : 'Olva'}
              </h3>
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
              {/* Remitente (Solo lectura) */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remitente</h4>
                <div className="rounded-xl bg-secondary/50 p-4 ring-1 ring-foreground/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      {isShalom ? (
                        <>
                          <p className="text-sm font-medium text-foreground">{sender?.razonSocial || '—'}</p>
                          <p className="text-xs text-muted-foreground">RUC: {sender?.ruc || '—'}</p>
                          <p className="text-xs text-muted-foreground">{sender?.direccionFiscal || '—'}</p>
                          <p className="text-xs text-muted-foreground">Tel: {sender?.telefono || '—'}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{olvaCfg?.dni ? `DNI: ${olvaCfg.dni}` : '—'}</p>
                          <p className="text-xs text-muted-foreground">Origen: {olvaCfg?.origen || '—'}</p>
                          <p className="text-xs text-muted-foreground">Correo: {olvaCfg?.correo || '—'}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Destinatario (Solo lectura) */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destinatario</h4>
                <div className="rounded-xl bg-secondary/50 p-4 ring-1 ring-foreground/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      {isShalom ? (
                        <>
                          <p className="text-sm font-medium text-foreground">{sd?.nombreDestinatario || order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{sd?.tipoDocumento || 'DNI'}: {sd?.documentoDestinatario || order.customerDNI}</p>
                          <p className="text-xs text-muted-foreground">Tel: {sd?.telefonoDestinatario || order.customerPhone}</p>
                          <p className="text-xs text-muted-foreground">{sd?.direccion || order.deliveryAddress}</p>
                          {sd?.agenciaDestino && (
                            <p className="text-xs text-muted-foreground">Agencia destino: {sd.agenciaDestino}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground">{sd?.razonSocial || order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{sd?.tipoDocumento || 'DNI'}: {order.customerDNI}</p>
                          <p className="text-xs text-muted-foreground">Cel: {sd?.celular || order.customerPhone}</p>
                          <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
                          {sd?.apellidoPaterno && (
                            <p className="text-xs text-muted-foreground">{sd.apellidoPaterno} {sd.apellidoMaterno}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Empaque */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tamaño de caja</h4>
                <div className="relative">
                  <button
                    onClick={() => setShowPackagingSelector(!showPackagingSelector)}
                    className="flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-left transition-colors hover:bg-secondary"
                  >
                    <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className={selectedPackaging ? 'text-foreground' : 'text-muted-foreground'}>
                      {selectedPackaging
                        ? `${selectedPackaging.name} (${selectedPackaging.lengthCm || '?'}×${selectedPackaging.widthCm || '?'}×${selectedPackaging.heightCm || '?'}cm, ${selectedPackaging.maxWeightKg}kg)`
                        : 'Seleccionar empaque'}
                    </span>
                  </button>
                  {showPackagingSelector && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setShowPackagingSelector(false)} />
                      <div className="absolute left-0 top-full z-[60] mt-1 w-full rounded-xl bg-white shadow-xl ring-1 ring-foreground/10">
                        <div className="max-h-64 overflow-y-auto">
                          {packagings.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                              No hay empaques configurados
                            </div>
                          ) : (
                            packagings.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedPackagingId(p.id)
                                  setShowPackagingSelector(false)
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl ${
                                  selectedPackagingId === p.id
                                    ? 'bg-muted'
                                    : 'hover:bg-secondary'
                                }`}
                              >
                                <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {p.lengthCm || '?'}×{p.widthCm || '?'}×{p.heightCm || '?'}cm · {p.maxWeightKg}kg
                                  </p>
                                </div>
                                {selectedPackagingId === p.id && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Código de retiro (Solo Shalom) */}
              {isShalom && (
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
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" className="gap-1.5" disabled={!isValid} onClick={handleGenerate}>
              <Package className="h-3.5 w-3.5" />
              {isShalom ? 'Generar guía Shalom' : 'Generar guía Olva'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
