import { useEffect, useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { orderApi } from '../services/api'
import { useToast } from '../context/ToastContext'

const ORDER_STATUSES = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return', 'returned']
const PAYMENT_STATUSES = ['pending', 'paid', 'unpaid', 'failed', 'refunded']

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`
const label = (value) => value.charAt(0).toUpperCase() + value.slice(1)

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await orderApi.all()
      const nextOrders = data.orders || []
      setOrders(nextOrders)
      setDrafts(Object.fromEntries(nextOrders.map((order) => [
        order._id,
        {
          orderStatus: order.orderStatus || order.status || 'pending',
          paymentStatus: order.paymentStatus || 'pending'
        }
      ])))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const updateDraft = (orderId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value
      }
    }))
  }

  const saveStatus = async (order) => {
    const draft = drafts[order._id]
    setSavingId(order._id)
    try {
      const data = await orderApi.updateStatus(order._id, draft)
      setOrders((current) => current.map((item) => item._id === order._id ? data.order : item))
      showToast?.('Order status updated')
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Order Status</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Admins can update order and payment status only.</p>
        </div>
        <button type="button" onClick={loadOrders} className="btn-outline inline-flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <section className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-20" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Order Status</th>
                  <th className="px-5 py-3">Payment Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((order) => {
                  const draft = drafts[order._id] || {}
                  const unchanged =
                    draft.orderStatus === (order.orderStatus || order.status) &&
                    draft.paymentStatus === order.paymentStatus

                  return (
                    <tr key={order._id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">#{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{order.user?.name || 'Customer'}</p>
                        <p className="text-xs text-gray-500">{order.user?.email || '-'}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{(order.orderItems || []).length}</td>
                      <td className="px-5 py-4">
                        <select className="input min-w-36" value={draft.orderStatus || 'pending'} onChange={(event) => updateDraft(order._id, 'orderStatus', event.target.value)}>
                          {ORDER_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <select className="input min-w-32" value={draft.paymentStatus || 'pending'} onChange={(event) => updateDraft(order._id, 'paymentStatus', event.target.value)}>
                          {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right font-bold">{money(order.totalPrice || order.totalAmount)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => saveStatus(order)}
                          disabled={savingId === order._id || unchanged}
                          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                        >
                          {savingId === order._id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save className="h-4 w-4" />}
                          Save
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
