import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/format'

export function Pagination({ page = 1, totalPages = 1, onChange, className }) {
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i += 1) pages.push(i)

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink-700 transition hover:bg-slate-50 disabled:opacity-40"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {start > 1 && (
        <>
          <PageButton page={1} active={page === 1} onClick={onChange} />
          {start > 2 && <span className="px-1 text-ink-300">…</span>}
        </>
      )}
      {pages.map((item) => (
        <PageButton key={item} page={item} active={item === page} onClick={onChange} />
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-ink-300">…</span>}
          <PageButton page={totalPages} active={page === totalPages} onClick={onChange} />
        </>
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink-700 transition hover:bg-slate-50 disabled:opacity-40"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

function PageButton({ page, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition',
        active ? 'bg-ink-900 text-white' : 'border border-slate-200 bg-white text-ink-700 hover:bg-slate-50',
      )}
    >
      {page}
    </button>
  )
}
