import { create } from 'zustand'

let counter = 0

export const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) => {
    const id = ++counter
    set((state) => ({ toasts: [...state.toasts, { id, tone: 'info', ...toast }] }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
    }, 4500)
    return id
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}))

export const toast = {
  success: (message, title = 'Berhasil') => useToastStore.getState().push({ tone: 'success', title, message }),
  error: (message, title = 'Gagal') => useToastStore.getState().push({ tone: 'error', title, message }),
  info: (message, title = 'Info') => useToastStore.getState().push({ tone: 'info', title, message }),
}
