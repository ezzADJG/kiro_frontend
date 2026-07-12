import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { fetchOrder } from '@/services/orderService'
import { ShippingDataCard } from '@/components/shipping/ShippingDataCard'

export default function ShippingFormPage() {
  const { ordenId } = useParams<{ ordenId: string }>()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sale, setSale] = useState<{
    purchaseNumber: string
    total: number
    currency: string
  } | null>(null)

  const businessId =
    searchParams.get('biz') || import.meta.env.VITE_BUSINESS_ID

  useEffect(() => {
    if (!ordenId) {
      setLoading(false)
      setError('No se ha especificado una orden válida.')
      return
    }

    setLoading(true)
    setError('')

    fetchOrder(businessId, ordenId)
      .then((orderData) => {
        if (!orderData) {
          setError('Orden no encontrada o no disponible.')
          return
        }
        setSale({
          purchaseNumber: orderData.purchaseNumber || ordenId,
          total: orderData.total ?? 0,
          currency: orderData.currency ?? 'PEN',
        })
      })
      .catch(() => {
        setError('Error al cargar los datos de la orden.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [ordenId, businessId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-muted/30 p-4 pt-12 sm:pt-24">
      <ShippingDataCard
        ordenId={ordenId!}
        businessId={businessId}
        purchaseNumber={sale?.purchaseNumber}
        saleTotal={sale?.total}
        saleCurrency={sale?.currency}
      />
    </div>
  )
}
