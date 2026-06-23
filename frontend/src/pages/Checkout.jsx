import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clipboard, ExternalLink, MapPin, MessageCircle, ShoppingBag, UserRound } from 'lucide-react'
import EmptyState from '../components/common/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { orderApi } from '../services/api'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export default function Checkout() {
  const { user } = useAuth()
  const { cart, cartTotal, clearCart } = useCart()
  const { showToast } = useToast()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [createdOrder, setCreatedOrder] = useState(null)
  const [customer, setCustomer] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [shipping, setShipping] = useState({
    street: user?.address?.street || '', city: user?.address?.city || '', state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '', country: user?.address?.country || ''
  })

  const taxPrice = useMemo(() => Math.round(cartTotal * 0.18), [cartTotal])
  const shippingPrice = cartTotal > 499 ? 0 : 49
  const total = cartTotal + taxPrice + shippingPrice

  const placeOrder = async (event) => {
    event.preventDefault()
    setError('')
    if (!customer.name.trim() || !/^\+?[1-9]\d{7,14}$/.test(customer.phone.replace(/[\s()-]/g, ''))) {
      setError('Enter your name and a valid phone number')
      return
    }
    if (Object.values(shipping).some((value) => !String(value).trim())) {
      setError('Complete the delivery address before continuing')
      return
    }

    const whatsappWindow = window.open('', '_blank')
    try {
      setPlacing(true)
      const data = await orderApi.create({
        orderItems: cart.map((item) => ({ product: item.id, quantity: item.qty })),
        customerName: customer.name.trim(), customerPhone: customer.phone.trim(), shippingAddress: shipping,
        paymentMethod: 'Cash on Delivery', taxPrice, shippingPrice
      })
      const fallbackMessage = buildOrderMessage(data.order?.orderId || data.order?._id, customer, shipping, cart, cartTotal, taxPrice, shippingPrice, total)
      const orderMessage = data.orderMessage || fallbackMessage
      const configuredNumber = String(import.meta.env.VITE_WHATSAPP_ORDER_NUMBER || '').replace(/\D/g, '')
      const whatsappUrl = data.whatsappUrl || (configuredNumber ? `https://wa.me/${configuredNumber}?text=${encodeURIComponent(orderMessage)}` : '')
      const opened = Boolean(whatsappWindow && whatsappUrl)
      if (opened) whatsappWindow.location.href = whatsappUrl
      else whatsappWindow?.close()
      setCreatedOrder({ ...data.order, orderId: data.order?.orderId || data.order?._id, whatsappUrl, orderMessage, opened })
      await clearCart()
      showToast?.('Pending order created. Send the WhatsApp message to continue.')
    } catch (err) {
      whatsappWindow?.close()
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setPlacing(false)
    }
  }

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(createdOrder.orderMessage)
      showToast?.('Order details copied')
    } catch {
      setError('Could not copy automatically. Select and copy the order details below.')
    }
  }

  if (createdOrder) {
    return <div className="page-container flex min-h-[65vh] items-center justify-center"><div className="card w-full max-w-xl p-6 text-center sm:p-8">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary-500" />
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Pending order created</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">Order <strong>{createdOrder.orderId}</strong> is pending. Send the prefilled WhatsApp message so the business can confirm it. It has not been marked paid or confirmed.</p>
      {!createdOrder.opened && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{createdOrder.whatsappUrl ? 'WhatsApp may have been blocked by your browser. Use a button below.' : 'The deployed API has not returned a WhatsApp number yet. Copy the order details below, or deploy the updated backend.'}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <textarea readOnly value={createdOrder.orderMessage} className="input mt-5 min-h-44 resize-y text-left" aria-label="Order details" />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {createdOrder.whatsappUrl && <a href={createdOrder.whatsappUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center justify-center gap-2"><ExternalLink className="h-4 w-4" />Open WhatsApp</a>}
        <button type="button" onClick={copyDetails} className="btn-outline inline-flex items-center justify-center gap-2"><Clipboard className="h-4 w-4" />Copy details</button>
      </div>
      <Link to="/dashboard" className="mt-5 inline-block text-sm font-semibold text-primary-500">View orders</Link>
    </div></div>
  }

  if (cart.length === 0) return <div className="page-container"><EmptyState icon="-" title="Your cart is empty" description="Add products before checkout." actionLabel="Browse Products" actionTo="/products" /></div>

  return <div className="page-container animate-fade-in">
    <div className="mb-8"><h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a pending order, then send it through WhatsApp for confirmation.</p></div>
    {error && <div role="alert" className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
    <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr,380px]">
      <div className="space-y-6">
        <section className="card p-6"><h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold"><UserRound className="h-5 w-5 text-primary-500" />Customer details</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" value={customer.name} onChange={(value) => setCustomer({ ...customer, name: value })} /><Field label="Phone number" type="tel" value={customer.phone} onChange={(value) => setCustomer({ ...customer, phone: value })} /></div></section>
        <section className="card p-6"><h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold"><MapPin className="h-5 w-5 text-primary-500" />Delivery address</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Street" value={shipping.street} onChange={(value) => setShipping({ ...shipping, street: value })} className="sm:col-span-2" /><Field label="City" value={shipping.city} onChange={(value) => setShipping({ ...shipping, city: value })} /><Field label="State" value={shipping.state} onChange={(value) => setShipping({ ...shipping, state: value })} /><Field label="Postal code" value={shipping.postalCode} onChange={(value) => setShipping({ ...shipping, postalCode: value })} /><Field label="Country" value={shipping.country} onChange={(value) => setShipping({ ...shipping, country: value })} /></div></section>
        <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Please review products carefully before ordering. Returns are not available.</p>
      </div>
      <aside className="card h-fit p-6 lg:sticky lg:top-24"><h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold"><ShoppingBag className="h-5 w-5 text-primary-500" />Order summary</h2><div className="max-h-80 space-y-4 overflow-y-auto pr-1">{cart.map((item) => <div key={item.id} className="flex gap-3"><div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">{item.image && <img src={item.image} alt={item.name} className="h-full w-full object-contain p-1" />}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-gray-500">Qty {item.qty}</p></div><p className="text-sm font-bold">{money(item.price * item.qty)}</p></div>)}</div>
        <div className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm dark:border-gray-700"><Summary label="Subtotal" value={money(cartTotal)} /><Summary label="GST (18%)" value={money(taxPrice)} /><Summary label="Delivery" value={shippingPrice === 0 ? 'FREE' : money(shippingPrice)} /><div className="flex justify-between border-t border-gray-200 pt-3 font-bold dark:border-gray-700"><span>Total</span><span className="text-xl text-primary-500">{money(total)}</span></div></div>
        <button className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3" disabled={placing}>{placing ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <MessageCircle className="h-5 w-5" />}Order on WhatsApp</button>
      </aside>
    </form>
  </div>
}

function Field({ label, value, onChange, className = '', type = 'text' }) { return <div className={className}><label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label><input className="input" type={type} value={value} required onChange={(event) => onChange(event.target.value)} /></div> }
function Summary({ label, value }) { return <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{label}</span><span className="font-semibold text-gray-900 dark:text-white">{value}</span></div> }

function buildOrderMessage(orderId, customer, shipping, cart, subtotal, tax, delivery, total) {
  const items = cart.map((item, index) => `${index + 1}. ${item.name} x ${item.qty} - ${money(item.price * item.qty)}`)
  return [
    'Hello, I would like to place this order:', '',
    `Order ID: ${orderId}`,
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Delivery address: ${shipping.street}, ${shipping.city}, ${shipping.state}, ${shipping.postalCode}, ${shipping.country}`,
    '', 'Items:', ...items, '',
    `Subtotal: ${money(subtotal)}`,
    `GST: ${money(tax)}`,
    `Delivery: ${delivery === 0 ? 'FREE' : money(delivery)}`,
    `Total: ${money(total)}`, '',
    'Please confirm availability and delivery.'
  ].join('\n')
}
