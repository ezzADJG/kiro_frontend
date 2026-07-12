import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { UserBusinessMembership } from '@/types/business'
import { seedMockOrders } from '@/services/orderService'

interface BusinessContextValue {
  activeBusinessId: string | null
  loadingBusiness: boolean
  tieneNegocio: boolean
  businessIds: string[]
  setActiveBusinessId: (businessId: string | null) => void
  refrescarNegocios: () => void
}

const BusinessContext = createContext<BusinessContextValue | undefined>(
  undefined
)

const STORAGE_KEY = 'kiro_active_business_id'

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { firebaseUser, loadingAuth } = useAuth()
  const [businessIds, setBusinessIds] = useState<string[]>([])
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  )
  const [loadingBusiness, setLoadingBusiness] = useState(true)

  useEffect(() => {
    if (loadingAuth) return

    if (!firebaseUser) {
      setBusinessIds([])
      setActiveBusinessIdState(null)
      setLoadingBusiness(false)
      return
    }

    setLoadingBusiness(true)

    const userBusinessesRef = ref(db, `userBusinesses/${firebaseUser.uid}`)

    const unsubscribe = onValue(userBusinessesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, UserBusinessMembership>
        const ids = Object.keys(data).filter((id) => data[id]?.active)
        setBusinessIds(ids)

        if (ids.length > 0) {
          const storedId = localStorage.getItem(STORAGE_KEY)
          const sigueSiendoValido = storedId && ids.includes(storedId)
          if (!sigueSiendoValido) {
            setActiveBusinessIdState(ids[0])
          }
        } else {
          setActiveBusinessIdState(null)
        }
      } else {
        setBusinessIds([])
        setActiveBusinessIdState(null)
      }
      setLoadingBusiness(false)
    })

    return () => unsubscribe()
  }, [firebaseUser, loadingAuth])

  useEffect(() => {
    if (!activeBusinessId || loadingBusiness) return
    const seedKey = `kiro_orders_seeded_${activeBusinessId}`
    if (localStorage.getItem(seedKey)) return
    seedMockOrders(activeBusinessId)
      .then(() => {
        localStorage.setItem(seedKey, 'true')
      })
      .catch(() => {})
  }, [activeBusinessId, loadingBusiness])

  function setActiveBusinessId(businessId: string | null) {
    if (businessId) {
      localStorage.setItem(STORAGE_KEY, businessId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setActiveBusinessIdState(businessId)
  }

  return (
    <BusinessContext.Provider
      value={{
        activeBusinessId,
        loadingBusiness,
        tieneNegocio: businessIds.length > 0,
        businessIds,
        setActiveBusinessId,
        refrescarNegocios: () => {},
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness(): BusinessContextValue {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness debe usarse dentro de un BusinessProvider')
  }
  return context
}
