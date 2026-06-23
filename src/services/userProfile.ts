import { ref, get, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'

export interface UserProfile {
  displayName: string
  email: string
  avatarUrl: string | null
  status: 'active'
  createdAt: number
}

export async function asegurarPerfilUsuario(
  firebaseUser: User
): Promise<UserProfile> {
  const userRef = ref(db, `users/${firebaseUser.uid}`)
  const snapshot = await get(userRef)

  if (snapshot.exists()) {
    return snapshot.val() as UserProfile
  }

  const nuevoPerfil: UserProfile = {
    displayName: firebaseUser.displayName ?? '',
    email: firebaseUser.email ?? '',
    avatarUrl: firebaseUser.photoURL ?? null,
    status: 'active',
    createdAt: Date.now(),
  }

  await set(userRef, nuevoPerfil)
  return nuevoPerfil
}

export async function obtenerPerfilUsuario(
  uid: string
): Promise<UserProfile | null> {
  const snapshot = await get(ref(db, `users/${uid}`))
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null
}
