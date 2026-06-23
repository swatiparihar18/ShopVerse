import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { authApi } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!token) return setError('This password reset link is invalid')
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) return setError('Use at least 8 characters with uppercase, lowercase, and a number')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    try {
      setLoading(true)
      const data = await authApi.resetPassword(token, { password: form.password })
      showToast?.(data.message)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container flex min-h-[65vh] items-center justify-center">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <KeyRound className="mb-4 h-10 w-10 text-primary-500" />
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Create new password</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">The reset link is single-use and expires after 15 minutes.</p>
        {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <PasswordField label="New password" value={form.password} show={showPassword} onChange={(value) => setForm({ ...form, password: value })} onToggle={() => setShowPassword((value) => !value)} />
          <PasswordField label="Confirm password" value={form.confirmPassword} show={showPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} onToggle={() => setShowPassword((value) => !value)} />
          <button className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={loading || !token}>
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <KeyRound className="h-5 w-5" />}
            Reset password
          </button>
        </form>
        {!token && <p className="mt-5 text-center text-sm"><Link className="font-semibold text-primary-500" to="/forgot-password">Request a new link</Link></p>}
      </div>
    </div>
  )
}

function PasswordField({ label, value, show, onChange, onToggle }) {
  return <div><label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label><div className="relative"><input className="input pr-11" type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" required /><button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400" aria-label="Toggle password visibility">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
}
