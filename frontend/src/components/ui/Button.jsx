import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/format'

const variants = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border border-slate-200 bg-white text-ink-900 hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-ink-700 hover:bg-slate-100 hover:text-ink-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dark: 'bg-ink-900 text-white hover:bg-ink-700',
  accent: 'bg-accent-500 text-white hover:bg-accent-600',
  link: 'text-brand-600 underline-offset-4 hover:underline',
}

const sizes = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-[3.25rem] px-6 text-base',
  icon: 'h-10 w-10',
}

export function buttonStyles({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50',
    // Focus ring for accessibility
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`,
    variants[variant],
    sizes[size],
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonStyles({ variant, size, className: cn(fullWidth && 'w-full', className) })}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
