import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banknote, CheckCircle2, MapPin, ShoppingBag } from 'lucide-react'
import EmptyState from '../components/common/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { orderApi } from '../services/api'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`

export default function Checkout() {
  const { user } = useAuth()
  const { cart, cartTotal, clearCart } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [createdOrder, setCreatedOrder] = useState(null)
  const [shipping, setShipping] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || ''
  })

  const taxPrice = useMemo(() => Math.round(cartTotal * 0.18), [cartTotal])
  const shippingPrice = cartTotal > 499 ? 0 : 49
  const total = cartTotal + taxPrice + shippingPrice

  const updateField = (field, value) => {
    setShipping((current) => ({ ...current, [field]: value }))
  }

  const placeOrder = async (event) => {
    event.preventDefault()
    setError('')

    const missingField = Object.entries(shipping).find(([, value]) => !String(value).trim())
    if (missingField) {
      setError('Complete the shipping address before placing the order')
      return
    }

    try {
      setPlacing(true)
      const data = await orderApi.create({
        orderItems: cart.map((item) => ({
          product: item.id,
          quantity: item.qty
        })),
        shippingAddress: shipping,
        paymentMethod: 'Cash on Delivery',
        taxPrice,
        shippingPrice
      })
      setCreatedOrder(data.order)
      await clearCart()
      showToast?.('Order placed with Cash on Delivery')
    } catch (err) {
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setPlacing(false)
    }
  }

  if (createdOrder) {
    return (
      <div className="page-container flex min-h-[65vh] items-center justify-center">
        <div className="card max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Order placed</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Your Cash on Delivery order #{createdOrder._id.slice(-6).toUpperCase()} has been confirmed.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/dashboard" className="btn-primary">View orders</Link>
            <Link to="/products" className="btn-outline">Continue shopping</Link>
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="page-container">
        <EmptyState icon="-" title="Your cart is empty" description="Add products before checkout." actionLabel="Browse Products" actionTo="/products" />
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Place your order with Cash on Delivery.</p>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-gray-900 dark:text-white">
              <MapPin className="h-5 w-5 text-primary-500" /> Shipping Address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Street" value={shipping.street} onChange={(value) => updateField('street', value)} className="sm:col-span-2" />
              <Field label="City" value={shipping.city} onChange={(value) => updateField('city', value)} />
              <Field label="State" value={shipping.state} onChange={(value) => updateField('state', value)} />
              <Field label="Postal code" value={shipping.postalCode} onChange={(value) => updateField('postalCode', value)} />
              <Field label="Country" value={shipping.country} onChange={(value) => updateField('country', value)} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-gray-900 dark:text-white">
              <Banknote className="h-5 w-5 text-primary-500" /> Payment Method
            </h2>
            <label className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-500/30 dark:bg-primary-500/10">
              <input type="radio" checked readOnly />
              <span>
                <span className="block font-semibold text-gray-900 dark:text-white">Cash on Delivery</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Pay when your order arrives.</span>
              </span>
            </label>
          </section>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-gray-900 dark:text-white">
            <ShoppingBag className="h-5 w-5 text-primary-500" /> Order Summary
          </h2>
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="mt-1 text-xs text-gray-500">Qty {item.qty}</p>
                </div>
                <p className="text-sm font-bold">{money(item.price * item.qty)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm dark:border-gray-700">
            <SummaryRow label="Subtotal" value={money(cartTotal)} />
            <SummaryRow label="GST (18%)" value={money(taxPrice)} />
            <SummaryRow label="Delivery" value={shippingPrice === 0 ? 'FREE' : money(shippingPrice)} green={shippingPrice === 0} />
            <div className="flex justify-between border-t border-gray-200 pt-3 font-bold dark:border-gray-700">
              <span>Total</span>
              <span className="text-xl text-primary-500">{money(total)}</span>
            </div>
          </div>
          <button className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3" disabled={placing}>
            {placing ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Banknote className="h-5 w-5" />}
            Place COD Order
          </button>
        </aside>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>
      <input className="input" value={value} required onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function SummaryRow({ label, value, green }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${green ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  )
}
