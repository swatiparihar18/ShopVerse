import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import ProductCard    from '../components/product/ProductCard'
import ProductSkeleton from '../components/product/ProductSkeleton'
import SearchBar       from '../components/common/SearchBar'
import EmptyState      from '../components/common/EmptyState'
import { useProducts } from '../hooks/useProducts'

const SORT_OPTIONS = [
  { value: 'default',   label: 'Default' },
  { value: 'low-high',  label: 'Price: Low to High' },
  { value: 'high-low',  label: 'Price: High to Low' },
  { value: 'rating',    label: 'Top Rated' },
]

export default function Products() {
  const [params] = useSearchParams()
  const { products, categories, search, setSearch, category, setCategory, sort, setSort, loading, error } = useProducts()

  // Sync from URL params
  useEffect(() => {
    const q = params.get('search'); if (q) setSearch(q)
    const c = params.get('category'); if (c) setCategory(c)
  }, [])

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">All Products</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{loading ? '...' : `${products.length} products found`}</p>
        </div>
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-gray-500 hidden sm:block" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="input h-10 text-sm w-48 cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${category === cat ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-400 hover:text-primary-500'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>
      ) : products.length === 0 ? (
        <EmptyState icon="🔍" title="No products found" description="Try adjusting your search or filter to find what you're looking for." actionLabel="Clear Filters" actionTo="/products" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
