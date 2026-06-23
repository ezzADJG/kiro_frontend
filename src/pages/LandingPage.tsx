import { Link } from 'react-router-dom'
import { MessageCircle, Bot, Package, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white dark:bg-white dark:text-neutral-900">
              K
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              Kiro
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/registro"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white">
            Gestiona las conversaciones de tu negocio en WhatsApp
          </h1>
          <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400">
            Plataforma inteligente para gestionar chats, productos y respuestas
            automáticas con tus clientes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-900"
            >
              Iniciar Sesión
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/registro"
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 px-6 py-20 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 p-8 dark:border-neutral-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <MessageCircle className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-white">
                Conversaciones
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Gestiona todas las conversaciones de WhatsApp con tus clientes en
                un solo lugar.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-8 dark:border-neutral-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Bot className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-white">
                Asistente Inteligente
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Define tus productos y servicios para que el asistente responda
                automáticamente.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-8 dark:border-neutral-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Package className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-white">
                Stock y Catálogo
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Mantén actualizado tu catálogo de productos y servicios para tus
                clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-8 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; 2026 Kiro. Todos los derechos reservados.
          </span>
        </div>
      </footer>
    </div>
  )
}
