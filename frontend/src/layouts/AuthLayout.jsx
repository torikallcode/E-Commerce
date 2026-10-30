import { Link, Outlet } from 'react-router-dom'
import { ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink-900">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            toko<span className="text-brand-300">.</span>
          </span>
        </Link>

        <div className="relative my-auto max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" /> Belanja lebih tenang
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-balance">
            Semua yang kamu butuhkan, dalam satu tempat.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            Temukan produk pilihan, bayar dengan QRIS, virtual account, atau e-wallet, lalu lacak pesananmu tanpa ribet.
          </p>

          <div className="mt-10 space-y-4 border-t border-white/10 pt-6 text-sm text-white/70">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
              </span>
              <span>Pembayaran diproses aman oleh Midtrans</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Sparkles className="h-4 w-4 text-accent-300" />
              </span>
              <span>Pengalaman belanja yang cepat dan responsif</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Toko. Semua hak dilindungi.</p>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
              <ShoppingBag className="h-[18px] w-[18px]" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">toko<span className="text-brand-600">.</span></span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-ink-500 hover:text-ink-900">Kembali ke toko</Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
