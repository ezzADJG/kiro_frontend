import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useBusiness } from '@/context/BusinessContext'
import { obtenerTiposDeNegocio } from '@/services/businessTypes'
import { crearNegocio } from '@/services/businessService'
import type { BusinessType, CrearNegocioInput } from '@/types/business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ConfigurarNegocio() {
  const { firebaseUser } = useAuth()
  const { tieneNegocio, loadingBusiness, setActiveBusinessId, refrescarNegocios } =
    useBusiness()
  const navigate = useNavigate()

  const [industryOptions, setIndustryOptions] = useState<
    Record<string, BusinessType>
  >({})
  const [loadingIndustries, setLoadingIndustries] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [ruc, setRuc] = useState('')
  const [industry, setIndustry] = useState('')
  const [category, setCategory] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('')
  const [department, setDepartment] = useState('')

  const categoryOptions = [
    { value: 'mype', label: 'MYPE' },
    { value: 'pequena', label: 'Pequeña empresa' },
    { value: 'mediana', label: 'Mediana empresa' },
  ]

  useEffect(() => {
    obtenerTiposDeNegocio()
      .then((tipos) => setIndustryOptions(tipos))
      .finally(() => setLoadingIndustries(false))
  }, [])

  if (loadingBusiness) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Negocio ya configurado</CardTitle>
            <CardDescription>
              Ya tienes un negocio registrado en Kiro. La edici&oacute;n
              estar&aacute; disponible pr&oacute;ximamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const validate = (): string | null => {
    if (!businessName.trim()) return 'La razón social es requerida'
    if (!tradeName.trim()) return 'El nombre comercial es requerido'
    if (!ruc.trim()) return 'El RUC es requerido'
    if (!/^\d{11}$/.test(ruc)) return 'El RUC debe tener 11 dígitos numéricos'
    if (!industry) return 'Selecciona una industria'
    if (!category) return 'Selecciona una categoría'
    if (!email.trim()) return 'El correo es requerido'
    if (!/\S+@\S+\.\S+/.test(email)) return 'El correo no es válido'
    if (!phone.trim()) return 'El teléfono es requerido'
    if (!street.trim()) return 'La dirección es requerida'
    if (!district.trim()) return 'El distrito es requerido'
    if (!province.trim()) return 'La provincia es requerida'
    if (!department.trim()) return 'El departamento es requerido'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const datos: CrearNegocioInput = {
        businessName: businessName.trim(),
        tradeName: tradeName.trim(),
        ruc: ruc.trim(),
        industry,
        category,
        email: email.trim(),
        phone: phone.trim(),
        address: {
          street: street.trim(),
          district: district.trim(),
          province: province.trim(),
          department: department.trim(),
        },
      }

      const businessId = await crearNegocio(firebaseUser!.uid, datos)
      setActiveBusinessId(businessId)
      await refrescarNegocios()
      navigate('/dashboard')
    } catch {
      setError(
        'No se pudo crear el negocio. Intenta de nuevo o contacta soporte.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            K
          </div>
          <CardTitle>Crear tu negocio</CardTitle>
          <CardDescription>
            Completa los datos para registrar tu negocio en Kiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Datos b&aacute;sicos
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Raz&oacute;n social</Label>
                  <Input
                    id="businessName"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej: Restaurante El Buen Sabor S.A.C."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nombre comercial</Label>
                  <Input
                    id="tradeName"
                    required
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ej: El Buen Sabor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC</Label>
                  <Input
                    id="ruc"
                    required
                    maxLength={11}
                    value={ruc}
                    onChange={(e) =>
                      setRuc(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="12345678901"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industria</Label>
                  <Select
                    value={industry}
                    onValueChange={(v) => v !== null && setIndustry(v)}
                    disabled={loadingIndustries}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue
                        placeholder={
                          loadingIndustries
                            ? 'Cargando...'
                            : 'Selecciona una industria'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(industryOptions).map(
                        ([key, tipo]) => (
                          <SelectItem key={key} value={key}>
                            {tipo.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categor&iacute;a</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => v !== null && setCategory(v)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Contacto
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electr&oacute;nico</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@negocio.pe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Tel&eacute;fono</Label>
                  <Input
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51999000000"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Direcci&oacute;n
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="street">Calle / Av.</Label>
                  <Input
                    id="street"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Av. Principal 123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Distrito</Label>
                  <Input
                    id="district"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Miraflores"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input
                    id="province"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Lima"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Lima"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creando negocio...' : 'Crear negocio'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
