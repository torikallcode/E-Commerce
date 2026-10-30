import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useMe } from '../hooks/useMe'
import { FullPageLoader } from '../components/PageLoader'

export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const location = useLocation()

  if (!accessToken) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const { isLoading } = useMe()

  if (!accessToken) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (!user && isLoading) return <FullPageLoader label="Memeriksa akses…" />
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  return <Outlet />
}

export function GuestRoute() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)

  if (accessToken) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />
  }
  return <Outlet />
}
