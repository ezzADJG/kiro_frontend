import { Edit2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type {
  Transportista,
  ShalomShippingData,
  OlvaShippingData,
} from '@/types/shipping'

interface WizardSummaryProps {
  transportista: Transportista
  data: ShalomShippingData | OlvaShippingData
  onEditStep: (stepIndex: number) => void
}

export function WizardSummary({
  transportista,
  data,
  onEditStep,
}: WizardSummaryProps) {
  const isShalom = transportista === 'SHALOM'
  const d = data as ShalomShippingData

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-medium text-foreground">
          Resumen de envío
        </h3>
        <p className="text-sm text-muted-foreground">
          Revisa toda la información antes de confirmar.
        </p>
      </div>

      <div className="space-y-3">
        <SummarySection
          title="Agencia"
          editStep={0}
          onEdit={onEditStep}
        >
          <SummaryRow
            label="Transportista"
            value={isShalom ? 'Shalom' : 'Olva Courier'}
          />
        </SummarySection>

        <SummarySection
          title="Destinatario"
          editStep={isShalom ? 2 : 3}
          onEdit={onEditStep}
        >
          {isShalom && (
            <SummaryRow
              label="Nombre"
              value={d.nombreDestinatario || '-'}
            />
          )}
          <SummaryRow
            label="Documento"
            value={`${d.tipoDocumento} ${isShalom ? d.documentoDestinatario : ''}`}
          />
          <SummaryRow
            label="Teléfono"
            value={isShalom ? d.telefonoDestinatario : (data as OlvaShippingData).celular}
          />
          {isShalom && (
            <>
              <SummaryRow
                label="Contacto"
                value={
                  d.documentoContacto || d.telefonoContacto
                    ? `${d.documentoContacto || '-'} / ${d.telefonoContacto || '-'}`
                    : 'No especificado'
                }
              />
            </>
          )}
          {!isShalom && (
            <>
              <SummaryRow
                label="Razón social"
                value={(data as OlvaShippingData).razonSocial || '-'}
              />
              <SummaryRow
                label="Apellidos"
                value={`${(data as OlvaShippingData).apellidoPaterno || ''} ${(data as OlvaShippingData).apellidoMaterno || ''}`}
              />
            </>
          )}
        </SummarySection>

        {isShalom && (
          <>
            <SummarySection
              title="Ubicación"
              editStep={4}
              onEdit={onEditStep}
            >
              <SummaryRow label="Departamento" value={d.departamento || '-'} />
              <SummaryRow label="Provincia" value={d.provincia || '-'} />
              <SummaryRow label="Distrito" value={d.distrito || '-'} />
              <SummaryRow
                label="Agencia destino"
                value={
                  d.agenciaDestino !== null
                    ? `Agencia #${d.agenciaDestino}`
                    : '-'
                }
              />
            </SummarySection>

            <SummarySection
              title="Dirección"
              editStep={5}
              onEdit={onEditStep}
            >
              <SummaryRow label="Dirección" value={d.direccion || '-'} />
              <SummaryRow
                label="Referencia"
                value={d.referencia || 'Sin referencia'}
              />
            </SummarySection>

            <SummarySection
              title="Mercadería"
              editStep={6}
              onEdit={onEditStep}
            >
              <SummaryRow
                label="Descripción"
                value={d.descripcionMercaderia || '-'}
              />
            </SummarySection>
          </>
        )}

        {!isShalom && (
          <SummarySection
            title="Artículo"
            editStep={1}
            onEdit={onEditStep}
          >
            <SummaryRow
              label="Tipo de artículo"
              value={(data as OlvaShippingData).tipoArticulo || '-'}
            />
          </SummarySection>
        )}
      </div>
    </div>
  )
}

function SummarySection({
  title,
  editStep,
  onEdit,
  children,
}: {
  title: string
  editStep: number
  onEdit: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <Card className="p-0">
      <CardHeader className="flex-row items-center justify-between px-4 py-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onEdit(editStep)}
          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="h-3 w-3" />
          Editar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-0">
        {children}
      </CardContent>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium text-foreground">
        {value}
      </span>
    </div>
  )
}
