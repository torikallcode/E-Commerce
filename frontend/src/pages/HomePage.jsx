import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Headphones, Home, ShieldCheck, Shirt, Sparkles, Truck, RefreshCcw, Armchair } from 'lucide-react'
import { productApi } from '../api/products'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { formatCurrency, productImage } from '../utils/format'

const categoryIcons = {
  elektronik: Headphones,
  fashion: Shirt,
  'rumah-tangga': Armchair,
}

export function HomePage() {
  const productsQuery = useQuery({
    queryKey: ['products', 'home'],
    queryFn: () => productApi.list({ sort: 'newest', per_page: 8 }),
  })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: productApi.categories })

  const products = productsQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const featured = products[0]

  return (
    <div>
      <section className="container-page pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-4xl bg-ink-900 px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-accent-300" />
                Koleksi baru minggu ini
              </span>
              <h1 className="mt-6 max-w-2xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Barang bagus, <span className="text-brand-300">harga jujur.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60">
                Elektronik, fashion, dan kebutuhan rumah pilihan. Checkout cepat, pembayaran aman, pesanan bisa dilacak.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/products"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-ink-900 transition hover:bg-brand-100"
                >
                  Mulai belanja <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products?sort=price_asc"
                  className="inline-flex h-12 items-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Lihat harga terbaik
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/50">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Pembayaran aman</span>
                <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-300" /> Gratis ongkir 500rb+</span>
                <span className="flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-accent-300" /> Status real-time</span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rotate-6 rounded-3xl bg-white/5" />
              <Link
                to={featured ? `/products/${featured.slug}` : '/products'}
                className="relative block overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"
              >
                <img
                  src={featured ? productImage(featured) : '/placeholder.svg'}
                  alt={featured?.name ?? 'Produk pilihan'}
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
                <div className="flex items-end justify-between gap-4 px-1 pt-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Pilihan editor</p>
                    <p className="mt-1 truncate text-sm font-bold">{featured?.name ?? 'Produk pilihan'}</p>
                  </div>
                  <p className="shrink-0 text-sm font-extrabold text-brand-200">{featured ? formatCurrency(featured.price) : ''}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-12 sm:mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Jelajahi</p>
            <h2 className="section-title mt-2">Belanja per kategori</h2>
          </div>
          <Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:underline sm:flex">
            Semua kategori <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {categoriesQuery.isLoading &&
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-28 rounded-3xl" />)}
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Home
            return (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-ink-900">{category.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-500">Lihat koleksi</p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="container-page mt-14 sm:mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Terbaru</p>
            <h2 className="section-title mt-2">Baru masuk</h2>
          </div>
          <Link to="/products?sort=newest" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {productsQuery.isError ? (
          <ErrorState className="mt-6" message={productsQuery.error?.response?.data?.message} onRetry={() => productsQuery.refetch()} />
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {productsQuery.isLoading
              ? Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)
              : products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      <section className="container-page mt-14 sm:mt-20">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Truck, title: 'Pengiriman cepat', text: 'Pesanan diproses di hari yang sama sebelum pukul 15.00.' },
            { icon: ShieldCheck, title: 'Bayar dengan tenang', text: 'QRIS, VA, e-wallet, dan kartu kredit lewat Midtrans.' },
            { icon: RefreshCcw, title: 'Status transparan', text: 'Pantau status pembayaran dan pengiriman secara real-time.' },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-ink-900">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-ink-900">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-14 sm:mt-20">
        <div className="relative overflow-hidden rounded-4xl bg-brand-600 px-6 py-10 text-white sm:px-10">
          <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Kurasi mingguan</p>
              <h2 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
                Temukan produk yang bikin hari-harimu lebih ringan.
              </h2>
            </div>
            <Link
              to="/products?sort=price_asc"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
            >
              Jelajahi koleksi <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
