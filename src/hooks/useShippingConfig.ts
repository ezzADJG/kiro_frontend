import { useState, useEffect, useCallback } from "react"
import { obtenerNegocio } from "@/services/businessService"
import {
  fetchAgencias,
  fetchShippingConfig,
  saveShippingConfig,
  mapearRemitenteDesdeBusiness,
  mapearOlvaDesdeBusiness,
  type OperadorEnvio,
  type AgenciaShalom,
  type RemitenteData,
  type AgenciaSeleccionada,
  type ConfigShalom,
  type ConfigOlva,
  type OlvaFormData,
} from "@/services/shippingConfigService"

export type { OperadorEnvio, OlvaFormData }

export interface ShippingFormState {
  remitente: RemitenteData
  telefono: string
  agenciaSeleccionada: AgenciaSeleccionada | null
  precioLimaCallao: string
  precioProvincias: string
}

export function useShippingConfig(businessId: string | null) {
  const [operador, setOperador] = useState<OperadorEnvio | null>(null)
  const [agencias, setAgencias] = useState<AgenciaShalom[]>([])
  const [shalomForm, setShalomForm] = useState<ShippingFormState | null>(null)
  const [olvaForm, setOlvaForm] = useState<OlvaFormData | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!businessId) {
      setCargando(false)
      return
    }

    let activo = true
    const id = businessId

    async function cargar() {
      setCargando(true)

      const [negocio, agenciasList, configExistente] = await Promise.all([
        obtenerNegocio(id),
        fetchAgencias(),
        fetchShippingConfig(id),
      ])

      if (!activo) return

      setAgencias(agenciasList)

      if (negocio) {
        const remitente = mapearRemitenteDesdeBusiness(negocio)

        if (configExistente?.shalom) {
          setShalomForm({
            remitente,
            telefono: configExistente.shalom.telefono,
            agenciaSeleccionada:
              configExistente.shalom.agenciaSeleccionada,
            precioLimaCallao: configExistente.shalom.precioLimaCallao != null ? String(configExistente.shalom.precioLimaCallao) : "",
            precioProvincias: configExistente.shalom.precioProvincias != null ? String(configExistente.shalom.precioProvincias) : "",
          })
        } else {
          setShalomForm({
            remitente,
            telefono: negocio.phone,
            agenciaSeleccionada: null,
            precioLimaCallao: "",
            precioProvincias: "",
          })
        }

        const olvaBase = configExistente?.olva ?? mapearOlvaDesdeBusiness(negocio)
        setOlvaForm({
          dni: olvaBase.dni,
          correo: olvaBase.correo,
          origen: olvaBase.origen,
          precioLimaCallao: olvaBase.precioLimaCallao != null ? String(olvaBase.precioLimaCallao) : "",
          precioProvincias: olvaBase.precioProvincias != null ? String(olvaBase.precioProvincias) : "",
        })
      }

      setCargando(false)
    }

    cargar()

    return () => {
      activo = false
    }
  }, [businessId])

  const actualizarTelefono = useCallback((telefono: string) => {
    setShalomForm((prev) => (prev ? { ...prev, telefono } : null))
  }, [])

  const seleccionarAgencia = useCallback(
    (agenciaId: number) => {
      const agencia = agencias.find((a) => a.id === agenciaId)
      if (!agencia) return
      setShalomForm((prev) =>
        prev
          ? {
              ...prev,
              agenciaSeleccionada: {
                id: agencia.id,
                nombre: agencia.nombre,
                direccion: agencia.direccion,
              },
            }
          : null
      )
    },
    [agencias]
  )

  const actualizarOlva = useCallback(
    (campo: string, valor: string) => {
      setOlvaForm((prev) =>
        prev && (campo === "dni" || campo === "correo" || campo === "origen" || campo === "precioLimaCallao" || campo === "precioProvincias")
          ? { ...prev, [campo]: valor }
          : prev
      )
    },
    []
  )

  const actualizarShalomPrecio = useCallback(
    (campo: "precioLimaCallao" | "precioProvincias", valor: string) => {
      setShalomForm((prev) => (prev ? { ...prev, [campo]: valor } : null))
    },
    []
  )

  const guardar = useCallback(async () => {
    if (!businessId || !shalomForm || !olvaForm) return false

    setGuardando(true)
    try {
      const data = {
        shalom: {
          remitente: shalomForm.remitente,
          telefono: shalomForm.telefono,
          agenciaSeleccionada: shalomForm.agenciaSeleccionada,
          precioLimaCallao: shalomForm.precioLimaCallao ? parseFloat(shalomForm.precioLimaCallao) : null,
          precioProvincias: shalomForm.precioProvincias ? parseFloat(shalomForm.precioProvincias) : null,
        } satisfies ConfigShalom,
        olva: {
          dni: olvaForm.dni,
          correo: olvaForm.correo,
          origen: olvaForm.origen,
          precioLimaCallao: olvaForm.precioLimaCallao ? parseFloat(olvaForm.precioLimaCallao) : null,
          precioProvincias: olvaForm.precioProvincias ? parseFloat(olvaForm.precioProvincias) : null,
        } satisfies ConfigOlva,
      }
      await saveShippingConfig(businessId, data)
      return true
    } finally {
      setGuardando(false)
    }
  }, [businessId, shalomForm, olvaForm])

  const configuracionCompleta = Boolean(
    operador === "shalom"
      ? shalomForm &&
          shalomForm.remitente.razonSocial.trim() &&
          shalomForm.remitente.ruc.trim() &&
          shalomForm.telefono.trim()
      : operador === "olva"
        ? olvaForm &&
          olvaForm.dni.trim() &&
          olvaForm.correo.trim() &&
          olvaForm.origen.trim()
        : false
  )

  return {
    operador,
    shalomForm,
    olvaForm,
    agencias,
    cargando,
    guardando,
    configuracionCompleta,
    setOperador,
    actualizarTelefono,
    seleccionarAgencia,
    actualizarOlva,
    actualizarShalomPrecio,
    guardar,
  }
}
