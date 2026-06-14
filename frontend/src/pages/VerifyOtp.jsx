import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MailCheck, RotateCcw } from 'lucide-react'
import { authApi } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(60)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || otp.trim().length !== 6) {
      setError('Enter your email and 6-digit OTP')
      return
    }

    try {
      setLoading(true)
      const data = await authApi.verifyOtp({ email: email.trim(), otp: otp.trim() })
      showToast?.(data.message || 'Email verified successfully')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError('')
    if (!email.trim()) {
      setError('Enter your email before resending OTP')
      return
    }

    try {
      setResending(true)
      const data = await authApi.resendOtp({ email: email.trim() })
      showToast?.(data.message || 'OTP resent')
      setCooldown(60)
    } catch (err) {
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <MailCheck className="mb-4 h-10 w-10 text-primary-500" />
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Verify email</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">Enter the 6-digit OTP sent to your email. It expires in 5 minutes.</p>

        {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">OTP</label>
            <input className="input text-center text-xl font-bold tracking-[0.35em]" value={otp} maxLength={6} inputMode="numeric" onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} />
          </div>
          <button className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={loading}>
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <MailCheck className="h-5 w-5" />}
            Verify OTP
          </button>
        </form>

        <button type="button" onClick={resend} disabled={cooldown > 0 || resending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200">
          {resending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" /> : <RotateCcw className="h-4 w-4" />}
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Verified already? <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">Login</Link>
        </p>
      </div>
    </div>
  )
}
