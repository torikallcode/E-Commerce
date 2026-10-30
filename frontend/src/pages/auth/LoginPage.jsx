import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getErrorMessage } from '../../utils/errors'

const schema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setSession = useAuthStore((state) => state.setSession)
  const expired = searchParams.get('expired') === '1'
  const redirect = searchParams.get('redirect')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = async (values) => {
    setServerError('')
    try {
      const response = await authApi.login(values)
      setSession(response.data)
      const role = response.data.user?.role
      const destination = redirect ? decodeURIComponent(redirect) : role === 'admin' ? '/admin' : '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Email atau password salah.'))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Selamat datang kembali</h1>
      <p className="mt-2 text-sm text-ink-500">Masuk untuk melanjutkan belanja dan melihat pesananmu.</p>

      {expired && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sesi Anda telah berakhir. Silakan masuk kembali.
        </div>
      )}
      {serverError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Masukkan password"
              error={errors.password?.message}
              className="pr-11"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-[2.35rem] rounded-lg p-1 text-ink-300 transition hover:text-ink-700"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting} leftIcon={<LogIn className="h-4 w-4" />}>
          Masuk
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Belum punya akun?{' '}
        <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-600 hover:underline">
          Daftar sekarang
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-ink-500">
        <p className="font-semibold text-ink-700">Akun admin awal</p>
        <p className="mt-1">
          Jika Anda menjalankan project ini secara lokal, gunakan email dan password dari variabel{' '}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">ADMIN_EMAIL</code> dan{' '}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">ADMIN_PASSWORD</code> pada backend.
        </p>
      </div>
    </div>
  )
}
