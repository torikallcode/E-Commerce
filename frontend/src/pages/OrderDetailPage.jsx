import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react'
import { orderApi } from '../api/orders'
import { usePayOrder } from '../hooks/usePayOrder'
import { Button } from '../components/ui/Button'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ErrorState } from '../components/ui/States'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from '../store/toastStore'
import { getErrorMessage } from '../utils/errors'
import { formatCurrency, formatDateTime, cn } from '../utils/format'
import { orderSteps, stepIndex, orderStatusLabel } from '../utils/status'

function useCountdown(target) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!target) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [target])

  if (!target) return null
  const diff = new Date(target).getTime() - now
  return diff > 0 ? diff : 0
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days} hari ${hours} jam`
  if (hours > 0) return `${hours} jam ${minutes} menit`
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function OrderDetailPage() {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pay = usePayOrder()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const orderQuery = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => orderApi.get(orderNumber),
    refetchInterval: (query) =>
      query.state.data?.data?.status === 'pending_payment' ? 15000 : false,
  })

  const order = orderQuery.data?.data
  const remaining = useCountdown(order?.status === 'pending_payment' ? order?.payment_expires_at : null)

  const cancelOrder = useMutation({
    mutationFn: () => orderApi.cancel(orderNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderNumber] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setConfirmCancel(false)
      toast.success('Pesanan berhasil dibatalkan')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const checkStatus = useMutation({
    mutationFn: () => orderApi.paymentStatus(orderNumber),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderNumber] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      const status = response.data?.order_status
      toast.info(`Status terbaru: ${orderStatusLabel(status)}`, 'Status pembayaran')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (orderQuery.isLoading) {
    return (
      <div className="container-page py-8 sm:py-12">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="mt-5 space-y-4">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-80 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="container-page py-12">
        <ErrorState
          message={orderQuery.error?.response?.data?.message ?? 'Pesanan tidak ditemukan.'}
          onRetry={() => orderQuery.refetch()}
        />
        <div className="mt-5 text-center">
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/orders')}>
            Kembali ke daftar pesanan
          </Button>
        </div>
      </div>
    )
  }

  const canPay = order.status === 'pending_payment'
  const canCancel = order.status === 'pending_payment'
  const negative = ['cancelled', 'expired', 'failed', 'refunded'].includes(order.status)
  const currentStep = stepIndex(order.status)
  const isShipped = ['shipped', 'completed'].includes(order.status)

  return (
    <div className="container-page py-6 sm:py-10">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke pesanan saya
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Detail pesanan</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{order.order_number}</h1>
          <p className="mt-1 text-sm text-ink-500">Dibuat {formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} className="text-xs" />
      </div>

      {canPay && remaining !== null && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {remaining > 0 ? (
              <>Selesaikan pembayaran dalam <span className="font-extrabold">{formatDuration(remaining)}</span></>
            ) : (
              <>Batas waktu pembayaran telah lewat. Pesanan akan segera kedaluwarsa.</>
            )}
          </p>
          <Button size="sm" onClick={() => pay(order)} leftIcon={<CreditCard className="h-3.5 w-3.5" />}>
            Bayar sekarang
          </Button>
        </div>
      )}

      {negative && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-600">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p>
            Pesanan ini berstatus <span className="font-bold">{orderStatusLabel(order.status)}</span>. Stok sudah dikembalikan ke toko dan pesanan tidak akan diproses.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <section className="card-surface p-5">
            <h2 className="text-base font-bold text-ink-900">Status pesanan</h2>
            {negative ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', order.status === 'refunded' ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-500')}>
                  <XCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{orderStatusLabel(order.status)}</p>
                  <p className="text-xs text-ink-500">Pesanan tidak dilanjutkan. Hubungi dukungan jika butuh bantuan.</p>
                </div>
              </div>
            ) : (
              <ol className="mt-5 grid grid-cols-5 gap-1">
                {orderSteps.map((step, index) => {
                  const done = index <= currentStep
                  const active = index === currentStep
                  return (
                    <li key={step.key} className="flex flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <span className={cn('h-0.5 flex-1', index === 0 ? 'bg-transparent' : done ? 'bg-brand-600' : 'bg-slate-200')} />
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                            done ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-ink-300',
                            active && 'ring-4 ring-brand-100',
                          )}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                        </span>
                        <span className={cn('h-0.5 flex-1', index === orderSteps.length - 1 ? 'bg-transparent' : index < currentStep ? 'bg-brand-600' : 'bg-slate-200')} />
                      </div>
                      <span className={cn('mt-2 text-[10px] font-semibold sm:text-xs', done ? 'text-ink-900' : 'text-ink-400')}>
                        {step.label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          <section className="card-surface overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                <Package className="h-4 w-4 text-brand-600" /> Produk pesanan
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-ink-900">{formatCurrency(item.subtotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-sm">
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
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5 text-base">
                <dt className="font-bold text-ink-900">Total</dt>
                <dd className="font-extrabold text-ink-900">{formatCurrency(order.total_amount)}</dd>
              </div>
            </dl>
          </section>

          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
              <MapPin className="h-4 w-4 text-brand-600" /> Alamat pengiriman
            </h2>
            {order.address_snapshot ? (
              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <p className="font-bold text-ink-900">
                  {order.address_snapshot.recipient_name}
                  <span className="ml-2 text-xs font-medium text-ink-500">{order.address_snapshot.phone}</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">
                  {order.address_snapshot.address_line}, {order.address_snapshot.city}, {order.address_snapshot.province}{' '}
                  {order.address_snapshot.postal_code}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-500">Alamat pengiriman tidak tersedia.</p>
            )}

            {order.tracking_number && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                <Truck className="h-4 w-4" />
                Nomor resi: <span className="font-extrabold">{order.tracking_number}</span>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
              <ReceiptText className="h-4 w-4 text-brand-600" /> Pembayaran
            </h2>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Status pembayaran</span>
                <Badge
                  tone={
                    order.payment_status === 'settlement' || order.payment_status === 'capture'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-slate-100 text-slate-600 ring-slate-200'
                  }
                >
                  {order.payment_status || 'Belum ada transaksi'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Metode</span>
                <span className="font-semibold text-ink-800">{order.payment_type || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Total tagihan</span>
                <span className="font-extrabold text-ink-900">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {canPay && (
                <Button fullWidth leftIcon={<CreditCard className="h-4 w-4" />} onClick={() => pay(order)}>
                  Bayar sekarang
                </Button>
              )}
              <Button
                variant="secondary"
                fullWidth
                loading={checkStatus.isPending}
                leftIcon={<RefreshCw className={cn('h-4 w-4', checkStatus.isPending && 'animate-spin')} />}
                onClick={() => checkStatus.mutate()}
              >
                Cek status pembayaran
              </Button>
              {canCancel && (
                <Button
                  variant="ghost"
                  fullWidth
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setConfirmCancel(true)}
                >
                  Batalkan pesanan
                </Button>
              )}
            </div>

            {isShipped && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Pesanan sudah dibayar dan sedang dalam proses pengiriman.</p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-xs leading-relaxed text-ink-500">
            <p className="font-bold text-ink-900">Butuh bantuan?</p>
            <p className="mt-1">
              Hubungi dukungan dengan menyertakan nomor pesanan <span className="font-semibold text-ink-700">{order.order_number}</span>.
            </p>
            <Link to="/profile" className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
              Buka halaman profil
            </Link>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancelOrder.mutate()}
        title="Batalkan pesanan?"
        description="Pesanan akan dibatalkan dan stok produk dikembalikan. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Batalkan pesanan"
        loading={cancelOrder.isPending}
      />
    </div>
  )
}
