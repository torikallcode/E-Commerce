import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CreditCard,
  PackageSearch,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { orderApi } from '../api/orders'
import { usePayOrder } from '../hooks/usePayOrder'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState } from '../components/ui/States'
import { Pagination } from '../components/ui/Pagination'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatDate, formatDateTime, cn } from '../utils/format'

const filters = [
  { value: '', label: 'Semua' },
  { value: 'pending_payment', label: 'Belum dibayar' },
  { value: 'pending_review', label: 'Ditinjau' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

function orderPreview(order) {
  const names = (order.items ?? []).map((item) => item.product_name)
  if (names.length === 0) return 'Tidak ada item'
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1} produk lain`
}

export function OrdersPage() {
  const navigate = useNavigate()
  const pay = usePayOrder()
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const ordersQuery = useQuery({
    queryKey: ['orders', { status, page }],
    queryFn: () => orderApi.list({ status: status || undefined, page, per_page: 8 }),
    refetchInterval: (query) => {
      const items = query.state.data?.data ?? []
      return items.some((order) => order.status === 'pending_payment' || order.status === 'pending_review')
        ? 15000
        : false
    },
  })

  const orders = ordersQuery.data?.data ?? []
  const meta = ordersQuery.data?.meta

  const setFilter = (nextStatus) => {
    const next = new URLSearchParams()
    if (nextStatus) next.set('status', nextStatus)
    setSearchParams(next, { replace: true })
  }

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage > 1) next.set('page', String(nextPage))
    else next.delete('page')
    setSearchParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Akun saya</p>
          <h1 className="section-title mt-2">Pesanan saya</h1>
          <p className="mt-1.5 text-sm text-ink-500">Pantau pembayaran dan status pengiriman pesananmu.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', ordersQuery.isFetching && 'animate-spin')} />}
            onClick={() => ordersQuery.refetch()}
          >
            Muat ulang
          </Button>
          <Link
            to="/products"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 text-xs font-semibold text-white transition hover:bg-brand-600"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Belanja lagi
          </Link>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => setFilter(filter.value)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              status === filter.value
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-slate-200 bg-white text-ink-600 hover:border-slate-300',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {ordersQuery.isError ? (
        <div className="mt-6">
          <ErrorState message={ordersQuery.error?.response?.data?.message} onRetry={() => ordersQuery.refetch()} />
        </div>
      ) : ordersQuery.isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={PackageSearch}
            title="Belum ada pesanan"
            description={
              status
                ? 'Tidak ada pesanan dengan status ini. Coba pilih filter lain.'
                : 'Setelah kamu checkout, pesanan akan muncul di sini dan bisa dilacak statusnya.'
            }
            action={
              <Button leftIcon={<ShoppingBag className="h-4 w-4" />} onClick={() => navigate('/products')}>
                Mulai belanja
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {orders.map((order) => {
              const canPay = order.status === 'pending_payment'
              const isShipped = ['shipped', 'completed'].includes(order.status)
              return (
                <article key={order.id} className="card-surface overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <p className="text-[11px] text-ink-400">Nomor pesanan</p>
                        <p className="text-sm font-extrabold text-ink-900">{order.order_number}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[11px] text-ink-400">Dibuat</p>
                        <p className="text-sm font-semibold text-ink-700">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[11px] text-ink-400">Total</p>
                        <p className="text-sm font-semibold text-ink-700">{formatCurrency(order.total_amount)}</p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-ink-600">
                          {isShipped ? <Truck className="h-5 w-5" /> : <ReceiptText className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-bold text-ink-900">{orderPreview(order)}</p>
                          <p className="mt-1 text-xs text-ink-500">
                            {order.items?.length ?? 0} jenis produk · {formatDateTime(order.created_at)}
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-ink-900 sm:hidden">
                            {formatCurrency(order.total_amount)}
                          </p>
                          {order.tracking_number && (
                            <p className="mt-1 text-xs text-ink-500">
                              Resi: <span className="font-semibold text-ink-700">{order.tracking_number}</span>
                            </p>
                          )}
                          {canPay && order.payment_expires_at && (
                            <p className="mt-1 text-[11px] font-semibold text-amber-600">
                              Bayar sebelum {formatDateTime(order.payment_expires_at)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {canPay && (
                          <Button
                            size="sm"
                            leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                            onClick={() => pay(order)}
                          >
                            Bayar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                          onClick={() => navigate(`/orders/${order.order_number}`)}
                        >
                          Detail
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Pagination page={meta?.page ?? page} totalPages={meta?.total_pages ?? 1} onChange={changePage} />
            {meta && meta.total > 0 && (
              <p className="text-xs text-ink-400">Menampilkan {orders.length} dari {meta.total} pesanan</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
