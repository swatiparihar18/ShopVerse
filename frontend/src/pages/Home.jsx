import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Shield, Truck, Zap, TrendingUp } from 'lucide-react'
import HeroSlider from '../components/HeroSlider'
import ProductCard from '../components/product/ProductCard'
import { normalizeProduct, productApi } from '../services/api'

const FEATURES = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Reliable dispatch on every order' },
  { icon: Shield, title: 'Secure Checkout', desc: 'Protected account and payments' },
  { icon: RotateCcw, title: 'Easy Returns', desc: 'Simple support for returns' },
  { icon: Zap, title: 'Fresh Catalog', desc: 'Products synced from inventory' }
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    productApi.list({ featured: true, limit: 8 })
      .then((data) => {
        if (!active) return null
        const featured = (data.products || []).map(normalizeProduct)
        if (featured.length > 0) {
          setProducts(featured)
          return null
        }
        return productApi.list({ limit: 8 }).then((fallback) => {
          if (active) setProducts((fallback.products || []).map(normalizeProduct))
        })
      })
      .catch(() => active && setProducts([]))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="animate-fade-in">
      <HeroSlider />

      <section className="border-y border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 rounded-xl bg-white p-4 dark:bg-gray-900">
              <div className="rounded-xl bg-primary-50 p-3 text-primary-500 dark:bg-primary-500/10">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-container">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <TrendingUp className="h-6 w-6 text-primary-500" /> Featured Products
          </h2>
          <Link to="/products" className="text-sm font-semibold text-primary-500 hover:text-primary-600">View all</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton aspect-square" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">No products available yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </div>
  )
}
