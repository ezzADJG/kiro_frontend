import { useCallback, useMemo, useState } from 'react'
import { Loader2, Truck, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAgencias } from '@/hooks/useAgencias'
import { saveShippingData } from '@/services/shippingDataService'
import { WizardProgressBar } from './wizard/WizardProgressBar'
import { WizardStepWrapper } from './wizard/WizardStepWrapper'
import { WizardSummary } from './wizard/WizardSummary'
import { WizardSuccess } from './wizard/WizardSuccess'
import { AgencySelectorStep } from './wizard/steps/AgencySelectorStep'
import { DocumentStep } from './wizard/steps/DocumentStep'
import { NameStep } from './wizard/steps/NameStep'
import { PhoneStep } from './wizard/steps/PhoneStep'
import { LocationStep } from './wizard/steps/LocationStep'
import { AddressStep } from './wizard/steps/AddressStep'
import { MercaderiaStep } from './wizard/steps/MercaderiaStep'
import { OlvaArticuloStep } from './wizard/steps/OlvaArticuloStep'
import { OlvaPersonalStep } from './wizard/steps/OlvaPersonalStep'
import { OlvaContactStep } from './wizard/steps/OlvaContactStep'
import type {
  ShalomShippingData,
  OlvaShippingData,
  Transportista,
} from '@/types/shipping'

interface ShippingDataCardProps {
  ordenId: string
  businessId: string
  purchaseNumber?: string
  saleTotal?: number
  saleCurrency?: string
}

const SHALOM_INIT: ShalomShippingData = {
  tipoDocumento: 'DNI',
  documentoDestinatario: '',
  nombreDestinatario: '',
  telefonoDestinatario: '',
  documentoContacto: '',
  telefonoContacto: '',
  departamento: '',
  provincia: '',
  distrito: '',
  agenciaDestino: null,
  direccion: '',
  referencia: '',
  descripcionMercaderia: '',
}

const OLVA_INIT: OlvaShippingData = {
  tipoArticulo: '',
  tipoDocumento: 'DNI',
  celular: '',
  razonSocial: '',
  contacto: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
}

const SHALOM_STEP_IDS = [
  'agency',
  'document',
  'name',
  'phone',
  'location',
  'address',
  'mercaderia',
  'summary',
] as const

const OLVA_STEP_IDS = [
  'agency',
  'articulo',
  'document',
  'personal',
  'contact',
  'summary',
] as const

type ShalomStepId = (typeof SHALOM_STEP_IDS)[number]
type OlvaStepId = (typeof OLVA_STEP_IDS)[number]

export function ShippingDataCard({
  ordenId,
  businessId,
  purchaseNumber,
  saleTotal,
  saleCurrency,
}: ShippingDataCardProps) {
  const { agencias, loading: loadingAgencias } = useAgencias()

  const [transportista, setTransportista] = useState<Transportista | null>(null)
  const [shalomData, setShalomData] = useState<ShalomShippingData>(SHALOM_INIT)
  const [olvaData, setOlvaData] = useState<OlvaShippingData>(OLVA_INIT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  const stepIds = useMemo(
    () => (transportista === 'SHALOM' ? [...SHALOM_STEP_IDS] : [...OLVA_STEP_IDS]),
    [transportista]
  )

  const totalSteps = stepIds.length - 1
  const currentStepId = stepIds[currentStepIndex]

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }, [])

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const updateShalom = useCallback(
    (field: keyof ShalomShippingData, value: ShalomShippingData[keyof ShalomShippingData]) => {
      setShalomData((prev) => ({ ...prev, [field]: value }))
      clearError(field)
    },
    [clearError]
  )

  const updateOlva = useCallback(
    (field: keyof OlvaShippingData, value: OlvaShippingData[keyof OlvaShippingData]) => {
      setOlvaData((prev) => ({ ...prev, [field]: value }))
      clearError(field)
    },
    [clearError]
  )

  const validateCurrentStep = useCallback((): boolean => {
    const errs: Record<string, string> = {}

    if (transportista === 'SHALOM') {
      const d = shalomData
      switch (currentStepId) {
        case 'document': {
          if (!d.tipoDocumento) errs.tipoDocumento = 'Seleccione un tipo de documento'
          if (!d.documentoDestinatario.trim()) errs.documento = 'Campo obligatorio'
          else if (d.tipoDocumento === 'DNI' && d.documentoDestinatario.trim().length !== 8)
            errs.documento = 'El DNI debe tener 8 dígitos'
          else if (d.tipoDocumento === 'RUC' && d.documentoDestinatario.trim().length !== 11)
            errs.documento = 'El RUC debe tener 11 dígitos'
          else if (d.documentoDestinatario.trim().length < 5)
            errs.documento = 'Mínimo 5 caracteres'
          break
        }
        case 'name': {
          if (!d.nombreDestinatario.trim()) errs.nombre = 'Campo obligatorio'
          else if (d.nombreDestinatario.trim().length < 3) errs.nombre = 'Mínimo 3 caracteres'
          break
        }
        case 'phone': {
          if (!d.telefonoDestinatario.trim()) errs.telefono = 'Campo obligatorio'
          else if (d.telefonoDestinatario.trim().length < 9) errs.telefono = 'Mínimo 9 dígitos'
          break
        }
        case 'location': {
          if (!d.departamento) errs.departamento = 'Seleccione un departamento'
          if (!d.provincia) errs.provincia = 'Seleccione una provincia'
          if (!d.distrito) errs.distrito = 'Seleccione un distrito'
          if (d.agenciaDestino === null) errs.agenciaDestino = 'Seleccione una agencia'
          break
        }
        case 'address': {
          if (!d.direccion.trim()) errs.direccion = 'Campo obligatorio'
          else if (d.direccion.trim().length < 5) errs.direccion = 'Mínimo 5 caracteres'
          break
        }
        case 'mercaderia': {
          if (!d.descripcionMercaderia.trim()) errs.descripcionMercaderia = 'Campo obligatorio'
          else if (d.descripcionMercaderia.trim().length < 5)
            errs.descripcionMercaderia = 'Mínimo 5 caracteres'
          break
        }
      }
    } else {
      const d = olvaData
      switch (currentStepId) {
        case 'articulo': {
          if (!d.tipoArticulo) errs.tipoArticulo = 'Seleccione un tipo de artículo'
          break
        }
        case 'document': {
          if (!d.tipoDocumento) errs.tipoDocumento = 'Seleccione un tipo de documento'
          break
        }
        case 'personal': {
          if (!d.razonSocial.trim()) errs.razonSocial = 'Campo obligatorio'
          else if (d.razonSocial.trim().length < 3) errs.razonSocial = 'Mínimo 3 caracteres'
          if (!d.apellidoPaterno.trim()) errs.apellidoPaterno = 'Campo obligatorio'
          else if (d.apellidoPaterno.trim().length < 2) errs.apellidoPaterno = 'Mínimo 2 caracteres'
          if (!d.apellidoMaterno.trim()) errs.apellidoMaterno = 'Campo obligatorio'
          else if (d.apellidoMaterno.trim().length < 2) errs.apellidoMaterno = 'Mínimo 2 caracteres'
          break
        }
        case 'contact': {
          if (!d.celular.trim()) errs.celular = 'Campo obligatorio'
          else if (d.celular.trim().length < 9) errs.celular = 'Mínimo 9 dígitos'
          if (!d.contacto.trim()) errs.contacto = 'Campo obligatorio'
          else if (d.contacto.trim().length < 9) errs.contacto = 'Mínimo 9 dígitos'
          break
        }
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [transportista, currentStepId, shalomData, olvaData])

  const markCurrentStepTouched = useCallback(() => {
    const touchedFields: Record<string, boolean> = {}
    if (transportista === 'SHALOM') {
      switch (currentStepId) {
        case 'document':
          touchedFields.tipoDocumento = true
          touchedFields.documento = true
          break
        case 'name':
          touchedFields.nombre = true
          break
        case 'phone':
          touchedFields.telefono = true
          break
        case 'location':
          touchedFields.departamento = true
          touchedFields.provincia = true
          touchedFields.distrito = true
          touchedFields.agenciaDestino = true
          break
        case 'address':
          touchedFields.direccion = true
          break
        case 'mercaderia':
          touchedFields.descripcionMercaderia = true
          break
      }
    } else {
      switch (currentStepId) {
        case 'articulo':
          touchedFields.tipoArticulo = true
          break
        case 'document':
          touchedFields.tipoDocumento = true
          break
        case 'personal':
          touchedFields.razonSocial = true
          touchedFields.apellidoPaterno = true
          touchedFields.apellidoMaterno = true
          break
        case 'contact':
          touchedFields.celular = true
          touchedFields.contacto = true
          break
      }
    }
    setTouched((prev) => ({ ...prev, ...touchedFields }))
  }, [transportista, currentStepId])

  const handleNext = useCallback(() => {
    if (currentStepId === 'summary') return

    if (currentStepId === 'agency') {
      if (!transportista) return
      setErrors({})
      setTouched({})
      setDirection('forward')
      setCurrentStepIndex((prev) => prev + 1)
      return
    }

    markCurrentStepTouched()
    const isValid = validateCurrentStep()
    if (!isValid) return

    setErrors({})
    setDirection('forward')
    setCurrentStepIndex((prev) => prev + 1)
  }, [
    currentStepId,
    transportista,
    markCurrentStepTouched,
    validateCurrentStep,
  ])

  const handleBack = useCallback(() => {
    if (currentStepIndex === 0) return
    setErrors({})
    setDirection('backward')
    setCurrentStepIndex((prev) => prev - 1)
  }, [currentStepIndex])

  const handleEditStep = useCallback(
    (targetStepIndex: number) => {
      setErrors({})
      setDirection(targetStepIndex < currentStepIndex ? 'backward' : 'forward')
      setCurrentStepIndex(targetStepIndex)
    },
    [currentStepIndex]
  )

  const handleSubmit = useCallback(async () => {
    if (!transportista) return
    setSubmitError('')
    setSaving(true)
    try {
      const datosEnvio =
        transportista === 'SHALOM' ? shalomData : olvaData
      await saveShippingData(businessId, ordenId, transportista, datosEnvio)
      setSaved(true)
    } catch {
      setSubmitError(
        'Ocurrió un error al guardar los datos. Intenta nuevamente.'
      )
    } finally {
      setSaving(false)
    }
  }, [transportista, shalomData, olvaData, businessId, ordenId])

  const canGoNext = useMemo(() => {
    if (currentStepId === 'summary') return false
    if (currentStepId === 'agency') return transportista !== null
    return true
  }, [currentStepId, transportista])

  if (saved) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardContent>
          <WizardSuccess ordenId={ordenId} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Datos de Envío</CardTitle>
        </div>
        <CardDescription>
          {purchaseNumber && saleTotal !== undefined
            ? `Pedido ${purchaseNumber} — ${saleCurrency ?? 'PEN'} ${saleTotal.toFixed(2)}`
            : 'Información del destinatario y transporte asociada a la orden.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStepIndex > 0 && (
          <WizardProgressBar
            currentStep={currentStepIndex}
            totalSteps={totalSteps}
          />
        )}

        <WizardStepWrapper
          key={currentStepId}
          direction={direction}
          stepKey={currentStepId}
        >
          {currentStepId === 'agency' && (
            <AgencySelectorStep
              value={transportista}
              onSelect={(agency) => {
                setTransportista(agency)
                setErrors({})
                setTouched({})
                setDirection('forward')
                setCurrentStepIndex(1)
              }}
            />
          )}

          {transportista === 'SHALOM' && currentStepId === 'document' && (
            <DocumentStep
              tipoDocumento={shalomData.tipoDocumento}
              documento={shalomData.documentoDestinatario}
              onTipoChange={(v) =>
                updateShalom('tipoDocumento', v as ShalomShippingData['tipoDocumento'])
              }
              onDocumentoChange={(v) => updateShalom('documentoDestinatario', v)}
              onBlur={handleBlur}
              errors={errors}
              touched={touched}
            />
          )}

          {transportista === 'SHALOM' && currentStepId === 'name' && (
            <NameStep
              value={shalomData.nombreDestinatario}
              onChange={(v) => updateShalom('nombreDestinatario', v)}
              onBlur={handleBlur}
              error={errors.nombre}
              touched={touched.nombre}
            />
          )}

          {transportista === 'SHALOM' && currentStepId === 'phone' && (
            <PhoneStep
              value={shalomData.telefonoDestinatario}
              onChange={(v) => updateShalom('telefonoDestinatario', v)}
              onBlur={handleBlur}
              error={errors.telefono}
              touched={touched.telefono}
            />
          )}

          {transportista === 'SHALOM' && currentStepId === 'location' && (
            <LocationStep
              data={shalomData}
              onChange={updateShalom}
              errors={errors}
              touched={touched}
              agencias={agencias}
            />
          )}

          {transportista === 'SHALOM' && currentStepId === 'address' && (
            <AddressStep
              direccion={shalomData.direccion}
              referencia={shalomData.referencia}
              onDireccionChange={(v) => updateShalom('direccion', v)}
              onReferenciaChange={(v) => updateShalom('referencia', v)}
              onBlur={handleBlur}
              errors={errors}
              touched={touched}
            />
          )}

          {transportista === 'SHALOM' && currentStepId === 'mercaderia' && (
            <MercaderiaStep
              value={shalomData.descripcionMercaderia}
              onChange={(v) => updateShalom('descripcionMercaderia', v)}
              onBlur={handleBlur}
              error={errors.descripcionMercaderia}
              touched={touched.descripcionMercaderia}
            />
          )}

          {transportista === 'OLVA' && currentStepId === 'articulo' && (
            <OlvaArticuloStep
              value={olvaData.tipoArticulo}
              onChange={(v) => updateOlva('tipoArticulo', v)}
              error={errors.tipoArticulo}
              touched={touched.tipoArticulo}
            />
          )}

          {transportista === 'OLVA' && currentStepId === 'document' && (
            <DocumentStep
              tipoDocumento={olvaData.tipoDocumento}
              onTipoChange={(v) =>
                updateOlva('tipoDocumento', v as OlvaShippingData['tipoDocumento'])
              }
              onBlur={handleBlur}
              errors={errors}
              touched={touched}
              tipoOptions={[
                { value: 'DNI', label: 'DNI' },
                { value: 'RUC', label: 'RUC' },
                { value: 'CE', label: 'Carnet de Extranjería' },
              ]}
              showDocumentNumber={false}
            />
          )}

          {transportista === 'OLVA' && currentStepId === 'personal' && (
            <OlvaPersonalStep
              data={olvaData}
              onChange={updateOlva}
              onBlur={handleBlur}
              errors={errors}
              touched={touched}
            />
          )}

          {transportista === 'OLVA' && currentStepId === 'contact' && (
            <OlvaContactStep
              data={olvaData}
              onChange={updateOlva}
              onBlur={handleBlur}
              errors={errors}
              touched={touched}
            />
          )}

          {currentStepId === 'summary' && transportista && (
            <WizardSummary
              transportista={transportista}
              data={transportista === 'SHALOM' ? shalomData : olvaData}
              onEditStep={handleEditStep}
            />
          )}
        </WizardStepWrapper>

        {submitError && (
          <p className="text-center text-sm text-destructive">{submitError}</p>
        )}

        {loadingAgencias && transportista === 'SHALOM' && currentStepId === 'location' && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Cargando agencias...
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
        {currentStepIndex > 0 ? (
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full gap-1.5 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Los campos marcados con <span className="text-destructive">*</span>{' '}
            son obligatorios.
          </p>
        )}

        {currentStepId === 'summary' ? (
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full gap-1.5 sm:w-auto"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Confirmar información de envío'}
          </Button>
        ) : (
          canGoNext && (
            <Button
              onClick={handleNext}
              disabled={currentStepId === 'agency' && !transportista}
              className="w-full gap-1.5 sm:w-auto"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  )
}
