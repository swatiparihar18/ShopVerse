import { Link } from 'react-router-dom'
import { MailWarning } from 'lucide-react'

export default function ForgotPassword() {
  return (
    <div className="page-container flex min-h-[65vh] items-center justify-center">
      <div className="card w-full max-w-md p-8 text-center">
        <MailWarning className="mx-auto mb-4 h-10 w-10 text-primary-500" />
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Password reset unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
          The backend currently does not expose forgot password or reset password endpoints.
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">Back to login</Link>
      </div>
    </div>
  )
}
