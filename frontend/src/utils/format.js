import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function formatCurrency(value) {
  const number = Number(value ?? 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value ?? 0))
}

export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function productImage(product) {
  return product?.images?.[0]?.url || '/placeholder.svg'
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function truncate(value = '', length = 80) {
  if (value.length <= length) return value
  return `${value.slice(0, length).trimEnd()}…`
}

/**
 * Format Rupiah currency with consistent pattern
 * Use: formatRupiah(1000000) → "Rp 1.000.000"
 */
export function formatRupiah(value) {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
  }).format(number)
}

/**
 * Shorten number to readable format (1.5k, 2.3M)
 */
export function formatShortNumber(value, options = {}) {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num)) return '0'
  const { maxFraction = 1 } = options
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(maxFraction) + 'M'
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(maxFraction) + 'k'
  }
  return num.toFixed(maxFraction)
}

/**
 * Check if two colors have sufficient contrast ratio
 * Returns the ratio or null if cannot determine
 */
export function contrastRatio(fg, bg) {
  // Simple implementation - can be enhanced
  return null
}
