import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Store, Package, MessageSquareMore, Cable, Users, Receipt, Truck, List, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard/negocio', icon: Store, label: 'Negocio' },
  { to: '/dashboard/stock', icon: Package, label: 'Stock' },
  { to: '/dashboard/equipo', icon: Users, label: 'Equipo' },
  { to: '/dashboard/chats', icon: MessageSquareMore, label: 'Chats' },
  { to: '/dashboard/canales', icon: Cable, label: 'Canales' },
  { to: '/dashboard/ordenes', icon: List, label: 'Órdenes' },
  { to: '/dashboard/verificacion-pagos', icon: Receipt, label: 'Verificación' },
  { to: '/dashboard/entregas', icon: Truck, label: 'Entregas' },
] as const

export default function Sidebar() {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await cerrarSesion()
    navigate('/login')
  }

  return (
    <aside className="flex h-full w-16 flex-col items-center gap-4 border-r border-border bg-white py-4 dark:bg-neutral-950">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white dark:bg-white dark:text-neutral-900">
        K
      </div>
      <div className="flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white'
              }`
            }
            title={label}
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800 dark:hover:text-red-400"
        title="Cerrar sesión"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </aside>
  )
}
