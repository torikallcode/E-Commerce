import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Minus,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { productApi } from '../api/products'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { useAddToCart } from '../hooks/useCart'
import { formatCurrency, productImage, cn } from '../utils/format'

export function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const addToCart = useAddToCart()

  const productQuery = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.get(slug),
  })

  const product = productQuery.data?.data
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: productApi.categories })

  const relatedQuery = useQuery({
    queryKey: ['products', 'related', product?.category_id],
    queryFn: () => productApi.list({ category: product.category_id, per_page: 5, sort: 'newest' }),
    enabled: Boolean(product?.category_id),
  })

  useEffect(() => {
    setQuantity(1)
    setActiveImage(0)
    setImageFailed(false)
  }, [slug])

  const images = product?.images ?? []
  const gallery = useMemo(() => {
    if (images.length > 0) return images
    return [{ id: 'placeholder', url: '/placeholder.svg' }]
  }, [images])

  const category = categoriesQuery.data?.data?.find((item) => item.id === product?.category_id)
  const outOfStock = (product?.stock ?? 0) <= 0
  const maxQuantity = Math.min(product?.stock ?? 0, 99)
  const related = (relatedQuery.data?.data ?? []).filter((item) => item.id !== product?.id).slice(0, 4)
  const activeImageUrl = imageFailed ? '/placeholder.svg' : gallery[activeImage]?.url ?? '/placeholder.svg'

  const add = (options) => {
    addToCart.addToCart({ product_id: product.id, quantity }, options)
  }

  if (productQuery.isLoading) {
    return (
      <div className="container-page py-8">
        <div className="skeleton h-4 w-56 rounded" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square w-full rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-9 w-4/5 rounded" />
            <div className="skeleton h-6 w-40 rounded" />
            <div className="skeleton h-24 w-full rounded" />
            <div className="skeleton h-12 w-56 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (productQuery.isError || !product) {
    return (
      <div className="container-page py-12">
        <ErrorState
          message={productQuery.error?.response?.data?.message ?? 'Produk tidak ditemukan atau sudah tidak tersedia.'}
          onRetry={() => productQuery.refetch()}
        />
        <div className="mt-5 text-center">
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/products')}>
            Kembali ke katalog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
        <Link to="/" className="hover:text-brand-600">Beranda</Link>
        <ChevronRight className="h-3 w-3 text-ink-300" />
        <Link to="/products" className="hover:text-brand-600">Produk</Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3 text-ink-300" />
            <Link to={`/products?category=${category.id}`} className="hover:text-brand-600">{category.name}</Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 text-ink-300" />
        <span className="line-clamp-1 font-semibold text-ink-900">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3 shadow-card">
            <img
              src={activeImageUrl}
              alt={product.name}
              onError={() => setImageFailed(true)}
              className="aspect-square w-full rounded-2xl bg-slate-100 object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {gallery.map((image, index) => (
                <button
                  key={image.id ?? index}
                  type="button"
                  onClick={() => {
                    setActiveImage(index)
                    setImageFailed(false)
                  }}
                  className={cn(
                    'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition',
                    activeImage === index ? 'border-brand-500' : 'border-transparent hover:border-slate-300',
                  )}
                  aria-label={`Gambar ${index + 1}`}
                >
                  <img src={image.url} alt="" className="h-full w-full rounded-lg object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {category && <Badge tone="bg-brand-50 text-brand-700 ring-brand-100">{category.name}</Badge>}
            {outOfStock ? (
              <Badge tone="bg-red-50 text-red-700 ring-red-100">Stok habis</Badge>
            ) : product.stock <= 5 ? (
              <Badge tone="bg-amber-50 text-amber-700 ring-amber-100">Sisa {product.stock} unit</Badge>
            ) : (
              <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-100" dot="bg-emerald-500">Tersedia</Badge>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{formatCurrency(product.price)}</p>
            <p className="pb-0.5 text-xs text-ink-400">Harga sudah termasuk pajak</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-y border-slate-200 py-4 text-xs">
            <div className="flex items-center gap-2 text-ink-600">
              <Truck className="h-4 w-4 text-brand-600" /> Kirim cepat
            </div>
            <div className="flex items-center gap-2 text-ink-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Bayar aman
            </div>
            <div className="flex items-center gap-2 text-ink-600">
              <RefreshCcw className="h-4 w-4 text-accent-600" /> Status real-time
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-bold text-ink-900">Deskripsi</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-500">
              {product.description || 'Belum ada deskripsi untuk produk ini.'}
            </p>
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-ink-500">Jumlah</p>
                <div className="mt-2">
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={Math.max(maxQuantity, 1)}
                    disabled={outOfStock}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-ink-500">Subtotal</p>
                <p className="mt-1 text-xl font-extrabold text-ink-900">
                  {formatCurrency(product.price * quantity)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                fullWidth
                disabled={outOfStock}
                loading={addToCart.isPending}
                leftIcon={<ShoppingBag className="h-5 w-5" />}
                onClick={() => add()}
              >
                Tambah ke keranjang
              </Button>
              <Button
                size="lg"
                variant="dark"
                fullWidth
                disabled={outOfStock}
                leftIcon={<PackageCheck className="h-5 w-5" />}
                onClick={() => add({ onSuccess: () => navigate('/cart') })}
              >
                Beli sekarang
              </Button>
            </div>

            {outOfStock ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <Minus className="h-3.5 w-3.5" /> Produk sedang tidak tersedia. Cek kembali nanti.
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Stok tersedia: {product.stock} unit · Pesanan diproses setelah pembayaran terkonfirmasi.
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-14 sm:mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Rekomendasi</p>
            <h2 className="section-title mt-2">Produk serupa</h2>
          </div>
          {category && (
            <Link to={`/products?category=${category.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
              Lihat semua
            </Link>
          )}
        </div>

        {relatedQuery.isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : related.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-ink-500">
            Belum ada produk lain di kategori ini.
          </p>
        )}
      </section>
    </div>
  )
}
