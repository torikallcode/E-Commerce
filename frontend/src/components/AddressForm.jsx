import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

const schema = z.object({
  recipient_name: z.string().min(2, 'Nama penerima minimal 2 karakter').max(100),
  phone: z.string().min(5, 'Nomor telepon minimal 5 karakter').max(20),
  address_line: z.string().min(5, 'Alamat minimal 5 karakter').max(255),
  city: z.string().min(2, 'Kota wajib diisi').max(100),
  province: z.string().min(2, 'Provinsi wajib diisi').max(100),
  postal_code: z.string().min(3, 'Kode pos wajib diisi').max(20),
  is_default: z.boolean().optional(),
})

export function AddressForm({ initialValues, onSubmit, loading, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      recipient_name: initialValues?.recipient_name ?? '',
      phone: initialValues?.phone ?? '',
      address_line: initialValues?.address_line ?? '',
      city: initialValues?.city ?? '',
      province: initialValues?.province ?? '',
      postal_code: initialValues?.postal_code ?? '',
      is_default: initialValues?.is_default ?? false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nama penerima" error={errors.recipient_name?.message} {...register('recipient_name')} />
        <Input label="Nomor telepon" inputMode="tel" placeholder="08xxxxxxxxxx" error={errors.phone?.message} {...register('phone')} />
      </div>
      <Input label="Alamat lengkap" placeholder="Jalan, nomor rumah, RT/RW, kecamatan" error={errors.address_line?.message} {...register('address_line')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Kota/Kabupaten" error={errors.city?.message} {...register('city')} />
        <Input label="Provinsi" error={errors.province?.message} {...register('province')} />
        <Input label="Kode pos" inputMode="numeric" error={errors.postal_code?.message} {...register('postal_code')} />
      </div>
      <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...register('is_default')} />
        Jadikan alamat utama
      </label>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Simpan alamat
        </Button>
      </div>
    </form>
  )
}
