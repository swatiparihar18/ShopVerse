import { useMemo, useState } from 'react'
import { Save, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authApi } from '../services/api'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || ''
  })

  const avatarPreview = useMemo(() => {
    if (avatar) return URL.createObjectURL(avatar)
    return user?.avatar?.url || ''
  }, [avatar, user])

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    const body = new FormData()
    body.append('name', form.name)
    body.append('phone', form.phone)
    body.append('address[street]', form.street)
    body.append('address[city]', form.city)
    body.append('address[state]', form.state)
    body.append('address[postalCode]', form.postalCode)
    body.append('address[country]', form.country)
    if (avatar) body.append('avatar', avatar)

    try {
      setLoading(true)
      const data = await authApi.updateProfile(body)
      updateUser(data.user)
      showToast?.('Profile updated')
      setAvatar(null)
    } catch (err) {
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account and delivery details.</p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <section className="card p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700">
              {avatarPreview ? <img src={avatarPreview} alt={user?.name} className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12 text-gray-400" />}
            </div>
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="badge mt-3 bg-primary-50 text-primary-600 dark:bg-primary-500/10">{user?.role}</span>
            <label className="btn-outline mt-5 cursor-pointer text-sm">
              Change avatar
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
            </label>
          </div>
        </section>

        <section className="card p-6">
          {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(value) => updateField('name', value)} required />
            <Field label="Phone" value={form.phone} onChange={(value) => updateField('phone', value)} />
            <Field label="Street" value={form.street} onChange={(value) => updateField('street', value)} className="sm:col-span-2" />
            <Field label="City" value={form.city} onChange={(value) => updateField('city', value)} />
            <Field label="State" value={form.state} onChange={(value) => updateField('state', value)} />
            <Field label="Postal code" value={form.postalCode} onChange={(value) => updateField('postalCode', value)} />
            <Field label="Country" value={form.country} onChange={(value) => updateField('country', value)} />
          </div>

          <div className="mt-6 flex justify-end">
            <button className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save className="h-5 w-5" />}
              Save changes
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, className = '', required }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>
      <input className="input" value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
