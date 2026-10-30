import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'
import { cn } from '../../utils/format'

const tones = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200 bg-white',
    iconClass: 'text-emerald-600',
  },
  error: {
    icon: XCircle,
    wrapper: 'border-red-200 bg-white',
    iconClass: 'text-red-600',
  },
  info: {
    icon: Info,
    wrapper: 'border-slate-200 bg-white',
    iconClass: 'text-brand-600',
  },
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-6 sm:items-end">
      {toasts.map((item) => {
        const config = tones[item.tone] ?? tones.info
        const Icon = config.icon
        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border p-4 shadow-soft',
              config.wrapper,
            )}
            role="status"
            aria-live="polite"
            aria-atomic={true}
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClass)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink-900">{item.title}</p>
              {item.message && <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{item.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded-lg p-1 text-ink-300 transition hover:bg-slate-100 hover:text-ink-700"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
