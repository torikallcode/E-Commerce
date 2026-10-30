const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || ''
const isProduction = String(import.meta.env.VITE_MIDTRANS_IS_PRODUCTION) === 'true'
const scriptId = 'midtrans-snap-script'

export const snapConfigured = Boolean(clientKey)

export function loadSnapScript() {
  if (window.snap) return Promise.resolve(window.snap)

  const existing = document.getElementById(scriptId)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(window.snap), { once: true })
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans Snap')), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = scriptId
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    script.onload = () => resolve(window.snap)
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'))
    document.body.appendChild(script)
  })
}

/**
 * Opens the Snap popup. Resolves with a status string. When Snap.js is not
 * configured the caller should fall back to the redirect URL from the backend.
 */
export async function payWithSnap(token, handlers = {}) {
  if (!token) throw new Error('Snap token tidak tersedia')
  if (!snapConfigured) return 'unavailable'

  await loadSnapScript()

  return new Promise((resolve) => {
    window.snap.pay(token, {
      onSuccess: (result) => {
        handlers.onSuccess?.(result)
        resolve('success')
      },
      onPending: (result) => {
        handlers.onPending?.(result)
        resolve('pending')
      },
      onError: (result) => {
        handlers.onError?.(result)
        resolve('error')
      },
      onClose: () => {
        handlers.onClose?.()
        resolve('closed')
      },
    })
  })
}
