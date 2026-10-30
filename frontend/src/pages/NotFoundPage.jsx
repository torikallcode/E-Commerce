import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Search } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg text-center">
        <p className="text-[88px] font-extrabold leading-none tracking-tighter text-slate-200 sm:text-[120px]">404</p>
        <div className="-mt-4 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white">
            <Compass className="h-7 w-7" />
          </span>
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Tautan yang kamu buka mungkin sudah dipindahkan atau tidak pernah ada. Yuk kembali menjelajah katalog.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Ke beranda
          </Link>
          <Link
            to="/products"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-ink-900 transition hover:bg-slate-50"
          >
            <Search className="h-4 w-4" /> Cari produk
          </Link>
        </div>
        <p className="mt-8 text-xs text-ink-300">
          Jika kamu yakin ini kesalahan, hubungi dukungan dengan menyertakan alamat halaman.
        </p>
      </div>
    </div>
  )
}
