import { Minus, Plus } from 'lucide-react'
import { cn } from '../../utils/format'

export function QuantityStepper({ value, onChange, min = 1, max = 99, disabled = false, size = 'md' }) {
  const setValue = (next) => {
    const clamped = Math.min(Math.max(Number(next) || min, min), max)
    onChange(clamped)
  }

  const sizes = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
  }

  return (
    <div className={cn('inline-flex items-center rounded-xl border border-slate-200 bg-white', sizes[size])}>
      <button
        type="button"
        onClick={() => setValue(value - 1)}
        disabled={disabled || value <= min}
        className="flex h-full w-9 items-center justify-center rounded-l-xl text-ink-500 transition hover:bg-slate-50 disabled:opacity-40"
        aria-label="Kurangi jumlah"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        className="h-full w-10 border-0 bg-transparent p-0 text-center font-semibold text-ink-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Jumlah"
      />
      <button
        type="button"
        onClick={() => setValue(value + 1)}
        disabled={disabled || value >= max}
        className="flex h-full w-9 items-center justify-center rounded-r-xl text-ink-500 transition hover:bg-slate-50 disabled:opacity-40"
        aria-label="Tambah jumlah"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
