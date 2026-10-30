import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeCheck,
  Check,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { addressApi } from '../api/addresses'
import { authApi } from '../api/auth'
import { useMe } from '../hooks/useMe'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { getErrorMessage } from '../utils/errors'
import { formatDate, getInitials } from '../utils/format'
import { AddressForm } from '../components/AddressForm'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageLoader } from '../components/PageLoader'
import { ErrorState } from '../components/ui/States'

const profileSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

export function ProfilePage() {
  const queryClient = useQueryClient()
  const meQuery = useMe()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [deletingAddress, setDeletingAddress] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: '', email: '' } })

  useEffect(() => {
    if (user) reset({ name: user.name ?? '', email: user.email ?? '' })
  }, [user, reset])

  const addressesQuery = useQuery({ queryKey: ['addresses'], queryFn: addressApi.list })
  const addresses = addressesQuery.data?.data ?? []

  const updateProfile = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (response) => {
      setUser(response.data)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      reset({ name: response.data.name, email: response.data.email })
      toast.success('Profil berhasil diperbarui')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const saveAddress = useMutation({
    mutationFn: (values) =>
      editingAddress ? addressApi.update(editingAddress.id, values) : addressApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setAddressModalOpen(false)
      setEditingAddress(null)
      toast.success(editingAddress ? 'Alamat berhasil diperbarui' : 'Alamat berhasil ditambahkan')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const setDefault = useMutation({
    mutationFn: addressApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Alamat utama berhasil diubah')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const removeAddress = useMutation({
    mutationFn: addressApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setDeletingAddress(null)
      toast.success('Alamat berhasil dihapus')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (meQuery.isLoading && !user) return <PageLoader label="Memuat profil…" />
  if (meQuery.isError && !user) {
    return (
      <div className="container-page py-12">
        <ErrorState message={meQuery.error?.response?.data?.message} onRetry={() => meQuery.refetch()} />
      </div>
    )
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <div>
        <p className="eyebrow">Akun saya</p>
        <h1 className="section-title mt-2">Profil & alamat</h1>
        <p className="mt-1.5 text-sm text-ink-500">Kelola data akun dan alamat pengiriman yang tersimpan.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
        <aside className="space-y-4">
          <section className="card-surface overflow-hidden">
            <div className="bg-ink-900 px-5 py-6 text-white">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-lg font-extrabold">
                {getInitials(user?.name)}
              </span>
              <p className="mt-4 text-lg font-extrabold">{user?.name}</p>
              <p className="mt-0.5 break-all text-xs text-white/60">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="bg-white/10 text-white/80 ring-white/10" dot="bg-emerald-400">
                  {user?.role === 'admin' ? 'Administrator' : 'Pelanggan'}
                </Badge>
                {user?.role === 'admin' && (
                  <Badge tone="bg-brand-500/30 text-white ring-brand-300/20">
                    <BadgeCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
            </div>
            <div className="px-5 py-4 text-xs text-ink-500">
              <div className="flex items-center justify-between gap-3">
                <span>Bergabung</span>
                <span className="font-semibold text-ink-700">{formatDate(user?.created_at)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span>ID pengguna</span>
                <span className="font-semibold text-ink-700">#{user?.id ?? '—'}</span>
              </div>
            </div>
          </section>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs leading-relaxed text-emerald-800">
            <p className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4" /> Akun terlindungi
            </p>
            <p className="mt-1">
              Sesi menggunakan access token berumur pendek dan refresh token yang dicabut saat logout.
            </p>
          </div>
        </aside>

        <div className="space-y-4">
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
              <UserRound className="h-4 w-4 text-brand-600" /> Data profil
            </h2>
            <form
              onSubmit={handleSubmit((values) => updateProfile.mutate(values))}
              className="mt-4 space-y-4"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nama lengkap" error={errors.name?.message} {...register('name')} />
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-400">Perubahan email akan dipakai untuk login berikutnya.</p>
                <Button type="submit" loading={updateProfile.isPending} disabled={!isDirty}>
                  Simpan perubahan
                </Button>
              </div>
            </form>
          </section>

          <section className="card-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <MapPin className="h-4 w-4 text-brand-600" /> Buku alamat
                </h2>
                <p className="mt-1 text-xs text-ink-500">Alamat utama akan dipilih otomatis saat checkout.</p>
              </div>
              <Button
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setEditingAddress(null)
                  setAddressModalOpen(true)
                }}
              >
                Tambah alamat
              </Button>
            </div>

            {addressesQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="skeleton h-24 rounded-2xl" />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-ink-900">Belum ada alamat</p>
                <p className="mt-1 text-xs text-ink-500">Tambahkan alamat agar checkout berikutnya lebih cepat.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink-900">{address.recipient_name}</p>
                          <span className="text-xs text-ink-500">{address.phone}</span>
                          {address.is_default && (
                            <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-200" dot="bg-emerald-500">
                              Utama
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-500">
                          {address.address_line}, {address.city}, {address.province} {address.postal_code}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!address.is_default && (
                          <button
                            type="button"
                            onClick={() => setDefault.mutate(address.id)}
                            disabled={setDefault.isPending}
                            className="rounded-lg p-2 text-ink-300 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                            aria-label="Jadikan alamat utama"
                            title="Jadikan alamat utama"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(address)
                            setAddressModalOpen(true)
                          }}
                          className="rounded-lg p-2 text-ink-300 transition hover:bg-slate-100 hover:text-ink-700"
                          aria-label="Ubah alamat"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAddress(address)}
                          className="rounded-lg p-2 text-ink-300 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Hapus alamat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal
        open={addressModalOpen}
        onClose={() => {
          setAddressModalOpen(false)
          setEditingAddress(null)
        }}
        title={editingAddress ? 'Ubah alamat' : 'Tambah alamat'}
        description="Pastikan alamat lengkap agar pengiriman tidak terkendala."
      >
        <AddressForm
          key={editingAddress?.id ?? 'new'}
          initialValues={editingAddress}
          onSubmit={(values) => saveAddress.mutate(values)}
          loading={saveAddress.isPending}
          onCancel={() => {
            setAddressModalOpen(false)
            setEditingAddress(null)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingAddress)}
        onClose={() => setDeletingAddress(null)}
        onConfirm={() => removeAddress.mutate(deletingAddress.id)}
        title="Hapus alamat?"
        description={
          deletingAddress
            ? `Alamat untuk ${deletingAddress.recipient_name} akan dihapus permanen dari buku alamat.`
            : ''
        }
        confirmLabel="Hapus alamat"
        loading={removeAddress.isPending}
      />
    </div>
  )
}
