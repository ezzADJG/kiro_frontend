import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { obtenerNegociosDeUsuario } from '@/services/businessService'

interface BusinessContextValue {
  activeBusinessId: string | null
  loadingBusiness: boolean
  tieneNegocio: boolean
  businessIds: string[]
  setActiveBusinessId: (businessId: string | null) => void
  refrescarNegocios: () => Promise<void>
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

  async function cargarNegocios() {
    if (!firebaseUser) {
      setBusinessIds([])
      setActiveBusinessIdState(null)
      setLoadingBusiness(false)
      return
    }

    setLoadingBusiness(true)
    const negocios = await obtenerNegociosDeUsuario(firebaseUser.uid)
    const ids = Object.keys(negocios).filter((id) => negocios[id]?.active)
    setBusinessIds(ids)

    if (ids.length > 0) {
      const actualSigueSiendoValido =
        activeBusinessId && ids.includes(activeBusinessId)
      if (!actualSigueSiendoValido) {
        setActiveBusinessIdState(ids[0])
      }
    } else {
      setActiveBusinessIdState(null)
    }

    setLoadingBusiness(false)
  }

  useEffect(() => {
    if (!loadingAuth) {
      cargarNegocios()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, loadingAuth])

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
        refrescarNegocios: cargarNegocios,
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
