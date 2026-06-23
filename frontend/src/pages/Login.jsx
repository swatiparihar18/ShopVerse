import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated, isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Email and password are required')
      return
    }

    try {
      setLoading(true)
      const user = await login(form)
      showToast?.('Welcome back')
      const fallback = user.role === 'admin' ? '/admin' : '/dashboard'
      navigate(location.state?.from?.pathname || fallback, { replace: true })
    } catch (err) {
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Login</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Access your Creation Corner account.</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-primary-500 hover:text-primary-600">Forgot password?</Link>
            </div>
            <div className="relative">
              <input className="input pr-11" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={loading}>
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <LogIn className="h-5 w-5" />}
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          New here? <Link to="/signup" className="font-semibold text-primary-500 hover:text-primary-600">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
