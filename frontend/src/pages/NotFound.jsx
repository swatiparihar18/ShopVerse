import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[65vh] items-center justify-center text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-500">404</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-500 dark:text-gray-400">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Go home</Link>
      </div>
    </div>
  )
}
