import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { productApi } from '../api/products'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { Pagination } from '../components/ui/Pagination'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/format'

const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga terendah' },
  { value: 'price_desc', label: 'Harga tertinggi' },
  { value: 'name_asc', label: 'Nama A–Z' },
]

function useParamState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(
    () => ({
      q: searchParams.get('q') ?? '',
      category: searchParams.get('category') ?? '',
      minPrice: searchParams.get('min_price') ?? '',
      maxPrice: searchParams.get('max_price') ?? '',
      sort: searchParams.get('sort') ?? 'newest',
      page: Math.max(1, Number(searchParams.get('page')) || 1),
    }),
    [searchParams],
  )

  const update = (patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key)
      else next.set(key, String(value))
    })
    if (resetPage) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const reset = () => setSearchParams(new URLSearchParams(), { replace: true })

  return { params, update, reset }
}

export function ProductsPage() {
  const { params, update, reset } = useParamState()
  const [searchTerm, setSearchTerm] = useState(params.q)
  const [minPrice, setMinPrice] = useState(params.minPrice)
  const [maxPrice, setMaxPrice] = useState(params.maxPrice)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => setSearchTerm(params.q), [params.q])
  useEffect(() => setMinPrice(params.minPrice), [params.minPrice])
  useEffect(() => setMaxPrice(params.maxPrice), [params.maxPrice])

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: productApi.categories })
  const productsQuery = useQuery({
    queryKey: ['products', params],
    queryFn: () =>
      productApi.list({
        q: params.q || undefined,
        category: params.category || undefined,
        min_price: params.minPrice || undefined,
        max_price: params.maxPrice || undefined,
        sort: params.sort,
        page: params.page,
        per_page: 12,
      }),
    placeholderData: (previous) => previous,
  })

  const categories = categoriesQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const meta = productsQuery.data?.meta
  const activeCategory = categories.find((category) => String(category.id) === params.category)
  const hasFilters = Boolean(params.q || params.category || params.minPrice || params.maxPrice)

  const submitSearch = (event) => {
    event.preventDefault()
    update({ q: searchTerm.trim() })
  }

  const applyPrice = (event) => {
    event.preventDefault()
    update({ min_price: minPrice, max_price: maxPrice })
  }

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300">Pencarian</h3>
        <form onSubmit={submitSearch} className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari produk…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            aria-label="Cari produk"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                update({ q: '' })
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-300 hover:bg-slate-100 hover:text-ink-700"
              aria-label="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300">Kategori</h3>
        <div className="mt-3 space-y-1">
          <button
            type="button"
            onClick={() => update({ category: '' })}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition',
              !params.category ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-slate-100',
            )}
          >
            Semua produk
          </button>
          {categoriesQuery.isLoading &&
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-9 rounded-xl" />)}
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => update({ category: String(category.id) })}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition',
                String(category.id) === params.category
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-600 hover:bg-slate-100',
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300">Rentang harga</h3>
        <form onSubmit={applyPrice} className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="Min"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              aria-label="Harga minimum"
            />
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="Maks"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              aria-label="Harga maksimum"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" fullWidth>
            Terapkan harga
          </Button>
        </form>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearchTerm('')
            setMinPrice('')
            setMaxPrice('')
            reset()
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-ink-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <X className="h-3.5 w-3.5" /> Hapus semua filter
        </button>
      )}
    </div>
  )

  return (
    <div className="container-page py-6 sm:py-10">
      <nav className="flex items-center gap-1.5 text-xs text-ink-500">
        <Link to="/" className="hover:text-brand-600">Beranda</Link>
        <span className="text-ink-300">/</span>
        <span className="font-semibold text-ink-900">Produk</span>
        {activeCategory && (
          <>
            <span className="text-ink-300">/</span>
            <span className="font-semibold text-ink-900">{activeCategory.name}</span>
          </>
        )}
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Katalog</p>
          <h1 className="section-title mt-2">
            {params.q ? `Hasil untuk “${params.q}”` : activeCategory?.name ?? 'Semua produk'}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {meta ? `${meta.total} produk ditemukan` : 'Temukan produk yang kamu butuhkan'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-ink-700 lg:hidden"
          >
            <Filter className="h-4 w-4" /> Filter
          </button>
          <label className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-ink-500 sm:block">Urutkan</span>
            <select
              value={params.sort}
              onChange={(event) => update({ sort: event.target.value })}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-ink-700 focus:border-brand-500 focus:outline-none"
              aria-label="Urutkan produk"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[248px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">{filterPanel}</div>
        </aside>

        {filtersOpen && (
          <div className="mb-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <SlidersHorizontal className="h-4 w-4" /> Filter produk
              </p>
              <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-slate-100" aria-label="Tutup filter">
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterPanel}
          </div>
        )}

        <div>
          {productsQuery.isError ? (
            <ErrorState
              message={productsQuery.error?.response?.data?.message}
              onRetry={() => productsQuery.refetch()}
            />
          ) : productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="Produk tidak ditemukan"
              description="Coba ubah kata kunci atau hapus beberapa filter untuk melihat produk lain."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('')
                    setMinPrice('')
                    setMaxPrice('')
                    reset()
                  }}
                >
                  Reset filter
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Pagination
                  page={meta?.page ?? params.page}
                  totalPages={meta?.total_pages ?? 1}
                  onChange={(page) => {
                    update({ page }, { resetPage: false })
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
                {meta && meta.total > 0 && (
                  <p className="text-xs text-ink-400">
                    Menampilkan {products.length} dari {meta.total} produk
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink-900 px-6 py-6 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Butuh bantuan?</p>
          <p className="mt-1 text-lg font-bold">Tim kami siap membantu memilih produk yang tepat.</p>
        </div>
        <Link
          to="/profile"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-ink-900 transition hover:bg-brand-100"
        >
          Hubungi kami <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
