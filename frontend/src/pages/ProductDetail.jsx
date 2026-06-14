import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Heart, RotateCcw, Shield, ShoppingCart, Star, Truck } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { normalizeProduct, productApi } from '../services/api'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isWishlisted } = useWishlist()

  useEffect(() => {
    let active = true
    setLoading(true)
    productApi.detail(id)
      .then((data) => {
        if (!active) return null
        const nextProduct = normalizeProduct(data.product)
        setProduct(nextProduct)
        setActiveSlide(0)
        return productApi.list({ category: nextProduct.category, limit: 5 }).then((listData) => {
          if (active) setRelated((listData.products || []).map(normalizeProduct).filter((item) => item.id !== nextProduct.id).slice(0, 4))
        })
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="skeleton aspect-square" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-24" />
            <div className="skeleton h-12 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="page-container py-24 text-center">
        <h2 className="mb-3 font-display text-2xl font-bold">Product not found</h2>
        <p className="mb-6 text-sm text-gray-500">{error || 'This product is unavailable.'}</p>
        <Link to="/products" className="btn-primary">Back to Products</Link>
      </div>
    )
  }

  const inCart = isInCart(product.id)
  const wishlisted = isWishlisted(product.id)
  const discount = product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
  const slides = product.gallery?.length ? product.gallery : product.image ? [product.image] : []
  const activeImage = slides[activeSlide]
  const hasSlides = slides.length > 1
  const previousSlide = () => setActiveSlide((current) => (current === 0 ? slides.length - 1 : current - 1))
  const nextSlide = () => setActiveSlide((current) => (current + 1) % slides.length)

  return (
    <div className="page-container animate-fade-in">
      <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-primary-500 dark:text-gray-400">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="mb-16 grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
            {activeImage ? <img src={activeImage} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>}
            {discount > 0 && <span className="badge absolute right-4 top-4 bg-green-500 px-3 py-1 text-sm text-white">{discount}% OFF</span>}
            {hasSlides && (
              <>
                <button
                  type="button"
                  onClick={previousSlide}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white dark:bg-gray-900/90 dark:text-gray-100"
                  aria-label="Previous product image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white dark:bg-gray-900/90 dark:text-gray-100"
                  aria-label="Next product image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {hasSlides && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {slides.map((slide, index) => (
                <button
                  key={`${slide}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-gray-100 dark:bg-gray-800 ${activeSlide === index ? 'border-primary-500' : 'border-transparent'}`}
                  aria-label={`Show product image ${index + 1}`}
                >
                  <img src={slide} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span className="mb-2 text-sm font-bold uppercase tracking-widest text-primary-500 dark:text-primary-400">{product.category || 'Uncategorized'}</span>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">{product.name}</h1>
          <div className="my-4 flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, index) => (
                <Star key={index} className={`h-4 w-4 ${index < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
          </div>
          <p className="mb-6 text-sm leading-7 text-gray-600 dark:text-gray-300">{product.description || 'No description available.'}</p>
          <div className="mb-6 flex items-end gap-3">
            <span className="font-display text-4xl font-bold text-gray-900 dark:text-white">Rs. {product.price.toLocaleString()}</span>
            {discount > 0 && <span className="mb-1 text-lg text-gray-400 line-through">Rs. {product.originalPrice.toLocaleString()}</span>}
          </div>
          <p className={`mb-6 text-sm font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <div className="mb-8 flex gap-3">
            <button onClick={() => addToCart(product)} disabled={product.stock <= 0} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${inCart ? 'bg-green-500 text-white' : 'btn-primary'}`}>
              {inCart ? <><Check className="h-5 w-5" /> Added to Cart</> : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>}
            </button>
            <button onClick={() => toggleWishlist(product)} className={`rounded-2xl border-2 p-3 transition-all active:scale-95 ${wishlisted ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20' : 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 dark:border-gray-600'}`}>
              <Heart className="h-6 w-6" fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
            {[
              { icon: Truck, label: 'Delivery' },
              { icon: Shield, label: 'Secure' },
              { icon: RotateCcw, label: 'Returns' }
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon className="h-5 w-5 text-primary-500" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-6 font-display text-2xl font-bold text-gray-900 dark:text-white">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  )
}
