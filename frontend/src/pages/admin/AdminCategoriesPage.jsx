import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { adminApi } from '../../api/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { toast } from '../../store/toastStore'
import { getErrorMessage } from '../../utils/errors'

const categorySchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  slug: z.string().max(100, 'Slug maksimal 100 karakter').optional(),
  parent_id: z.string().optional(),
})

function CategoryFormModal({ open, category, categories, onClose }) {
  const queryClient = useQueryClient()
  const editing = Boolean(category)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', parent_id: '' },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      parent_id: category?.parent_id ? String(category.parent_id) : '',
    })
  }, [open, category, reset])

  const save = useMutation({
    mutationFn: (values) => {
      const payload = {
        name: values.name,
        slug: values.slug?.trim() || undefined,
        parent_id: values.parent_id ? Number(values.parent_id) : null,
      }
      return editing ? adminApi.updateCategory(category.id, payload) : adminApi.createCategory(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(editing ? 'Kategori berhasil diperbarui' : 'Kategori berhasil dibuat')
      onClose()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const parentOptions = categories.filter((item) => item.id !== category?.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Ubah kategori' : 'Tambah kategori'}
      description="Kategori membantu pelanggan menemukan produk lebih cepat."
      size="sm"
    >
      <form onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-4" noValidate>
        <Input label="Nama kategori" error={errors.name?.message} {...register('name')} />
        <Input
          label="Slug"
          hint="Opsional. Dibuat otomatis dari nama jika kosong."
          error={errors.slug?.message}
          {...register('slug')}
        />
        <Select label="Kategori induk" {...register('parent_id')}>
          <option value="">Tanpa induk (kategori utama)</option>
          {parentOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" loading={save.isPending}>
            {editing ? 'Simpan perubahan' : 'Buat kategori'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)

  const categoriesQuery = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories })
  const categories = categoriesQuery.data?.data ?? []
  const parentName = (parentId) => categories.find((item) => item.id === parentId)?.name ?? '—'

  const deleteCategory = useMutation({
    mutationFn: (id) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setDeletingCategory(null)
      toast.success('Kategori berhasil dihapus')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div>
      <AdminPageHeader
        title="Kategori"
        description="Susun kategori utama dan sub-kategori agar katalog lebih mudah dijelajahi."
        action={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingCategory(null)
              setFormOpen(true)
            }}
          >
            Tambah kategori
          </Button>
        }
      />

      <div className="card-surface mt-6 overflow-hidden">
        {categoriesQuery.isError ? (
          <div className="p-5">
            <ErrorState message={categoriesQuery.error?.response?.data?.message} onRetry={() => categoriesQuery.refetch()} />
          </div>
        ) : categoriesQuery.isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={5} />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Tags}
              title="Belum ada kategori"
              description="Tambahkan kategori pertama sebelum membuat produk."
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setEditingCategory(null)
                    setFormOpen(true)
                  }}
                >
                  Tambah kategori
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Nama</th>
                  <th className="px-3 py-3 font-bold">Slug</th>
                  <th className="px-3 py-3 font-bold">Induk</th>
                  <th className="px-3 py-3 text-right font-bold">ID</th>
                  <th className="px-5 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <FolderTree className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-ink-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-500">{category.slug}</td>
                    <td className="px-3 py-3 text-xs text-ink-600">{parentName(category.parent_id)}</td>
                    <td className="px-3 py-3 text-right text-xs text-ink-400">#{category.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(category)
                            setFormOpen(true)
                          }}
                          className="rounded-lg p-2 text-ink-400 transition hover:bg-slate-100 hover:text-ink-900"
                          aria-label={`Ubah ${category.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCategory(category)}
                          className="rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Hapus ${category.name}`}
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

      <CategoryFormModal
        open={formOpen}
        category={editingCategory}
        categories={categories}
        onClose={() => {
          setFormOpen(false)
          setEditingCategory(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => deleteCategory.mutate(deletingCategory.id)}
        title="Hapus kategori?"
        description={
          deletingCategory
            ? `Kategori “${deletingCategory.name}” akan dihapus. Kategori yang masih dipakai produk tidak dapat dihapus.`
            : ''
        }
        confirmLabel="Hapus kategori"
        loading={deleteCategory.isPending}
      />
    </div>
  )
}
