import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  asegurarPerfilUsuario,
  type UserProfile,
} from '@/services/userProfile'

interface AuthContextValue {
  firebaseUser: User | null
  userProfile: UserProfile | null
  loadingAuth: boolean
  isAuthenticated: boolean
  loginConEmail: (email: string, password: string) => Promise<void>
  registrarConEmail: (
    email: string,
    password: string,
    nombre: string
  ) => Promise<void>
  loginConGoogle: () => Promise<void>
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        const perfil = await asegurarPerfilUsuario(firebaseUser)
        setUserProfile(perfil)
      } else {
        setFirebaseUser(null)
        setUserProfile(null)
      }
      setLoadingAuth(false)
    })

    return () => unsubscribe()
  }, [])

  const loginConEmail = async (email: string, password: string) => {
    const { loginConEmail } = await import('@/services/authService')
    await loginConEmail(email, password)
  }

  const registrarConEmail = async (
    email: string,
    password: string,
    nombre: string
  ) => {
    const { registrarConEmail } = await import('@/services/authService')
    await registrarConEmail(email, password, nombre)
  }

  const loginConGoogle = async () => {
    const { loginConGoogle } = await import('@/services/authService')
    await loginConGoogle()
  }

  const cerrarSesion = async () => {
    const { cerrarSesion } = await import('@/services/authService')
    await cerrarSesion()
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loadingAuth,
        isAuthenticated: !!firebaseUser,
        loginConEmail,
        registrarConEmail,
        loginConGoogle,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
