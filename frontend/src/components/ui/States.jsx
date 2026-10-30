import { PackageOpen, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../utils/format'

export function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Terjadi kesalahan saat memuat data.', onRetry, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50/50 px-6 py-12 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <TriangleAlert className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink-900">Gagal memuat data</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}

export function LoadingState({ title, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-ink-300 animate-spin">
        <span className="sr-only">Memuat...</span>
      </div>
      {title && <p className="mt-3 text-sm text-ink-500">{title}</p>}
    </div>
  )
}
