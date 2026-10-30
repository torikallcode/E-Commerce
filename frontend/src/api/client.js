import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

let refreshPromise = null

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/register') || original?.url?.includes('/auth/refresh')

    if (status === 401 && original && !original._retry && !isAuthCall) {
      const { refreshToken, clear } = useAuthStore.getState()
      if (!refreshToken) {
        clear()
        return Promise.reject(error)
      }

      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken }, { timeout: 15000 })
            .finally(() => {
              refreshPromise = null
            })
        }
        const { data } = await refreshPromise
        if (!data?.success || !data?.data?.access_token) {
          throw new Error('Refresh failed')
        }
        useAuthStore.getState().setSession(data.data)
        original.headers.Authorization = `Bearer ${data.data.access_token}`
        return client(original)
      } catch (refreshError) {
        clear()
        if (!window.location.pathname.startsWith('/login')) {
          const redirect = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.assign(`/login?redirect=${redirect}&expired=1`)
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default client
