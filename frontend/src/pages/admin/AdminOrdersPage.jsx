import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Search, ShoppingCart } from 'lucide-react'
import { adminApi } from '../../api/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Pagination } from '../../components/ui/Pagination'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { orderStatusMap } from '../../utils/status'

const statusOptions = Object.entries(orderStatusMap).map(([value, config]) => ({
  value,
  label: config.label,
}))

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [searchTerm, setSearchTerm] = useState(q)

  useEffect(() => setSearchTerm(q), [q])

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', { status, q, page }],
    queryFn: () =>
      adminApi.orders({
        status: status || undefined,
        q: q || undefined,
        page,
        per_page: 12,
      }),
    placeholderData: (previous) => previous,
    refetchInterval: 30000,
  })

  const orders = ordersQuery.data?.data ?? []
  const meta = ordersQuery.data?.meta

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, String(value))
    })
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const submitSearch = (event) => {
    event.preventDefault()
    updateParams({ q: searchTerm.trim() })
  }

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage > 1) next.set('page', String(nextPage))
    else next.delete('page')
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <AdminPageHeader
        title="Pesanan"
        description="Pantau semua transaksi, verifikasi pembayaran, dan perbarui status pengiriman."
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={submitSearch} className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nomor pesanan…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </form>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-ink-700 focus:border-brand-500 focus:outline-none"
            aria-label="Filter status pesanan"
          >
            <option value="">Semua status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={() => ordersQuery.refetch()}>
            Muat ulang
          </Button>
        </div>
      </div>

      {status && (
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          Filter aktif: <StatusBadge status={status} />
          <button type="button" onClick={() => updateParams({ status: '' })} className="font-semibold text-brand-600 hover:underline">
            Hapus filter
          </button>
        </div>
      )}

      <div className="card-surface mt-4 overflow-hidden">
        {ordersQuery.isError ? (
          <div className="p-5">
            <ErrorState message={ordersQuery.error?.response?.data?.message} onRetry={() => ordersQuery.refetch()} />
          </div>
        ) : ordersQuery.isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={7} />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ShoppingCart}
              title="Tidak ada pesanan"
              description={
                status || q
                  ? 'Tidak ada pesanan yang cocok dengan filter saat ini.'
                  : 'Pesanan pelanggan akan muncul di sini setelah checkout.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Nomor pesanan</th>
                  <th className="px-3 py-3 font-bold">Penerima</th>
                  <th className="px-3 py-3 font-bold">Dibuat</th>
                  <th className="px-3 py-3 text-right font-bold">Item</th>
                  <th className="px-3 py-3 text-right font-bold">Total</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer transition hover:bg-slate-50/70"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-5 py-3">
                      <p className="font-bold text-ink-900">{order.order_number}</p>
                      <p className="text-[11px] text-ink-400">ID #{order.id}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-semibold text-ink-800">{order.address_snapshot?.recipient_name ?? '—'}</p>
                      <p className="text-[11px] text-ink-400">{order.address_snapshot?.phone ?? ''}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-500">{formatDateTime(order.created_at)}</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-ink-600">
                      {order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-ink-900">{formatCurrency(order.total_amount)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Detail <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Pagination page={meta?.page ?? page} totalPages={meta?.total_pages ?? 1} onChange={changePage} />
        {meta && meta.total > 0 && (
          <p className="text-xs text-ink-400">Menampilkan {orders.length} dari {meta.total} pesanan</p>
        )}
      </div>
    </div>
  )
}
