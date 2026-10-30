import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import { adminApi } from '../../api/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency, formatNumber } from '../../utils/format'

const statConfig = [
  { key: 'total_revenue', label: 'Total pendapatan', icon: BadgeDollarSign, tone: 'bg-emerald-50 text-emerald-600', format: 'currency' },
  { key: 'total_orders', label: 'Total pesanan', icon: ShoppingCart, tone: 'bg-brand-50 text-brand-600', format: 'number' },
  { key: 'total_products', label: 'Produk aktif', icon: Package, tone: 'bg-accent-50 text-accent-600', format: 'number' },
  { key: 'total_customers', label: 'Pelanggan', icon: Users, tone: 'bg-purple-50 text-purple-600', format: 'number' },
]

const statusCards = [
  { key: 'pending_orders', label: 'Menunggu bayar', icon: Clock3, status: 'pending_payment' },
  { key: 'paid_orders', label: 'Dibayar', icon: CheckCircle2, status: 'paid' },
  { key: 'shipped_orders', label: 'Dikirim', icon: Truck, status: 'shipped' },
  { key: 'completed_orders', label: 'Selesai', icon: CheckCircle2, status: 'completed' },
]

export function AdminDashboardPage() {
  const summaryQuery = useQuery({ queryKey: ['admin', 'summary'], queryFn: adminApi.summary })
  const summary = summaryQuery.data?.data

  if (summaryQuery.isError) {
    return (
      <div>
        <AdminPageHeader title="Dashboard" description="Ringkasan performa toko." />
        <div className="mt-6">
          <ErrorState message={summaryQuery.error?.response?.data?.message} onRetry={() => summaryQuery.refetch()} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Pantau performa penjualan, stok, dan pesanan terbaru dari satu tempat."
        action={
          <Link
            to="/admin/orders"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Kelola pesanan <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statConfig.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.key} className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              {summaryQuery.isLoading ? (
                <Skeleton className="mt-5 h-8 w-28 rounded" />
              ) : (
                <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900">
                  {item.format === 'currency'
                    ? formatCurrency(summary?.[item.key])
                    : formatNumber(summary?.[item.key])}
                </p>
              )}
              <p className="mt-1 text-xs font-medium text-ink-500">{item.label}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statusCards.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.key}
              to={`/admin/orders?status=${item.status}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-600 transition group-hover:bg-ink-900 group-hover:text-white">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold text-ink-900">
                  {summaryQuery.isLoading ? '—' : formatNumber(summary?.[item.key])}
                </p>
                <p className="truncate text-[11px] font-medium text-ink-500">{item.label}</p>
              </div>
              <StatusBadge status={item.status} className="hidden 2xl:inline-flex" />
            </Link>
          )
        })}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="card-surface overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                <Boxes className="h-4 w-4 text-brand-600" /> Produk terlaris
              </h2>
              <p className="mt-0.5 text-xs text-ink-500">Berdasarkan jumlah unit terjual pada pesanan dibayar.</p>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-brand-600 hover:underline">
              Semua produk
            </Link>
          </div>

          {summaryQuery.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (summary?.top_products?.length ?? 0) === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-500">
              Belum ada data penjualan. Produk terlaris muncul setelah ada pesanan dibayar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-5 py-2.5 font-bold">#</th>
                    <th className="px-3 py-2.5 font-bold">Produk</th>
                    <th className="px-3 py-2.5 text-right font-bold">Terjual</th>
                    <th className="px-5 py-2.5 text-right font-bold">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.top_products.map((product, index) => (
                    <tr key={product.product_id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-xs font-bold text-ink-400">{index + 1}</td>
                      <td className="px-3 py-3">
                        <p className="line-clamp-1 font-semibold text-ink-900">{product.product_name}</p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-ink-700">{formatNumber(product.quantity)}</td>
                      <td className="px-5 py-3 text-right font-bold text-ink-900">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card-surface p-5">
          <h2 className="text-base font-bold text-ink-900">Akses cepat</h2>
          <div className="mt-4 space-y-2">
            {[
              { to: '/admin/products', label: 'Tambah produk baru', icon: Package, text: 'Atur harga, stok, dan gambar' },
              { to: '/admin/categories', label: 'Kelola kategori', icon: Boxes, text: 'Rapikan struktur katalog' },
              { to: '/admin/orders', label: 'Proses pesanan', icon: ShoppingCart, text: 'Ubah status & input resi' },
              { to: '/admin/users', label: 'Lihat pengguna', icon: Users, text: 'Daftar akun terdaftar' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-900">{item.label}</span>
                    <span className="block text-[11px] text-ink-500">{item.text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-300" />
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
