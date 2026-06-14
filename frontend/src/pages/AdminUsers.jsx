import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, ShieldCheck, Trash2, UserRoundCheck, UserX } from 'lucide-react'
import { userApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const statusClasses = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  blocked: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await userApi.all()
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users
    return users.filter((item) =>
      [item.name, item.email, item.phone, item.role, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [query, users])

  const updateUser = async (targetUser, payload, successMessage) => {
    setUpdatingId(targetUser._id)
    try {
      const data = await userApi.update(targetUser._id, payload)
      setUsers((current) => current.map((item) => (item._id === targetUser._id ? data.user : item)))
      showToast?.(successMessage)
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setUpdatingId('')
    }
  }

  const deleteUser = async (targetUser) => {
    const confirmed = window.confirm(`Delete ${targetUser.name || targetUser.email}?`)
    if (!confirmed) return

    setUpdatingId(targetUser._id)
    try {
      await userApi.delete(targetUser._id)
      setUsers((current) => current.filter((item) => item._id !== targetUser._id))
      showToast?.('User deleted')
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setUpdatingId('')
    }
  }

  const counts = useMemo(() => ({
    total: users.length,
    customers: users.filter((item) => item.role === 'customer').length,
    admins: users.filter((item) => item.role === 'admin').length,
    blocked: users.filter((item) => item.isBlocked || item.status === 'blocked').length
  }), [users])

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage customer access, roles, and account status.</p>
        </div>
        <button type="button" onClick={loadUsers} className="btn-outline inline-flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Total Users" value={counts.total} />
        <Summary label="Customers" value={counts.customers} />
        <Summary label="Admins" value={counts.admins} />
        <Summary label="Blocked" value={counts.blocked} />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Users & Customers</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{loading ? 'Loading...' : `${filteredUsers.length} shown`}</p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-20" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No users match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUsers.map((item) => {
                  const status = item.isBlocked ? 'blocked' : item.status || 'active'
                  const isSelf = currentUser?._id === item._id || currentUser?.id === item._id
                  const busy = updatingId === item._id
                  return (
                    <tr key={item._id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10">
                            {item.role === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}
                          </div>
                          <div className="min-w-52">
                            <p className="font-semibold text-gray-900 dark:text-white">{item.name || 'Unnamed user'}</p>
                            <p className="text-xs text-gray-500">{item.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{item.phone || '-'}</td>
                      <td className="px-5 py-4">
                        <select
                          className="input h-10 min-w-32"
                          value={item.role || 'customer'}
                          disabled={busy}
                          onChange={(event) => updateUser(item, { role: event.target.value }, 'Role updated')}
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${statusClasses[status] || statusClasses.inactive}`}>{status}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy || isSelf}
                            onClick={() => updateUser(item, { isBlocked: !item.isBlocked }, item.isBlocked ? 'User unblocked' : 'User blocked')}
                            className="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-amber-900/20"
                            aria-label={item.isBlocked ? `Unblock ${item.name}` : `Block ${item.name}`}
                            title={isSelf ? 'You cannot block yourself' : item.isBlocked ? 'Unblock user' : 'Block user'}
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy || isSelf}
                            onClick={() => deleteUser(item)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/20"
                            aria-label={`Delete ${item.name}`}
                            title={isSelf ? 'You cannot delete yourself' : 'Delete user'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

function Summary({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}
