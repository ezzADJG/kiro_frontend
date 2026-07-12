import type { Driver, Employee, Agency, ShalomProduct, StoreProfile } from '@/types/payments'

export const storeProfile: StoreProfile = {
  name: 'KIRO STORE EIRL',
  document_type: 'RUC',
  document: '20123456789',
  last_name: '',
  sur_name: '',
  phone: 999888777,
  email: 'ventas@kiro.pe',
  address: 'Av. Larco 1234, Miraflores, Lima',
}

export const mockAgencies: Agency[] = [
  { id: 1, nombre: 'LIMA CENTRO', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LIMA', aereo: true, latitud: -12.046, longitud: -77.030 },
  { id: 2, nombre: 'LIMA NORTE', departamento: 'LIMA', provincia: 'LIMA', distrito: 'INDEPENDENCIA', aereo: true, latitud: -11.991, longitud: -77.054 },
  { id: 3, nombre: 'LIMA SUR', departamento: 'LIMA', provincia: 'LIMA', distrito: 'CHORRILLOS', aereo: true, latitud: -12.177, longitud: -77.009 },
  { id: 4, nombre: 'CALLAO', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'CALLAO', aereo: true, latitud: -12.056, longitud: -77.118 },
  { id: 5, nombre: 'AREQUIPA CENTRO', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'AREQUIPA', aereo: true, latitud: -16.409, longitud: -71.537 },
  { id: 6, nombre: 'CUSCO', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'CUSCO', aereo: false, latitud: -13.517, longitud: -71.978 },
  { id: 7, nombre: 'TRUJILLO', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'TRUJILLO', aereo: true, latitud: -8.110, longitud: -79.028 },
  { id: 8, nombre: 'CHICLAYO', departamento: 'LAMBAYEQUE', provincia: 'CHICLAYO', distrito: 'CHICLAYO', aereo: true, latitud: -6.771, longitud: -79.841 },
  { id: 9, nombre: 'PIURA', departamento: 'PIURA', provincia: 'PIURA', distrito: 'PIURA', aereo: false, latitud: -5.194, longitud: -80.632 },
  { id: 10, nombre: 'HUANCAYO', departamento: 'JUNIN', provincia: 'HUANCAYO', distrito: 'HUANCAYO', aereo: false, latitud: -12.068, longitud: -75.210 },
]

export const mockShalomProducts: ShalomProduct[] = [
  { id: 3, title: 'Sobre', content: 'Hasta 0.5 kg', sub_content: 'Documentos y similares', measurements: { weight: 0.5, width: 0.3, height: 0.02, length: 0.4 } },
  { id: 1095, title: 'Caja Paquete XXS', content: 'Hasta 1 kg', sub_content: 'Para envíos muy pequeños', measurements: { weight: 1, width: 0.2, height: 0.15, length: 0.25 } },
  { id: 1096, title: 'Caja Paquete XS', content: 'Hasta 3 kg', sub_content: 'Para envíos pequeños', measurements: { weight: 3, width: 0.25, height: 0.2, length: 0.35 } },
  { id: 1097, title: 'Caja Paquete S', content: 'Hasta 5 kg', sub_content: 'Para envíos medianos', measurements: { weight: 5, width: 0.3, height: 0.25, length: 0.4 } },
  { id: 1098, title: 'Otra Medida', content: 'Definí dimensiones', sub_content: 'Para bultos fuera de catálogo', measurements: { weight: 0, width: 0, height: 0, length: 0 } },
]

export const mockDrivers: Driver[] = [
  { id: 'drv_001', name: 'Juan Pérez López', phone: '+51 999 111 222', vehicle: 'Moto' },
  { id: 'drv_002', name: 'Carlos Mendoza Silva', phone: '+51 999 333 444', vehicle: 'Auto' },
  { id: 'drv_003', name: 'Luis Torres García', phone: '+51 999 555 666', vehicle: 'Furgoneta' },
  { id: 'drv_004', name: 'Miguel Ángel Ruiz', phone: '+51 999 777 888', vehicle: 'Moto' },
]

export const mockEmployees: Employee[] = [
  { id: 'emp_001', name: 'Ana Martínez López', email: 'ana.martinez@kiro.pe' },
  { id: 'emp_002', name: 'Roberto Sánchez Torres', email: 'roberto.sanchez@kiro.pe' },
  { id: 'emp_003', name: 'Claudia Torres García', email: 'claudia.torres@kiro.pe' },
  { id: 'emp_004', name: 'Diego Paredes Ríos', email: 'diego.paredes@kiro.pe' },
]

export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

export const formatShortDate = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(timestamp))
}

export const formatTime = (timestamp: number) => {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}


