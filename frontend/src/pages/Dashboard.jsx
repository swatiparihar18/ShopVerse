import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Send, ShoppingCart, Star, UserRound, WalletCards } from 'lucide-react'
import EmptyState from '../components/common/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cartApi, orderApi } from '../services/api'
import { productApi } from '../services/api'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`

export default function Dashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    let active = true
    Promise.all([orderApi.mine(), cartApi.get()])
      .then(([ordersData, cartData]) => {
        if (!active) return
        setOrders(ordersData.orders || [])
        setCartItems(cartData.cart?.items || [])
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalPrice || order.totalAmount || 0), 0)

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.name}.</p>
        </div>
        <Link to="/profile" className="btn-outline inline-flex items-center justify-center gap-2">
          <UserRound className="h-4 w-4" /> Profile
        </Link>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Orders', value: orders.length, icon: Package },
          { label: 'Cart Items', value: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0), icon: ShoppingCart },
          { label: 'Total Spent', value: money(totalSpent), icon: WalletCards }
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : value}</p>
              </div>
              <div className="rounded-xl bg-primary-50 p-3 text-primary-500 dark:bg-primary-500/10">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-gray-100 p-5 dark:border-gray-700">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => <div key={item} className="skeleton h-16" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon="-" title="No orders yet" description="Your order history will appear here after checkout." actionLabel="Browse Products" actionTo="/products" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.slice(0, 8).map((order) => (
                  <tr key={order._id}>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="px-5 py-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><span className="badge bg-primary-50 text-primary-600 dark:bg-primary-500/10">{order.orderStatus || order.status}</span></td>
                    <td className="px-5 py-4 text-right font-bold">{money(order.totalPrice || order.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DeliveredReviews orders={orders} reviewing={reviewing} setReviewing={setReviewing} showToast={showToast} />
    </div>
  )
}

function DeliveredReviews({ orders, reviewing, setReviewing, showToast }) {
  const reviewItems = orders.flatMap((order) => {
    const status = order.orderStatus || order.status
    return (order.orderItems || order.products || []).map((item) => ({
      ...item,
      orderId: order._id,
      orderStatus: status,
      canReview: status === 'delivered'
    }))
  })

  if (orders.length === 0) return null

  return (
    <section className="card mt-8 p-5">
      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Review, Rate, and Share Feedback</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Rating and feedback unlock when an order is marked delivered by admin.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {reviewItems.map((item) => (
          <ReviewForm key={`${item.orderId}-${item.product}`} item={item} reviewing={reviewing} setReviewing={setReviewing} showToast={showToast} />
        ))}
      </div>
    </section>
  )
}

function ReviewForm({ item, reviewing, setReviewing, showToast }) {
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const productId = typeof item.product === 'object' ? item.product._id : item.product
  const key = `${item.orderId}-${productId}`

  const submitReview = async (event) => {
    event.preventDefault()
    if (!item.canReview) {
      showToast?.('You can review this product after delivery', 'error')
      return
    }
    try {
      setReviewing(key)
      await productApi.review(productId, { rating, feedback })
      showToast?.('Review and feedback submitted')
      setFeedback('')
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setReviewing('')
    }
  }

  return (
    <form onSubmit={submitReview} className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
      <div className="mb-3 flex gap-3">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
          {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-gray-500">Order #{item.orderId.slice(-6).toUpperCase()} - {item.orderStatus}</p>
        </div>
      </div>
      {!item.canReview && (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          Feedback will be available after delivery.
        </div>
      )}
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" disabled={!item.canReview} onClick={() => setRating(value)} className="rounded p-1 text-amber-400 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`${value} stars`}>
            <Star className={`h-5 w-5 ${value <= rating ? 'fill-amber-400' : 'fill-transparent'}`} />
          </button>
        ))}
      </div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Feedback</label>
      <textarea
        className="input min-h-20 resize-y"
        value={feedback}
        disabled={!item.canReview}
        onChange={(event) => setFeedback(event.target.value)}
        placeholder={item.canReview ? 'Write your review and feedback after delivery' : 'Available after delivery'}
      />
      <button className="btn-primary mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm" disabled={reviewing === key || !item.canReview}>
        {reviewing === key ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send className="h-4 w-4" />}
        Submit review
      </button>
    </form>
  )
}
