import { cn } from '../../utils/format'
import { orderStatusMap } from '../../utils/status'

export function Badge({ tone = 'bg-slate-100 text-slate-700 ring-slate-200', children, className, dot }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
        tone,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status, className }) {
  const config = orderStatusMap[status] ?? {
    label: status || '-',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  }
  return (
    <Badge tone={config.tone} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  )
}
