import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from 'lucide-react'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart'
import { Button } from '../components/ui/Button'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { EmptyState, ErrorState } from '../components/ui/States'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency } from '../utils/format'

export function CartPage() {
  const navigate = useNavigate()
  const cartQuery = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const [toRemove, setToRemove] = useState(null)

  const cart = cartQuery.data?.data
  const items = cart?.items ?? []
  const itemCount = cart?.item_count ?? 0
  const subtotal = cart?.subtotal ?? 0

  if (cartQuery.isLoading) {
    return (
      <div className="container-page py-8 sm:py-12">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (cartQuery.isError) {
    return (
      <div className="container-page py-12">
        <ErrorState
          message={cartQuery.error?.response?.data?.message}
          onRetry={() => cartQuery.refetch()}
        />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-10 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow text-center">Keranjang</p>
          <h1 className="section-title mt-2 text-center">Keranjang belanja</h1>
          <EmptyState
            className="mt-8"
            icon={ShoppingBag}
            title="Keranjang masih kosong"
            description="Yuk cari produk favoritmu dan tambahkan ke keranjang. Barang bagus menunggumu."
            action={
              <Button leftIcon={<Store className="h-4 w-4" />} onClick={() => navigate('/products')}>
                Mulai belanja
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <nav className="flex items-center gap-1.5 text-xs text-ink-500">
        <Link to="/" className="hover:text-brand-600">Beranda</Link>
        <span className="text-ink-300">/</span>
        <span className="font-semibold text-ink-900">Keranjang</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Langkah 1 dari 2</p>
          <h1 className="section-title mt-2">Keranjang belanja</h1>
          <p className="mt-1.5 text-sm text-ink-500">{itemCount} item siap untuk di-checkout.</p>
        </div>
        <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
          Tambah produk lain
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-3">
          {items.map((item) => {
            const maxQuantity = Number.isFinite(item.stock) ? Math.max(item.stock, 1) : 99
            const isUpdating = updateItem.isPending && updateItem.variables?.productId === item.product_id
            return (
              <article key={item.id ?? item.product_id} className="card-surface p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-28">
                    <img
                      src={item.image_url || '/placeholder.svg'}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-ink-900 sm:text-base">
                          {item.product_name}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-ink-700">{formatCurrency(item.price)}</p>
                        {Number.isFinite(item.stock) && item.stock <= 5 && (
                          <p className="mt-1 text-[11px] font-medium text-amber-600">Sisa stok {item.stock}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setToRemove(item)}
                        className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Hapus ${item.product_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div className="flex items-center gap-2">
                        <QuantityStepper
                          value={item.quantity}
                          min={1}
                          max={maxQuantity}
                          disabled={isUpdating}
                          size="sm"
                          onChange={(quantity) =>
                            updateItem.mutate({ productId: item.product_id, quantity })
                          }
                        />
                        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-ink-300" />}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-ink-400">Subtotal</p>
                        <p className="text-base font-extrabold text-ink-900">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-ink-500">
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-600" />
              Ongkos kirim dihitung otomatis oleh server saat pesanan dibuat.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="card-surface p-5">
            <h2 className="text-base font-bold text-ink-900">Ringkasan belanja</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Total harga ({itemCount} item)</dt>
                <dd className="font-semibold text-ink-900">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Ongkos kirim</dt>
                <dd className="text-xs font-semibold text-ink-500">Dihitung saat checkout</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-base">
                <dt className="font-bold text-ink-900">Subtotal</dt>
                <dd className="font-extrabold text-ink-900">{formatCurrency(subtotal)}</dd>
              </div>
            </dl>

            <Button
              size="lg"
              fullWidth
              className="mt-5"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate('/checkout')}
            >
              Lanjut ke checkout
            </Button>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-ink-500">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Pembayaran aman melalui Midtrans.
              </p>
              <p className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-brand-600" /> Stok dikunci saat pesanan dibuat.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(toRemove)}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          removeItem.mutate(toRemove.product_id, {
            onSettled: () => setToRemove(null),
          })
        }}
        title="Hapus item?"
        description={toRemove ? `“${toRemove.product_name}” akan dihapus dari keranjang belanja kamu.` : ''}
        confirmLabel="Hapus item"
        loading={removeItem.isPending}
      />
    </div>
  )
}
