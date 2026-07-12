import { ref, get, set } from "firebase/database"
import { db } from "@/lib/firebase"
import type { Business } from "@/types/business"

export type OperadorEnvio = "shalom" | "olva"

export interface AgenciaShalom {
  id: number
  nombre: string
  direccion: string
  activo: boolean
}

export interface RemitenteData {
  razonSocial: string
  ruc: string
  telefono: string
  direccionFiscal: string
}

export interface AgenciaSeleccionada {
  id: number
  nombre: string
  direccion: string
}

export interface ConfigShalom {
  remitente: RemitenteData
  telefono: string
  agenciaSeleccionada: AgenciaSeleccionada | null
  precioLimaCallao: number | null
  precioProvincias: number | null
}

export interface ConfigOlva {
  dni: string
  correo: string
  origen: string
  precioLimaCallao: number | null
  precioProvincias: number | null
}

export interface ShippingConfig {
  shalom: ConfigShalom | null
  olva: ConfigOlva | null
}

export interface OlvaFormData {
  dni: string
  correo: string
  origen: string
  precioLimaCallao: number | null
  precioProvincias: number | null
}

export function mapearRemitenteDesdeBusiness(
  business: Business
): RemitenteData {
  return {
    razonSocial: business.businessName,
    ruc: business.ruc,
    telefono: business.phone,
    direccionFiscal: [
      business.address.street,
      business.address.district,
      business.address.province,
      business.address.department,
    ]
      .filter(Boolean)
      .join(", "),
  }
}

export function mapearOlvaDesdeBusiness(
  business: Business
): OlvaFormData {
  return {
    dni: "",
    correo: business.email ?? "",
    origen: business.address.department ?? "",
    precioLimaCallao: null,
    precioProvincias: null,
  }
}

export async function fetchAgencias(): Promise<AgenciaShalom[]> {
  const snapshot = await get(ref(db, "agencia_shalom"))
  if (!snapshot.exists()) return []
  const data = snapshot.val() as Record<string, AgenciaShalom>
  return Object.values(data).filter((a) => a.activo)
}

export async function fetchShippingConfig(
  businessId: string
): Promise<ShippingConfig | null> {
  const snapshot = await get(
    ref(db, `conf_envios/${businessId}/shippingConfig`)
  )
  return snapshot.exists() ? (snapshot.val() as ShippingConfig) : null
}

export async function saveShippingConfig(
  businessId: string,
  data: ShippingConfig
): Promise<void> {
  await set(ref(db, `conf_envios/${businessId}/shippingConfig`), data)
}
