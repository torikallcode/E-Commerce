import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FlaskConical, ShieldAlert, Wallet } from 'lucide-react'
import { orderApi, paymentApi } from '../api/orders'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState } from '../components/ui/States'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from '../store/toastStore'
import { getErrorMessage } from '../utils/errors'
import { formatCurrency, formatDateTime } from '../utils/format'

export function PaymentDemoPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orderNumber = searchParams.get('order') ?? ''

  const orderQuery = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => orderApi.get(orderNumber),
    enabled: Boolean(orderNumber),
  })

  const settle = useMutation({
    mutationFn: () => paymentApi.devSettle(orderNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderNumber] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Pembayaran simulasi berhasil. Pesanan sudah dibayar.')
      setTimeout(() => navigate(`/orders/${orderNumber}`, { replace: true }), 600)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!orderNumber) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-xl">
          <EmptyState
            title="Nomor pesanan tidak ditemukan"
            description="Buka halaman simulasi dari detail pesanan yang masih menunggu pembayaran."
            action={
              <Button leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/orders')}>
                Lihat pesanan saya
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (orderQuery.isLoading) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-xl space-y-4">
          <Skeleton className="h-8 w-52 rounded" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (orderQuery.isError) {
    return (
      <div className="container-page py-12">
        <ErrorState message={orderQuery.error?.response?.data?.message} onRetry={() => orderQuery.refetch()} />
      </div>
    )
  }

  const order = orderQuery.data?.data
  const canPay = order?.status === 'pending_payment'

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link to={`/orders/${orderNumber}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke detail pesanan
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div>
            <p className="eyebrow text-amber-700">Mode pengembangan</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Simulasi pembayaran</h1>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <p className="flex items-center gap-2 font-bold">
            <ShieldAlert className="h-4 w-4" /> Hanya untuk pengujian lokal
          </p>
          <p className="mt-1">
            Halaman ini mensimulasikan notifikasi pembayaran Midtrans yang berhasil. Jangan gunakan di lingkungan produksi.
          </p>
        </div>

        <div className="card-surface mt-5 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink-500">Nomor pesanan</p>
                <p className="mt-0.5 text-sm font-extrabold text-ink-900">{order.order_number}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <Wallet className="h-4 w-4 text-brand-600" /> Total tagihan
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-ink-900">{formatCurrency(order.total_amount)}</p>
            </div>

            <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Dibuat</dt>
                <dd className="font-semibold text-ink-700">{formatDateTime(order.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Batas pembayaran</dt>
                <dd className="font-semibold text-ink-700">{formatDateTime(order.payment_expires_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Metode</dt>
                <dd className="font-semibold text-ink-700">Simulasi (development)</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-300">Rincian item</p>
              <ul className="mt-2 space-y-2">
                {order.items?.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-ink-600">
                      {item.product_name} <span className="text-ink-400">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink-800">{formatCurrency(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {canPay ? (
              <Button
                size="lg"
                fullWidth
                className="mt-5"
                loading={settle.isPending}
                leftIcon={<CheckCircle2 className="h-5 w-5" />}
                onClick={() => settle.mutate()}
              >
                Simulasikan pembayaran berhasil
              </Button>
            ) : (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Pesanan ini tidak lagi menunggu pembayaran.
              </div>
            )}

            <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-400">
              Simulasi akan menandai pesanan sebagai dibayar dan mengirim notifikasi internal seperti webhook Midtrans.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
