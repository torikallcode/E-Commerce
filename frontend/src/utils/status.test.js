import { describe, expect, it } from 'vitest'
import { allowedNextStatuses, orderStatusLabel, stepIndex } from './status'

describe('orderStatusLabel', () => {
  it('maps known statuses to Indonesian labels', () => {
    expect(orderStatusLabel('pending_payment')).toBe('Menunggu Pembayaran')
    expect(orderStatusLabel('completed')).toBe('Selesai')
  })

  it('falls back to the raw status', () => {
    expect(orderStatusLabel('unknown')).toBe('unknown')
    expect(orderStatusLabel(null)).toBe('-')
  })
})

describe('stepIndex', () => {
  it('maps statuses to the progress timeline', () => {
    expect(stepIndex('pending_payment')).toBe(-1)
    expect(stepIndex('pending_review')).toBe(0)
    expect(stepIndex('paid')).toBe(1)
    expect(stepIndex('shipped')).toBe(3)
    expect(stepIndex('completed')).toBe(4)
  })
})

describe('allowedNextStatuses', () => {
  it('only allows valid forward transitions', () => {
    expect(allowedNextStatuses('pending_payment')).toContain('paid')
    expect(allowedNextStatuses('paid')).toEqual(['processing', 'refunded'])
    expect(allowedNextStatuses('shipped')).toEqual(['completed'])
  })

  it('returns no transitions for final statuses', () => {
    expect(allowedNextStatuses('completed')).toEqual([])
    expect(allowedNextStatuses('cancelled')).toEqual([])
  })
})
