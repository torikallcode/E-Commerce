import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ShoppingBag } from 'lucide-react'
import { formatCurrency, productImage, truncate } from '../utils/format'
import { useAddToCart } from '../hooks/useCart'
import { Badge } from './ui/Badge'

export function ProductCard({ product, className }) {
  const [imageFailed, setImageFailed] = useState(false)
  const addToCart = useAddToCart()
  const outOfStock = product.stock <= 0

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft ${className ?? ''}`}>
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={imageFailed ? '/placeholder.svg' : productImage(product)}
          alt={product.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          {outOfStock ? (
            <Badge tone="bg-white/95 text-red-600 ring-red-100">Stok habis</Badge>
          ) : product.stock <= 5 ? (
            <Badge tone="bg-white/95 text-amber-700 ring-amber-100">Sisa {product.stock}</Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/products/${product.slug}`} className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink-900 transition group-hover:text-brand-600">
              {truncate(product.name, 64)}
            </h3>
          </Link>
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-brand-600" />
        </div>
        {product.description && <p className="mt-1.5 line-clamp-1 text-xs text-ink-500">{product.description}</p>}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-[11px] font-medium text-ink-300">Harga</p>
            <p className="text-base font-extrabold text-ink-900">{formatCurrency(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => addToCart.addToCart({ product_id: product.id, quantity: 1 })}
            disabled={outOfStock || addToCart.isPending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-ink-300"
            aria-label={`Tambahkan ${product.name} ke keranjang`}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
