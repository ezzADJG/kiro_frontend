export interface BusinessAddress {
  street: string
  district: string
  province: string
  department: string
}

export interface BusinessModules {
  inventory: boolean
  services: boolean
  employees: boolean
  appointments: boolean
}

export interface Business {
  businessName: string
  tradeName: string
  ruc: string
  category: string
  industry: string
  country: string
  currency: string
  timezone: string
  email: string
  phone: string
  address: BusinessAddress
  modules: BusinessModules
  ownerId: string
  status: 'active'
  createdAt: number
  updatedAt: number
}

export interface UserBusinessMembership {
  role: 'owner' | 'agente'
  active: boolean
  joinedAt: number
}

export interface BusinessTypeField {
  key: string
  label?: string
  tipo: 'texto' | 'numero' | 'booleano' | 'select'
  requerido: boolean
  ayuda?: string
  placeholder?: string
}

export type BusinessModule = 'stock' | 'services'

export interface BusinessType {
  label: string
  modules: BusinessModule[]
  stockSchema?: {
    campos: BusinessTypeField[]
  }
  serviceSchema?: {
    campos: BusinessTypeField[]
  }
}

export type CrearNegocioInput = Pick<
  Business,
  'businessName' | 'tradeName' | 'ruc' | 'category' | 'industry' | 'email' | 'phone'
> & { address: BusinessAddress }
