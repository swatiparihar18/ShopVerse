import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, PackageCheck, UsersRound, UploadCloud } from 'lucide-react'
import { orderApi, productApi, userApi } from '../services/api'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`

export default function AdminDashboard() {
  const [data, setData] = useState({ users: [], orders: [], products: [], imports: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      userApi.all(),
      orderApi.all(),
      productApi.list({ limit: 100 }),
      productApi.imports()
    ])
      .then(([users, orders, products, imports]) => {
        if (!active) return
        setData({
          users: users.users || [],
          orders: orders.orders || [],
          products: products.products || [],
          imports: imports.imports || []
        })
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const revenue = data.orders.reduce((sum, order) => sum + Number(order.totalPrice || order.totalAmount || 0), 0)

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live store metrics from the backend.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/orders" className="btn-primary inline-flex">Manage Orders</Link>
          <Link to="/admin/products" className="btn-outline inline-flex">Manage Products</Link>
          <Link to="/admin/users" className="btn-outline inline-flex">Manage Customers</Link>
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Users', value: data.users.length, icon: UsersRound },
          { label: 'Products', value: data.products.length, icon: Boxes },
          { label: 'Orders', value: data.orders.length, icon: PackageCheck },
          { label: 'Revenue', value: money(revenue), icon: UploadCloud }
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Latest Orders" empty="No orders yet">
          {data.orders.slice(0, 8).map((order) => (
            <div key={order._id} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0 dark:border-gray-700">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">#{order._id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-gray-500">{order.user?.name || 'Customer'} - {order.orderStatus || order.status}</p>
              </div>
              <p className="font-bold">{money(order.totalPrice || order.totalAmount)}</p>
            </div>
          ))}
        </Panel>

        <Panel title="Low Stock Products" empty="No product inventory to review">
          {data.products.filter((product) => Number(product.stock) <= 5).slice(0, 8).map((product) => (
            <div key={product._id} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0 dark:border-gray-700">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category || 'Uncategorized'}</p>
              </div>
              <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{product.stock} left</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

function Panel({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items

  return (
    <section className="card p-5">
      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="mt-4">
        {isEmpty ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">{empty}</p> : items}
      </div>
    </section>
  )
}
