import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { BusinessProvider } from '@/context/BusinessContext'
import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/Login'
import Registro from '@/pages/Registro'
import RecuperarContrasena from '@/pages/RecuperarContrasena'
import Inicio from '@/pages/Inicio'
import ConfigurarNegocio from '@/pages/ConfigurarNegocio'
import Stock from '@/pages/Stock'
import Chats from '@/pages/Chats'
import Equipo from '@/pages/Equipo'
import Canales from '@/pages/Canales'
import AdminCanales from '@/pages/AdminCanales'
import PaymentDev from '@/pages/PaymentDev'
import AceptarInvitacion from '@/pages/AceptarInvitacion'
import RutaProtegida from '@/components/RutaProtegida'
import DashboardLayout from '@/components/DashboardLayout'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar" element={<RecuperarContrasena />} />
            <Route path="/invitar" element={<AceptarInvitacion />} />
            <Route element={<RutaProtegida />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Inicio />} />
                <Route path="/dashboard/negocio" element={<ConfigurarNegocio />} />
                <Route path="/dashboard/stock" element={<Stock />} />
                <Route path="/dashboard/chats" element={<Chats />} />
                <Route path="/dashboard/equipo" element={<Equipo />} />
                <Route path="/dashboard/canales" element={<Canales />} />
                <Route path="/dashboard/admin/canales" element={<AdminCanales />} />
                <Route path="/dashboard/pagos" element={<PaymentDev />} />
              </Route>
            </Route>
          </Routes>
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
