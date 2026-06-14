import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[6-9]\d{9}$|^\+?[1-9]\d{7,14}$/
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export default function Signup() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const validate = () => {
    if (!form.name.trim()) return 'Name is required'
    if (!form.phone.trim()) return 'Phone is required'
    if (!phoneRegex.test(form.phone.trim())) return 'Enter a valid phone number'
    if (!form.email.trim()) return 'Email is required'
    if (!emailRegex.test(form.email.trim())) return 'Enter a valid email address'
    if (!form.password) return 'Password is required'
    if (!strongPasswordRegex.test(form.password)) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
    }
    return ''
  }

  const submit = async (event) => {
    event.preventDefault()
    const validationError = validate()
    setError(validationError)
    if (validationError) return

    try {
      setLoading(true)
      const data = await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password
      })
      showToast?.(data.message || 'OTP sent to your email')
      navigate('/verify-otp', { replace: true, state: { email: data.email || form.email.trim() } })
    } catch (err) {
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Create account</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Enter your details, then verify your email with OTP.</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label>
            <div className="relative">
              <input className="input pr-11" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use at least 8 characters with uppercase, lowercase, and a number.</p>
          </div>
          <button className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={loading}>
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <UserPlus className="h-5 w-5" />}
            Send OTP
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already verified? <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">Login</Link>
        </p>
      </div>
    </div>
  )
}
