export type ChannelStatus = 'pendiente' | 'conectado'

export interface PhoneNoMetaId {
  phone_number: string
  description: string
  business_id: string
  estado: ChannelStatus
  phone_number_id?: string
}

export interface PhoneChannel {
  phone_number: string
  description: string
  business_id: string
  estado: Extract<ChannelStatus, 'conectado'>
}
