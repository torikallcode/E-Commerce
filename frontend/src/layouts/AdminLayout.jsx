import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Menu, Package, ShoppingBag, ShoppingCart, Tags, Users, X, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { toast } from '../store/toastStore'
import { getErrorMessage } from '../utils/errors'
import { getInitials } from '../utils/format'
import { ScrollToTop } from '../components/ScrollToTop'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produk', icon: Package },
  { to: '/admin/categories', label: 'Kategori', icon: Tags },
  { to: '/admin/orders', label: 'Pesanan', icon: ShoppingCart },
  { to: '/admin/users', label: 'Pengguna', icon: Users },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      clear()
      navigate('/login')
    }
  }

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to="/admin" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-900">
            <ShoppingBag className="h-[18px] w-[18px]" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            toko<span className="text-brand-300">.</span>
          </span>
        </Link>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-white text-ink-900 shadow-sm' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/"
          className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-[18px] w-[18px]" /> Kembali ke toko
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user?.name ?? 'Admin'}</p>
            <p className="truncate text-[11px] text-white/50">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <ScrollToTop />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink-900 lg:block">{Sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" />
          <aside className="relative h-full w-72 bg-ink-900 shadow-soft">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 hover:bg-slate-100 lg:hidden"
            aria-label="Buka menu admin"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-ink-500">Panel administrasi</p>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-500 sm:block">{user?.email}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
              {getInitials(user?.name)}
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
