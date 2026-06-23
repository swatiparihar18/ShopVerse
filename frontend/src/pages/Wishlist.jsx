import { Heart, Trash2 } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'
import EmptyState  from '../components/common/EmptyState'
import { useWishlist } from '../context/WishlistContext'

export default function Wishlist() {
  const { wishlist, clearWishlist, loading } = useWishlist()

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" /> Wishlist
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved</p>
        </div>
        {wishlist.length > 0 && (
          <button onClick={clearWishlist} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-semibold transition-colors">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {loading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton aspect-square" />)}</div> : wishlist.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="Your wishlist is empty"
          description="Save items you love by clicking the heart icon on any product."
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {wishlist.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
