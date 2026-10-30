export const orderStatusMap = {
  pending_payment: {
    label: 'Menunggu Pembayaran',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  pending_review: {
    label: 'Sedang Ditinjau',
    tone: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
  },
  paid: {
    label: 'Dibayar',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  processing: {
    label: 'Diproses',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
  shipped: {
    label: 'Dikirim',
    tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
  },
  completed: {
    label: 'Selesai',
    tone: 'bg-teal-50 text-teal-700 ring-teal-200',
    dot: 'bg-teal-500',
  },
  cancelled: {
    label: 'Dibatalkan',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  expired: {
    label: 'Kedaluwarsa',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  failed: {
    label: 'Gagal',
    tone: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
  refunded: {
    label: 'Dikembalikan',
    tone: 'bg-purple-50 text-purple-700 ring-purple-200',
    dot: 'bg-purple-500',
  },
}

export function orderStatusLabel(status) {
  return orderStatusMap[status]?.label ?? status ?? '-'
}

export const orderSteps = [
  { key: 'pending_payment', label: 'Dibuat' },
  { key: 'paid', label: 'Dibayar' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
]

export function stepIndex(status) {
  switch (status) {
    case 'pending_review':
      return 0
    case 'paid':
      return 1
    case 'processing':
      return 2
    case 'shipped':
      return 3
    case 'completed':
      return 4
    default:
      return -1
  }
}

export const adminStatusOptions = [
  { value: 'paid', label: 'Dibayar' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Batalkan' },
  { value: 'refunded', label: 'Refund' },
]

export function allowedNextStatuses(currentStatus) {
  switch (currentStatus) {
    case 'pending_payment':
      return ['paid', 'cancelled', 'expired', 'failed']
    case 'pending_review':
      return ['paid', 'cancelled']
    case 'paid':
      return ['processing', 'refunded']
    case 'processing':
      return ['shipped', 'refunded']
    case 'shipped':
      return ['completed']
    default:
      return []
  }
}
