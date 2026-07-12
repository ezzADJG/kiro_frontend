export type Transportista = 'SHALOM' | 'OLVA'

export interface ShalomShippingData {
  tipoDocumento: 'DNI' | 'RUC' | 'CE'
  documentoDestinatario: string
  nombreDestinatario: string
  telefonoDestinatario: string
  documentoContacto: string
  telefonoContacto: string
  departamento: string
  provincia: string
  distrito: string
  agenciaDestino: number | null
  direccion: string
  referencia: string
  descripcionMercaderia: string
}

export interface OlvaShippingData {
  tipoArticulo: string
  tipoDocumento: 'RUC' | 'DNI' | 'CE'
  celular: string
  razonSocial: string
  contacto: string
  apellidoPaterno: string
  apellidoMaterno: string
}

export interface ShippingData {
  ordenId: string
  transportista: Transportista
  datosEnvio: ShalomShippingData | OlvaShippingData
  completado: boolean
  createdAt: number
  updatedAt: number
}

export interface Agencia {
  id: number
  nombre: string
  departamento: string
  provincia: string
  distrito: string
  aereo?: boolean
  latitud?: number
  longitud?: number
}
