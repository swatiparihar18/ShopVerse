import { createContext, useCallback, useContext, useState } from 'react'
import { X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
   const id = typeof crypto.randomUUID === 'function' 
  ? crypto.randomUUID() 
  : Math.random().toString(36).substring(2) + Date.now().toString(36)
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur bg-white/95 dark:bg-gray-900/95 ${
              toast.type === 'error'
                ? 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-300'
                : 'border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
