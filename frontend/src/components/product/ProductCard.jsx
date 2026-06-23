import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Heart, ImageOff, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'

const BADGE_STYLES = {
  'Best Seller': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  New: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Hot: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  Sale: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  Premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  Featured: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300',
  'Out of Stock': 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
}

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isWishlisted } = useWishlist()
  const inCart = isInCart(product.id)
  const wishlisted = isWishlisted(product.id)
  const discount = product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <div className="card group flex flex-col overflow-hidden animate-fade-in">
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Link to={`/product/${product.id}`}>
          {product.image && !imageFailed ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain p-2 transition-transform duration-500"
              onMouseEnter={(event) => { event.currentTarget.style.transform = 'scale(1.08)' }}
              onMouseLeave={(event) => { event.currentTarget.style.transform = 'scale(1)' }}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-gray-400"><ImageOff className="h-6 w-6" />No image available</div>
          )}
        </Link>

        {product.badge && (
          <span className={`badge absolute left-2 top-2 text-[11px] font-bold ${BADGE_STYLES[product.badge] || 'bg-gray-100 text-gray-700'}`}>
            {product.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="badge absolute bottom-2 left-2 bg-green-500 text-[11px] font-bold text-white">
            {discount}% OFF
          </span>
        )}
        <button
          onClick={() => toggleWishlist(product)}
          className={`absolute right-2 top-2 rounded-full p-2 shadow-md transition-all duration-200 ${wishlisted ? 'scale-110 bg-red-500 text-white' : 'bg-white text-gray-400 hover:scale-110 hover:text-red-500 dark:bg-gray-800'}`}
          aria-label="Toggle wishlist"
        >
          <Heart className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-primary-400">{product.category || 'Uncategorized'}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors hover:text-primary-500 dark:text-white">{product.name}</h3>
        </Link>
        <p className={`mb-2 text-xs font-semibold ${product.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
        <div className="mb-3 flex items-center gap-1.5">
          <div className="flex">
            {[...Array(5)].map((_, index) => (
              <Star key={index} className={`h-3.5 w-3.5 ${index < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'}`} />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{product.rating} ({product.reviews.toLocaleString()})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white">Rs. {product.price.toLocaleString()}</p>
            {discount > 0 && <p className="text-xs text-gray-400 line-through">Rs. {product.originalPrice.toLocaleString()}</p>}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${inCart ? 'bg-green-500' : 'bg-primary-500 hover:bg-primary-600'}`}
          >
            {inCart ? <><Check className="h-3.5 w-3.5" /> Added</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}
