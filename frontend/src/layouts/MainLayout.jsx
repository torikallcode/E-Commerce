import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useCartCount } from '../hooks/useCart'
import { useMe } from '../hooks/useMe'
import { authApi } from '../api/auth'
import { toast } from '../store/toastStore'
import { getErrorMessage } from '../utils/errors'
import { getInitials } from '../utils/format'
import { ScrollToTop } from '../components/ScrollToTop'

const navItems = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/products', label: 'Produk' },
  { to: '/orders', label: 'Pesanan', protected: true },
]

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const cartCount = useCartCount()
  useMe()

  const submitSearch = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products')
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      clear()
      setMobileOpen(false)
      navigate('/')
      toast.success('Anda telah keluar')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <div className="bg-ink-900 px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white/80 sm:text-xs">
        Gratis ongkir untuk pesanan di atas Rp500.000 · Pembayaran aman via Midtrans
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-3 sm:h-[72px] sm:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
              <ShoppingBag className="h-[18px] w-[18px]" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">
              toko<span className="text-brand-600">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems
              .filter((item) => !item.protected || accessToken)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      isActive ? 'bg-slate-100 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>

          <form onSubmit={submitSearch} className="hidden flex-1 md:block">
            <div className="relative mx-auto max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari produk impianmu…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                aria-label="Cari produk"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 transition hover:bg-slate-100"
              aria-label="Keranjang belanja"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <details className="group relative hidden sm:block">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden max-w-[6rem] truncate text-sm font-semibold text-ink-900 lg:block">{user.name}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-ink-300 lg:block" />
                </summary>
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-soft">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-50">
                    <UserRound className="h-4 w-4" /> Profil & alamat
                  </Link>
                  <Link to="/orders" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-50">
                    <Package className="h-4 w-4" /> Pesanan saya
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-50">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Keluar
                  </button>
                </div>
              </details>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100">
                  Masuk
                </Link>
                <Link to="/register" className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
                  Daftar
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 transition hover:bg-slate-100 lg:hidden"
              aria-label="Buka menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <div className="container-page space-y-3 py-4">
              <form onSubmit={submitSearch}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari produk…"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </form>
              <div className="grid gap-1">
                {navItems
                  .filter((item) => !item.protected || accessToken)
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-slate-50"
                    >
                      {item.label}
                    </NavLink>
                  ))}
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-slate-50">
                    Dashboard admin
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold">
                      Profil
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex-1 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold">
                      Masuk
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl bg-ink-900 px-3 py-2.5 text-center text-sm font-semibold text-white">
                      Daftar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
                <ShoppingBag className="h-[18px] w-[18px]" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">toko<span className="text-brand-600">.</span></span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Belanja kebutuhan sehari-hari dengan pengalaman yang tenang, cepat, dan aman.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300">Belanja</h3>
            <div className="mt-4 space-y-2.5 text-sm text-ink-600">
              <Link to="/products" className="block hover:text-brand-600">Semua produk</Link>
              <Link to="/products?sort=newest" className="block hover:text-brand-600">Produk terbaru</Link>
              <Link to="/cart" className="block hover:text-brand-600">Keranjang</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300">Akun</h3>
            <div className="mt-4 space-y-2.5 text-sm text-ink-600">
              <Link to="/orders" className="block hover:text-brand-600">Riwayat pesanan</Link>
              <Link to="/profile" className="block hover:text-brand-600">Profil & alamat</Link>
              <Link to="/login" className="block hover:text-brand-600">Masuk</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300">Bantuan</h3>
            <div className="mt-4 space-y-2.5 text-sm text-ink-600">
              <p>Senin–Sabtu, 09.00–18.00</p>
              <p>hello@toko.example</p>
              <p className="text-xs text-ink-300">Pembayaran diproses aman oleh Midtrans.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 py-5">
          <p className="container-page text-center text-xs text-ink-300">
            © {new Date().getFullYear()} Toko. Dibangun dengan React, Go, dan Midtrans.
          </p>
        </div>
      </footer>
    </div>
  )
}
