import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-neutral-950">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
