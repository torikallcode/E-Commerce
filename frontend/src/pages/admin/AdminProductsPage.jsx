import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink,
  ImageIcon,
  Images,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { adminApi } from '../../api/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Pagination } from '../../components/ui/Pagination'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { toast } from '../../store/toastStore'
import { getErrorMessage } from '../../utils/errors'
import { formatCurrency, productImage } from '../../utils/format'

const productSchema = z.object({
  category_id: z.coerce.number().int().positive('Pilih kategori'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(255, 'Nama maksimal 255 karakter'),
  slug: z.string().max(255, 'Slug maksimal 255 karakter').optional(),
  description: z.string().max(5000, 'Deskripsi terlalu panjang').optional(),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  stock: z.coerce.number().int('Stok harus bilangan bulat').min(0, 'Stok tidak boleh negatif'),
  is_active: z.boolean(),
})

function ProductFormModal({ open, product, categories, onClose }) {
  const queryClient = useQueryClient()
  const editing = Boolean(product)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category_id: '',
      name: '',
      slug: '',
      description: '',
      price: 0,
      stock: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      category_id: product?.category_id ?? categories[0]?.id ?? '',
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      is_active: product?.is_active ?? true,
    })
  }, [open, product, categories, reset])

  const save = useMutation({
    mutationFn: (values) => {
      const payload = {
        ...values,
        slug: values.slug?.trim() || undefined,
        description: values.description?.trim() ?? '',
      }
      return editing ? adminApi.updateProduct(product.id, payload) : adminApi.createProduct(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(editing ? 'Produk berhasil diperbarui' : 'Produk berhasil dibuat')
      onClose()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Ubah produk' : 'Tambah produk'}
      description="Lengkapi informasi produk, harga, dan ketersediaan stok."
      size="lg"
    >
      <form onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-4" noValidate>
        <Input label="Nama produk" error={errors.name?.message} {...register('name')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Kategori"
            error={errors.category_id?.message}
            placeholder="Pilih kategori"
            {...register('category_id')}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Input
            label="Slug"
            hint="Opsional. Dibuat otomatis dari nama jika kosong."
            error={errors.slug?.message}
            {...register('slug')}
          />
        </div>
        <Textarea
          label="Deskripsi"
          rows={4}
          error={errors.description?.message}
          placeholder="Jelaskan keunggulan, bahan, ukuran, atau isi paket…"
          {...register('description')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Harga (Rp)"
            type="number"
            min="0"
            step="0.01"
            error={errors.price?.message}
            {...register('price')}
          />
          <Input
            label="Stok"
            type="number"
            min="0"
            step="1"
            error={errors.stock?.message}
            {...register('stock')}
          />
        </div>
        <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...register('is_active')}
          />
          Tampilkan produk di katalog (aktif)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" loading={save.isPending}>
            {editing ? 'Simpan perubahan' : 'Buat produk'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ImageManagerModal({ open, product, onClose }) {
  const queryClient = useQueryClient()
  const fileRef = useRef(null)
  const [url, setUrl] = useState('')
  const [deletingImage, setDeletingImage] = useState(null)

  const images = product?.images ?? []

  useEffect(() => {
    if (!open) {
      setUrl('')
      setDeletingImage(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    queryClient.invalidateQueries({ queryKey: ['product', product?.slug] })
  }

  const upload = useMutation({
    mutationFn: (file) => adminApi.uploadProductImage(product.id, file, images.length),
    onSuccess: () => {
      refresh()
      toast.success('Gambar berhasil diunggah')
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const addUrl = useMutation({
    mutationFn: () => adminApi.addProductImageUrl(product.id, { url: url.trim(), sort_order: images.length }),
    onSuccess: () => {
      refresh()
      setUrl('')
      toast.success('Gambar berhasil ditambahkan')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const removeImage = useMutation({
    mutationFn: (imageId) => adminApi.deleteProductImage(product.id, imageId),
    onSuccess: () => {
      refresh()
      setDeletingImage(null)
      toast.success('Gambar berhasil dihapus')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kelola gambar produk"
      description={product?.name}
      size="lg"
    >
      <div className="space-y-5">
        {images.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm font-semibold text-ink-900">Belum ada gambar</p>
            <p className="mt-1 text-xs text-ink-500">Unggah file atau tambahkan URL gambar di bawah.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-ink-900/70 px-2 py-1.5 opacity-0 transition group-hover:opacity-100">
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded p-1 text-white/80 hover:text-white"
                    aria-label="Buka gambar"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeletingImage(image)}
                    className="rounded p-1 text-white/80 hover:text-red-300"
                    aria-label="Hapus gambar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink-700">
                  #{image.sort_order}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Upload className="h-4 w-4 text-brand-600" /> Unggah gambar
          </p>
          <p className="mt-1 text-xs text-ink-500">Format JPG, PNG, WEBP, atau GIF. Maksimal 5MB per gambar.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) upload.mutate(file)
            }}
            disabled={upload.isPending}
            className="mt-3 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white text-xs text-ink-500 file:mr-3 file:cursor-pointer file:border-0 file:bg-ink-900 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-600 disabled:opacity-60"
          />
          {upload.isPending && <p className="mt-2 text-xs font-medium text-brand-600">Mengunggah…</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Link2 className="h-4 w-4 text-brand-600" /> Tambah dari URL
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://contoh.com/gambar.jpg"
              className="field-input flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              loading={addUrl.isPending}
              disabled={!url.trim()}
              onClick={() => addUrl.mutate()}
            >
              Tambahkan
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deletingImage)}
        onClose={() => setDeletingImage(null)}
        onConfirm={() => removeImage.mutate(deletingImage.id)}
        title="Hapus gambar?"
        description="Gambar akan dihapus dari galeri produk. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus gambar"
        loading={removeImage.isPending}
      />
    </Modal>
  )
}

export function AdminProductsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [searchTerm, setSearchTerm] = useState(q)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [managingImages, setManagingImages] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)

  useEffect(() => setSearchTerm(q), [q])

  const categoriesQuery = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories })
  const productsQuery = useQuery({
    queryKey: ['admin', 'products', { q, page }],
    queryFn: () => adminApi.products({ q: q || undefined, page, per_page: 10 }),
    placeholderData: (previous) => previous,
  })

  const categories = categoriesQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const meta = productsQuery.data?.meta
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  )
  const imageManagerProduct = managingImages
    ? products.find((product) => product.id === managingImages.id) ?? managingImages
    : null

  const deleteProduct = useMutation({
    mutationFn: (id) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
      setDeletingProduct(null)
      toast.success('Produk berhasil dihapus')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const submitSearch = (event) => {
    event.preventDefault()
    const next = new URLSearchParams()
    if (searchTerm.trim()) next.set('q', searchTerm.trim())
    setSearchParams(next, { replace: true })
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
        title="Produk"
        description="Kelola katalog, harga, stok, dan galeri gambar produk."
        action={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingProduct(null)
              setFormOpen(true)
            }}
          >
            Tambah produk
          </Button>
        }
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={submitSearch} className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama produk…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </form>
        <p className="text-xs text-ink-500">{meta ? `${meta.total} produk terdaftar` : ''}</p>
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        {productsQuery.isError ? (
          <div className="p-5">
            <ErrorState message={productsQuery.error?.response?.data?.message} onRetry={() => productsQuery.refetch()} />
          </div>
        ) : productsQuery.isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={6} />
          </div>
        ) : products.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Produk tidak ditemukan"
              description={q ? 'Coba kata kunci lain atau reset pencarian.' : 'Belum ada produk. Tambahkan produk pertama untuk mulai berjualan.'}
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setEditingProduct(null)
                    setFormOpen(true)
                  }}
                >
                  Tambah produk
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Produk</th>
                  <th className="px-3 py-3 font-bold">Kategori</th>
                  <th className="px-3 py-3 text-right font-bold">Harga</th>
                  <th className="px-3 py-3 text-right font-bold">Stok</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="align-middle transition hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={productImage(product)}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 object-cover"
                          onError={(event) => {
                            event.currentTarget.src = '/placeholder.svg'
                          }}
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 max-w-[260px] font-semibold text-ink-900">{product.name}</p>
                          <p className="line-clamp-1 max-w-[260px] text-[11px] text-ink-400">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-600">{categoryMap[product.category_id] ?? '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-ink-800">{formatCurrency(product.price)}</td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={
                          product.stock <= 0
                            ? 'font-bold text-red-600'
                            : product.stock <= 5
                              ? 'font-bold text-amber-600'
                              : 'font-semibold text-ink-700'
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {product.is_active ? (
                        <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-200" dot="bg-emerald-500">Aktif</Badge>
                      ) : (
                        <Badge tone="bg-slate-100 text-slate-600 ring-slate-200" dot="bg-slate-400">Nonaktif</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setManagingImages(product)}
                          className="rounded-lg p-2 text-ink-400 transition hover:bg-slate-100 hover:text-ink-900"
                          aria-label={`Kelola gambar ${product.name}`}
                          title="Kelola gambar"
                        >
                          <Images className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product)
                            setFormOpen(true)
                          }}
                          className="rounded-lg p-2 text-ink-400 transition hover:bg-slate-100 hover:text-ink-900"
                          aria-label={`Ubah ${product.name}`}
                          title="Ubah produk"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(product)}
                          className="rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Hapus ${product.name}`}
                          title="Hapus produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
          <p className="text-xs text-ink-400">Menampilkan {products.length} dari {meta.total} produk</p>
        )}
      </div>

      <ProductFormModal
        open={formOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => {
          setFormOpen(false)
          setEditingProduct(null)
        }}
      />

      {imageManagerProduct && (
        <ImageManagerModal
          open={Boolean(imageManagerProduct)}
          product={imageManagerProduct}
          onClose={() => setManagingImages(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => deleteProduct.mutate(deletingProduct.id)}
        title="Hapus produk?"
        description={
          deletingProduct
            ? `“${deletingProduct.name}” akan dihapus dari katalog. Produk dengan riwayat pesanan tidak dapat dihapus; nonaktifkan saja.`
            : ''
        }
        confirmLabel="Hapus produk"
        loading={deleteProduct.isPending}
      />
    </div>
  )
}
