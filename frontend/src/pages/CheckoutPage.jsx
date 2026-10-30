import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react'
import { addressApi } from '../api/addresses'
import { orderApi } from '../api/orders'
import { useCart } from '../hooks/useCart'
import { usePayOrder } from '../hooks/usePayOrder'
import { AddressForm } from '../components/AddressForm'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Input'
import { EmptyState, ErrorState } from '../components/ui/States'
import { Skeleton } from '../components/ui/Skeleton'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../store/toastStore'
import { getErrorMessage } from '../utils/errors'
import { formatCurrency, cn } from '../utils/format'

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pay = usePayOrder()

  const cartQuery = useCart()
  const addressesQuery = useQuery({ queryKey: ['addresses'], queryFn: addressApi.list })

  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [note, setNote] = useState('')
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const cart = cartQuery.data?.data
  const items = cart?.items ?? []
  const addresses = addressesQuery.data?.data ?? []
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId)

  useEffect(() => {
    if (selectedAddressId || addresses.length === 0) return
    const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0]
    setSelectedAddressId(defaultAddress.id)
  }, [addresses, selectedAddressId])

  const createAddress = useMutation({
    mutationFn: addressApi.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setSelectedAddressId(response.data.id)
      setAddressModalOpen(false)
      toast.success('Alamat berhasil ditambahkan')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const checkout = useMutation({
    mutationFn: orderApi.checkout,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setCreatedOrder(response.data)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const subtotal = cart?.subtotal ?? 0
  const itemCount = cart?.item_count ?? 0

  const canCheckout = items.length > 0 && Boolean(selectedAddressId) && !checkout.isPending

  const handleCheckout = () => {
    if (!selectedAddressId) {
      toast.error('Pilih alamat pengiriman terlebih dahulu')
      return
    }
    checkout.mutate({ address_id: selectedAddressId, note: note.trim() || undefined })
  }

  const goToOrder = () => {
    if (!createdOrder) return
    navigate(`/orders/${createdOrder.order_number}`, { replace: true })
  }

  const handlePay = async () => {
    if (!createdOrder) return
    const result = await pay(createdOrder)
    if (result === 'success' || result === 'pending') goToOrder()
  }

  const stepLabels = useMemo(() => ['Keranjang', 'Pengiriman', 'Pembayaran'], [])

  if (cartQuery.isLoading || addressesQuery.isLoading) {
    return (
      <div className="container-page py-8 sm:py-12">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (cartQuery.isError) {
    return (
      <div className="container-page py-12">
        <ErrorState message={cartQuery.error?.response?.data?.message} onRetry={() => cartQuery.refetch()} />
      </div>
    )
  }

  if (items.length === 0 && !createdOrder) {
    return (
      <div className="container-page py-10 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow text-center">Checkout</p>
          <h1 className="section-title mt-2 text-center">Keranjang masih kosong</h1>
          <EmptyState
            className="mt-8"
            icon={ShoppingBag}
            title="Tidak ada yang bisa di-checkout"
            description="Tambahkan produk ke keranjang terlebih dahulu, lalu kembali ke halaman ini."
            action={
              <Button leftIcon={<Store className="h-4 w-4" />} onClick={() => navigate('/products')}>
                Jelajahi produk
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
        <Link to="/" className="hover:text-brand-600">Beranda</Link>
        <ChevronRight className="h-3 w-3 text-ink-300" />
        <Link to="/cart" className="hover:text-brand-600">Keranjang</Link>
        <ChevronRight className="h-3 w-3 text-ink-300" />
        <span className="font-semibold text-ink-900">Checkout</span>
      </nav>

      <div className="mt-4">
        <p className="eyebrow">Langkah 2 dari 2</p>
        <h1 className="section-title mt-2">Checkout pesanan</h1>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-400">
          {stepLabels.map((label, index) => (
            <span key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full',
                  index < 1 ? 'bg-emerald-500 text-white' : index === 1 ? 'bg-ink-900 text-white' : 'bg-slate-200 text-ink-500',
                )}
              >
                {index < 1 ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {label}
              {index < stepLabels.length - 1 && <span className="mx-1 h-px w-6 bg-slate-200" />}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          <section className="card-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                <MapPin className="h-4 w-4 text-brand-600" /> Alamat pengiriman
              </h2>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setAddressModalOpen(true)}
              >
                Tambah
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-ink-900">Belum ada alamat tersimpan</p>
                <p className="mt-1 text-xs text-ink-500">Tambahkan alamat pengiriman untuk melanjutkan checkout.</p>
                <Button
                  size="sm"
                  className="mt-4"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setAddressModalOpen(true)}
                >
                  Tambah alamat
                </Button>
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5">
                {addresses.map((address) => {
                  const selected = address.id === selectedAddressId
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                        selected
                          ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                          selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-ink-900">{address.recipient_name}</span>
                          <span className="text-xs text-ink-500">{address.phone}</span>
                          {address.is_default && (
                            <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-white">Utama</span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-ink-500">
                          {address.address_line}, {address.city}, {address.province} {address.postal_code}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
              <ShoppingBag className="h-4 w-4 text-brand-600" /> Produk pesanan
            </h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id ?? item.product_id} className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={item.image_url || '/placeholder.svg'}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-ink-900">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-ink-900">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="text-base font-bold text-ink-900">Catatan pesanan</h2>
            <p className="mt-1 text-xs text-ink-500">Opsional, misalnya patokan alamat atau jam pengiriman.</p>
            <Textarea
              className="mt-3"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tulis catatan untuk penjual…"
            />
            <p className="mt-1 text-right text-[11px] text-ink-400">{note.length}/500</p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="card-surface p-5">
            <h2 className="text-base font-bold text-ink-900">Ringkasan pembayaran</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Subtotal ({itemCount} item)</dt>
                <dd className="font-semibold text-ink-900">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Ongkos kirim</dt>
                <dd className="text-xs font-semibold text-ink-500">Dihitung server</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <dt className="font-bold text-ink-900">Total dibayar</dt>
                <dd className="text-lg font-extrabold text-ink-900">{formatCurrency(subtotal)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              Total akhir beserta ongkos kirim dihitung oleh server saat pesanan dibuat.
            </p>

            <Button
              size="lg"
              fullWidth
              className="mt-5"
              loading={checkout.isPending}
              disabled={!canCheckout}
              leftIcon={<CreditCard className="h-5 w-5" />}
              onClick={handleCheckout}
            >
              Buat pesanan & bayar
            </Button>

            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="mt-2 w-full text-center text-xs font-semibold text-ink-500 hover:text-ink-900"
            >
              Kembali ke keranjang
            </button>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-ink-500">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Data pembayaran diproses aman oleh Midtrans.
              </p>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" /> Stok dikunci saat pesanan berhasil dibuat.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Tambah alamat pengiriman"
        description="Alamat ini akan langsung dipilih untuk pesanan kamu."
        size="md"
      >
        <AddressForm
          onSubmit={(values) => createAddress.mutate(values)}
          loading={createAddress.isPending}
          onCancel={() => setAddressModalOpen(false)}
        />
      </Modal>

      <Modal
        open={Boolean(createdOrder)}
        onClose={goToOrder}
        title="Pesanan berhasil dibuat"
        description="Selesaikan pembayaran agar pesanan segera diproses."
        size="sm"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={goToOrder}>
              Lihat pesanan
            </Button>
            <Button
              leftIcon={<CreditCard className="h-4 w-4" />}
              onClick={handlePay}
            >
              {createdOrder?.dev_mode ? 'Buka simulasi pembayaran' : 'Bayar sekarang'}
            </Button>
          </div>
        }
      >
        {createdOrder && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-500">Nomor pesanan</span>
                <span className="font-bold text-ink-900">{createdOrder.order_number}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-500">Total pembayaran</span>
                <span className="font-extrabold text-ink-900">{formatCurrency(createdOrder.total_amount)}</span>
              </div>
            </div>
            {createdOrder.dev_mode && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                <p className="font-bold">Mode pengembangan</p>
                <p className="mt-1">
                  Midtrans belum dikonfigurasi. Gunakan simulasi pembayaran untuk menguji alur pesanan dari awal sampai selesai.
                </p>
              </div>
            )}
            <p className="text-xs text-ink-500">
              Pesanan akan otomatis kedaluwarsa jika tidak dibayar sebelum batas waktu. Kamu bisa membayar nanti dari halaman detail pesanan.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={() => {
          setShowLeaveConfirm(false)
          navigate('/cart')
        }}
        title="Kembali ke keranjang?"
        description="Pesanan belum dibuat dan data checkout yang kamu isi akan hilang."
        confirmLabel="Ya, kembali"
        variant="primary"
      />

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-ink-400">
        <ArrowRight className="h-3.5 w-3.5" />
        Punya kendala? <Link to="/profile" className="font-semibold text-brand-600 hover:underline">Hubungi dukungan</Link>
      </div>
    </div>
  )
}
