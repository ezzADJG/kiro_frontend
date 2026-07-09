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
          })
        } else {
          setShalomForm({
            remitente,
            telefono: negocio.phone,
            agenciaSeleccionada: null,
          })
        }

        setOlvaForm(
          configExistente?.olva ?? mapearOlvaDesdeBusiness(negocio)
        )
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
        prev && (campo === "dni" || campo === "correo" || campo === "origen")
          ? { ...prev, [campo]: valor }
          : prev
      )
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
        } satisfies ConfigShalom,
        olva: olvaForm satisfies ConfigOlva,
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
    guardar,
  }
}
