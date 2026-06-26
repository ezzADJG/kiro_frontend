import { ref, push, update, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import type {
  Business,
  CrearNegocioInput,
  UserBusinessMembership,
} from '@/types/business'
import type { UserProfile } from '@/services/userProfile'
import { businessUsersRef, invitationsRef } from '@/lib/db'

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

export async function obtenerMiembrosDeNegocio(
  businessId: string
): Promise<
  { uid: string; role: 'owner' | 'agente'; active: boolean; joinedAt: number }[]
> {
  const snapshot = await get(businessUsersRef(businessId))
  if (!snapshot.exists()) return []

  const data = snapshot.val() as Record<string, UserBusinessMembership>
  return Object.entries(data).map(([uid, membership]) => ({
    uid,
    ...membership,
  }))
}

export async function obtenerPerfilesDeUsuarios(
  uids: string[]
): Promise<Record<string, UserProfile | null>> {
  const result: Record<string, UserProfile | null> = {}
  for (const uid of uids) {
    const snapshot = await get(ref(db, `users/${uid}`))
    result[uid] = snapshot.exists() ? (snapshot.val() as UserProfile) : null
  }
  return result
}

export async function invitarUsuario(
  businessId: string,
  email: string,
  role: 'agente',
  businessName: string
): Promise<string> {
  const newRef = push(invitationsRef(businessId))
  if (!newRef.key) throw new Error('No se pudo generar ID de invitación')

  await update(ref(db), {
    [`invitations/${businessId}/${newRef.key}`]: {
      email,
      role,
      businessName,
      businessId,
      status: 'pending',
      createdAt: Date.now(),
    },
  })

  return newRef.key
}

export async function vincularUsuarioANegocio(
  businessId: string,
  uid: string,
  role: 'owner' | 'agente',
  inviteId?: string
): Promise<void> {
  const ahora = Date.now()
  const membership: UserBusinessMembership = {
    role,
    active: true,
    joinedAt: ahora,
  }

  const updates: Record<string, unknown> = {
    [`businessUsers/${businessId}/${uid}`]: membership,
    [`userBusinesses/${uid}/${businessId}`]: membership,
  }

  if (inviteId) {
    updates[`invitations/${businessId}/${inviteId}/status`] = 'accepted'
    updates[`invitations/${businessId}/${inviteId}/acceptedAt`] = ahora
    updates[`invitations/${businessId}/${inviteId}/acceptedBy`] = uid
  }

  await update(ref(db), updates)
}

export async function eliminarMiembroDeNegocio(
  businessId: string,
  uid: string
): Promise<void> {
  await update(ref(db), {
    [`businessUsers/${businessId}/${uid}`]: null,
    [`userBusinesses/${uid}/${businessId}`]: null,
  })
}

export async function obtenerInvitacionPorId(
  businessId: string,
  inviteId: string
): Promise<{
  email: string
  businessName: string
  status: string
} | null> {
  const snapshot = await get(ref(db, `invitations/${businessId}/${inviteId}`))
  if (!snapshot.exists()) return null
  const data = snapshot.val()
  return {
    email: data.email,
    businessName: data.businessName,
    status: data.status,
  }
}

export async function obtenerInvitacionesPendientes(
  businessId: string
): Promise<
  { id: string; email: string; role: string; status: string; createdAt: number }[]
> {
  const snapshot = await get(invitationsRef(businessId))
  if (!snapshot.exists()) return []

  const data = snapshot.val()
  return Object.entries(data)
    .filter(
      ([, v]: [string, any]) =>
        v.status === 'sent' || v.status === 'pending'
    )
    .map(([id, v]: [string, any]) => ({
      id,
      email: v.email,
      role: v.role,
      status: v.status,
      createdAt: v.createdAt,
    }))
}
