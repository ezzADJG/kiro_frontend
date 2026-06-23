import { ref, push, update, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import type {
  Business,
  CrearNegocioInput,
  UserBusinessMembership,
} from '@/types/business'

export async function crearNegocio(
  uid: string,
  datos: CrearNegocioInput
): Promise<string> {
  const businessId = push(ref(db, 'businesses')).key
  if (!businessId) {
    throw new Error('No se pudo generar un ID de negocio')
  }

  const ahora = Date.now()

  const nuevoNegocio: Business = {
    ...datos,
    country: 'PE',
    currency: 'PEN',
    timezone: 'America/Lima',
    modules: {
      inventory: true,
      services: false,
      employees: false,
      appointments: false,
    },
    ownerId: uid,
    status: 'active',
    createdAt: ahora,
    updatedAt: ahora,
  }

  const membership: UserBusinessMembership = {
    role: 'owner',
    active: true,
    joinedAt: ahora,
  }

  const updates: Record<string, unknown> = {
    [`businesses/${businessId}`]: nuevoNegocio,
    [`userBusinesses/${uid}/${businessId}`]: membership,
    [`businessUsers/${businessId}/${uid}`]: membership,
  }

  await update(ref(db), updates)

  return businessId
}

export async function obtenerNegociosDeUsuario(
  uid: string
): Promise<Record<string, UserBusinessMembership>> {
  const snapshot = await get(ref(db, `userBusinesses/${uid}`))
  return snapshot.exists() ? snapshot.val() : {}
}

export async function obtenerNegocio(
  businessId: string
): Promise<Business | null> {
  const snapshot = await get(ref(db, `businesses/${businessId}`))
  return snapshot.exists() ? (snapshot.val() as Business) : null
}
