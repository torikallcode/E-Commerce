import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CreditCard,
  MapPin,
  Package,
  Save,
  Truck,
  UserRound,
} from 'lucide-react'
import { adminApi } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { StatusBadge, Badge } from '../../components/ui/Badge'
import { ErrorState } from '../../components/ui/States'
import { Skeleton } from '../../components/ui/Skeleton'
import { toast } from '../../store/toastStore'
import { getErrorMessage } from '../../utils/errors'
import { formatCurrency, formatDateTime, cn } from '../../utils/format'
import { allowedNextStatuses, orderStatusLabel } from '../../utils/status'

export function AdminOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [nextStatus, setNextStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  const orderQuery = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => adminApi.order(id),
  })

  const order = orderQuery.data?.data

  const updateStatus = useMutation({
    mutationFn: () =>
      adminApi.updateOrderStatus(id, {
        status: nextStatus,
        tracking_number: nextStatus === 'shipped' ? trackingNumber.trim() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
      setNextStatus('')
      setTrackingNumber('')
      toast.success('Status pesanan berhasil diperbarui')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (orderQuery.isError || !order) {
    return (
      <div>
        <ErrorState
          message={orderQuery.error?.response?.data?.message ?? 'Pesanan tidak ditemukan.'}
          onRetry={() => orderQuery.refetch()}
        />
        <div className="mt-5 text-center">
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/admin/orders')}>
            Kembali ke daftar pesanan
          </Button>
        </div>
      </div>
    )
  }

  const allowed = allowedNextStatuses(order.status)
  const needsTracking = nextStatus === 'shipped'
  const canSubmit = Boolean(nextStatus) && (!needsTracking || Boolean(trackingNumber.trim()))

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/admin/orders')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke pesanan
      </button>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Detail pesanan</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{order.order_number}</h1>
          <p className="mt-1 text-sm text-ink-500">Dibuat {formatDateTime(order.created_at)} · ID #{order.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <Badge tone="bg-slate-100 text-slate-600 ring-slate-200">Pelanggan #{order.user_id}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_380px] xl:items-start">
        <div className="space-y-4">
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
              <Package className="h-4 w-4 text-brand-600" /> Item pesanan
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="rounded-l-lg px-3 py-2 font-bold">Produk</th>
                    <th className="px-3 py-2 text-right font-bold">Harga</th>
                    <th className="px-3 py-2 text-right font-bold">Qty</th>
                    <th className="rounded-r-lg px-3 py-2 text-right font-bold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-3 font-semibold text-ink-900">{item.product_name}</td>
                      <td className="px-3 py-3 text-right text-xs text-ink-600">{formatCurrency(item.price)}</td>
                      <td className="px-3 py-3 text-right text-xs font-semibold text-ink-700">{item.quantity}</td>
                      <td className="py-3 pl-3 text-right font-bold text-ink-900">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-semibold text-ink-800">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Ongkos kirim</dt>
                <dd className="font-semibold text-ink-800">
                  {order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : 'Gratis'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-base">
                <dt className="font-bold text-ink-900">Total</dt>
                <dd className="font-extrabold text-ink-900">{formatCurrency(order.total_amount)}</dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="card-surface p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                <MapPin className="h-4 w-4 text-brand-600" /> Alamat pengiriman
              </h2>
              {order.address_snapshot ? (
                <div className="mt-3 text-sm">
                  <p className="font-bold text-ink-900">{order.address_snapshot.recipient_name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{order.address_snapshot.phone}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-600">
                    {order.address_snapshot.address_line}, {order.address_snapshot.city}, {order.address_snapshot.province}{' '}
                    {order.address_snapshot.postal_code}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-500">Tidak ada data alamat.</p>
              )}
            </section>

            <section className="card-surface p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                <CreditCard className="h-4 w-4 text-brand-600" /> Pembayaran
              </h2>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-500">Status transaksi</dt>
                  <dd className="font-semibold text-ink-800">{order.payment_status || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-500">Metode</dt>
                  <dd className="font-semibold text-ink-800">{order.payment_type || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-500">Batas bayar</dt>
                  <dd className="font-semibold text-ink-800">{formatDateTime(order.payment_expires_at)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-500">Resi</dt>
                  <dd className="font-semibold text-ink-800">{order.tracking_number || '—'}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="card-surface p-5">
            <h2 className="text-base font-bold text-ink-900">Riwayat status</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {['pending_payment', 'paid', 'processing', 'shipped', 'completed'].map((status) => {
                const active = status === order.status
                const negative = ['cancelled', 'expired', 'failed', 'refunded'].includes(order.status)
                return (
                  <span
                    key={status}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset',
                      active
                        ? 'bg-ink-900 text-white ring-ink-900'
                        : negative
                          ? 'bg-slate-50 text-ink-400 ring-slate-200'
                          : 'bg-white text-ink-600 ring-slate-200',
                    )}
                  >
                    {active ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                    {orderStatusLabel(status)}
                  </span>
                )
              })}
            </div>
            {order.status === 'shipped' && order.tracking_number && (
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                <Truck className="h-4 w-4 text-indigo-500" /> Dikirim dengan resi{' '}
                <span className="font-bold text-ink-800">{order.tracking_number}</span>
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="card-surface p-5">
            <h2 className="text-base font-bold text-ink-900">Perbarui status</h2>
            <p className="mt-1 text-xs text-ink-500">
              Hanya transisi yang valid yang ditampilkan. Stok otomatis dikembalikan saat pesanan dibatalkan setelah dibayar.
            </p>

            {allowed.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-ink-500">
                Tidak ada transisi status yang tersedia untuk status <span className="font-semibold">{orderStatusLabel(order.status)}</span>.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="field-label" htmlFor="next-status">Status berikutnya</label>
                <select
                  id="next-status"
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  className="field-input"
                >
                  <option value="">Pilih status…</option>
                  {allowed.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabel(status)}
                    </option>
                  ))}
                </select>

                {needsTracking && (
                  <div>
                    <label className="field-label" htmlFor="tracking">Nomor resi</label>
                    <input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(event) => setTrackingNumber(event.target.value)}
                      placeholder="Contoh: JNE1234567890"
                      className="field-input"
                    />
                    <p className="mt-1 text-[11px] text-ink-400">Wajib diisi saat menandai pesanan dikirim.</p>
                  </div>
                )}

                <Button
                  fullWidth
                  loading={updateStatus.isPending}
                  disabled={!canSubmit}
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={() => updateStatus.mutate()}
                >
                  Simpan status
                </Button>
              </div>
            )}
          </section>

          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
              <UserRound className="h-4 w-4 text-brand-600" /> Informasi pesanan
            </h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">ID pelanggan</dt>
                <dd className="font-semibold text-ink-800">#{order.user_id}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Dibuat</dt>
                <dd className="font-semibold text-ink-800">{formatDateTime(order.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Diperbarui</dt>
                <dd className="font-semibold text-ink-800">{formatDateTime(order.updated_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Jumlah item</dt>
                <dd className="font-semibold text-ink-800">
                  {order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
                </dd>
              </div>
            </dl>
            <Link
              to="/admin/orders"
              className="mt-4 inline-flex text-xs font-semibold text-brand-600 hover:underline"
            >
              Lihat semua pesanan
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
