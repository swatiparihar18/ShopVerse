import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import { useCart }  from '../context/CartContext'
import EmptyState   from '../components/common/EmptyState'

export default function Cart() {
  const { cart, removeFromCart, increment, decrement, clearCart, cartTotal, loading } = useCart()

  const TAX      = Math.round(cartTotal * 0.18)
  const DELIVERY = cartTotal > 499 ? 0 : 49
  const GRAND    = cartTotal + TAX + DELIVERY

  if (loading) return <div className="page-container"><div className="skeleton h-9 w-48" /><div className="mt-8 grid gap-4 lg:grid-cols-3"><div className="skeleton h-40 lg:col-span-2" /><div className="skeleton h-64" /></div></div>

  if (cart.length === 0) return (
    <div className="page-container">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>
      <EmptyState icon="🛒" title="Your cart is empty" description="Looks like you haven't added anything yet. Start shopping!" actionLabel="Browse Products" actionTo="/products" />
    </div>
  )

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1.5 transition-colors">
          <Trash2 className="w-4 h-4" /> Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => {
            const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
            return (
              <div key={item.id} className="card p-4 flex gap-4 animate-fade-in">
                <Link to={`/product/${item.id}`} className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain p-2 hover:scale-105 transition-transform" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-400">No image available</span>}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-0.5">{item.category}</p>
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2 hover:text-primary-500 transition-colors">{item.name}</h3>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">₹{item.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 line-through">₹{item.originalPrice.toLocaleString()}</span>
                    {discount > 0 && <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px]">{discount}% off</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                      <button onClick={() => decrement(item.id)} className="w-7 h-7 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors shadow-sm">
                        <Minus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-200" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{item.qty}</span>
                      <button onClick={() => increment(item.id)} className="w-7 h-7 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-200" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">₹{(item.price * item.qty).toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary-500" /> Order Summary
            </h2>

            {/* Coupon */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Coupon code" className="input pl-9 h-10 text-sm" />
              </div>
              <button className="btn-outline text-sm px-3 py-2 h-10">Apply</button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              {[
                { label: 'Subtotal',   val: `₹${cartTotal.toLocaleString()}` },
                { label: 'GST (18%)', val: `₹${TAX.toLocaleString()}` },
                { label: 'Delivery',  val: DELIVERY === 0 ? 'FREE' : `₹${DELIVERY}`, green: DELIVERY === 0 },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className={`font-semibold ${row.green ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{row.val}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <span className="font-bold text-xl text-primary-500">₹{GRAND.toLocaleString()}</span>
              </div>
            </div>

            {DELIVERY === 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 mb-4 text-center font-semibold">
                🎉 You saved ₹49 on delivery!
              </p>
            )}

            <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/products" className="block text-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 mt-3 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
