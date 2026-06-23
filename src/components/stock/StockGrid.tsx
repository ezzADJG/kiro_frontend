import { Package, Pencil, Trash2 } from 'lucide-react'
import type { ProductItem } from '@/types'

interface StockGridProps {
  products: ProductItem[]
  editable?: boolean
  onEdit?: (product: ProductItem) => void
  onDelete?: (id: string) => void
}

export default function StockGrid({ products, editable, onEdit, onDelete }: StockGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-400">
        <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
          <Package className="h-8 w-8" />
        </div>
        <p className="text-sm">Tu cat&aacute;logo est&aacute; vac&iacute;o</p>
        <p className="text-xs text-neutral-400">
          Agrega productos o servicios para tu negocio
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">
                {product.name}
              </h4>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
                S/ {product.price.toFixed(2)}
              </p>
            </div>
            {editable && (
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit?.(product)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete?.(product.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          {product.category && (
            <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {product.category}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
