import { Loader2 } from 'lucide-react'

export function PageLoader({ label = 'Memuat…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-500">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function FullPageLoader({ label = 'Menyiapkan halaman…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <PageLoader label={label} />
    </div>
  )
}
