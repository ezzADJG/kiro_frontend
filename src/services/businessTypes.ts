import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { BusinessType } from '@/types/business'

export async function obtenerTiposDeNegocio(): Promise<
  Record<string, BusinessType>
> {
  const snapshot = await get(ref(db, 'businessTypes'))
  return snapshot.exists()
    ? (snapshot.val() as Record<string, BusinessType>)
    : {}
}
