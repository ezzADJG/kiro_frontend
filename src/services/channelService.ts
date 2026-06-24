import { push, set, update } from 'firebase/database'
import {
  phonesNoMetaIdRef,
  phoneNoMetaIdRef,
  phoneRef,
} from '@/lib/db'
import type { ChannelStatus } from '@/types/channels'

export async function registrarTelefono(
  businessId: string,
  phoneNumber: string,
  description: string
): Promise<string> {
  const newRef = push(phonesNoMetaIdRef())
  if (!newRef.key) throw new Error('No se pudo generar un ID')

  await set(newRef, {
    phone_number: phoneNumber,
    description,
    business_id: businessId,
    estado: 'pendiente' satisfies ChannelStatus,
  })

  return newRef.key
}

export async function approvePhone(
  id: string,
  phoneNumberId: string,
  phoneNumber: string,
  description: string,
  businessId: string
): Promise<void> {
  await update(phoneNoMetaIdRef(id), {
    estado: 'conectado' satisfies ChannelStatus,
    phone_number_id: phoneNumberId,
  })

  await set(phoneRef(phoneNumberId), {
    phone_number: phoneNumber,
    description,
    business_id: businessId,
    estado: 'conectado' satisfies ChannelStatus,
  })
}
