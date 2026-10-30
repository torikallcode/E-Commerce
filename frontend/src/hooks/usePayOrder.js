import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from '../store/toastStore'
import { payWithSnap } from '../utils/snap'

/**
 * Starts the payment flow for an order. Handles the Snap popup, the hosted
 * redirect fallback, and the development payment simulator.
 */
export function usePayOrder() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return async (order) => {
    if (!order) return 'unavailable'

    const redirectUrl = order.snap_redirect_url || ''
    const isDemo = redirectUrl.includes('/payment/demo')

    if (isDemo) {
      navigate(`/payment/demo?order=${encodeURIComponent(order.order_number)}`)
      return 'redirect'
    }

    if (order.snap_token) {
      try {
        const result = await payWithSnap(order.snap_token)
        if (result === 'success' || result === 'pending') {
          toast.success(
            result === 'success'
              ? 'Pembayaran berhasil diproses'
              : 'Pembayaran sedang menunggu konfirmasi',
          )
          queryClient.invalidateQueries({ queryKey: ['order', order.order_number] })
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          return result
        }
        if (result === 'error') {
          toast.error('Pembayaran gagal atau dibatalkan oleh penyedia pembayaran')
          return result
        }
        if (result === 'closed') return result
        // Snap.js is not configured in this environment; fall back to redirect.
        if (redirectUrl) {
          window.location.assign(redirectUrl)
          return 'redirect'
        }
        toast.error('Konfigurasi pembayaran belum lengkap. Hubungi admin toko.')
        return 'unavailable'
      } catch (error) {
        toast.error(error?.message || 'Gagal membuka jendela pembayaran')
        return 'error'
      }
    }

    if (redirectUrl) {
      window.location.assign(redirectUrl)
      return 'redirect'
    }

    toast.error('Tautan pembayaran belum tersedia. Coba muat ulang pesanan.')
    return 'unavailable'
  }
}
