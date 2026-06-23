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
  tipo: 'texto' | 'numero' | 'booleano'
  requerido: boolean
}

export interface BusinessType {
  label: string
  stockSchema: {
    campos: BusinessTypeField[]
  }
}

export type CrearNegocioInput = Pick<
  Business,
  'businessName' | 'tradeName' | 'ruc' | 'category' | 'industry' | 'email' | 'phone'
> & { address: BusinessAddress }
