import { forwardRef } from 'react'
import { cn } from '../../utils/format'

export const Input = forwardRef(function Input(
  { label, error, hint, className, containerClassName, id, required, ...props },
  ref,
) {
  const inputId = id || props.name
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          'field-input',
          error && 'border-red-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, containerClassName, id, rows = 4, ...props },
  ref,
) {
  const inputId = id || props.name
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(
          'field-input resize-y',
          error && 'border-red-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, className, containerClassName, id, children, ...props },
  ref,
) {
  const inputId = id || props.name
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          'field-input appearance-none bg-[length:16px] pr-9',
          error && 'border-red-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
        {!children &&
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      {hint && !error && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})
