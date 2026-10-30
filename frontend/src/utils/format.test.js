import { describe, expect, it } from 'vitest'
import { formatCurrency, formatNumber, getInitials, productImage, truncate } from './format'

describe('formatCurrency', () => {
  it('formats numbers as Indonesian rupiah without decimals', () => {
    const value = formatCurrency(1250000)
    expect(value).toContain('Rp')
    expect(value).toContain('1.250.000')
    expect(value).not.toContain(',00')
  })

  it('falls back to zero for invalid input', () => {
    expect(formatCurrency(null)).toContain('0')
    expect(formatCurrency('bukan angka')).toContain('0')
  })
})

describe('formatNumber', () => {
  it('uses thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })
})

describe('getInitials', () => {
  it('takes at most the first two words', () => {
    expect(getInitials('Budi Santoso Pratama')).toBe('BS')
    expect(getInitials('  admin  ')).toBe('A')
    expect(getInitials('')).toBe('')
  })
})

describe('productImage', () => {
  it('prefers the first product image', () => {
    expect(productImage({ images: [{ url: '/uploads/a.jpg' }] })).toBe('/uploads/a.jpg')
  })

  it('uses the placeholder when no image exists', () => {
    expect(productImage({ images: [] })).toBe('/placeholder.svg')
    expect(productImage(null)).toBe('/placeholder.svg')
  })
})

describe('truncate', () => {
  it('keeps short strings untouched', () => {
    expect(truncate('Produk bagus', 20)).toBe('Produk bagus')
  })

  it('adds an ellipsis for long strings', () => {
    const result = truncate('Produk yang namanya sangat panjang sekali', 12)
    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(13)
  })
})
