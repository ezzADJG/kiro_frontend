import { ref, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { Transportista } from '@/types/shipping'

export function shippingDataRef(businessId: string, ordenId: string) {
  return ref(db, `shippingData/${businessId}/${ordenId}`)
}

export async function saveShippingData(
  businessId: string,
  ordenId: string,
  transportista: Transportista,
  datosEnvio: object
): Promise<void> {
  const now = Date.now()
  await update(shippingDataRef(businessId, ordenId), {
    ordenId,
    transportista,
    datosEnvio,
    completado: true,
    createdAt: now,
    updatedAt: now,
  })
}
