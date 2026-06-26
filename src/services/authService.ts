import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

export async function registrarConEmail(
  email: string,
  password: string,
  nombre: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: nombre })
  return credential.user
}

export async function loginConEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function loginConGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

export async function cerrarSesion() {
  localStorage.removeItem('kiro_active_business_id')
  await signOut(auth)
}
