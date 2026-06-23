import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send } from 'lucide-react'
import { authApi } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address')
      return
    }
    try {
      setLoading(true)
      const data = await authApi.forgotPassword({ email: email.trim() })
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container flex min-h-[65vh] items-center justify-center">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <Mail className="mb-4 h-10 w-10 text-primary-500" />
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">Enter your email and we’ll send a secure reset link that expires in 15 minutes.</p>
        {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
        {message && <div role="status" className="mt-5 rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-200">{message}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} required />
          </div>
          <button className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={loading}>
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send className="h-5 w-5" />}
            Send reset link
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500"><Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">Back to login</Link></p>
      </div>
    </div>
  )
}
