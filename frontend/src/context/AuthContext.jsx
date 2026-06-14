import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'
import { useToast } from './ToastContext'
import { authStorage } from '../utils/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser())
  const [token, setToken] = useState(() => authStorage.getToken())
  const [initializing, setInitializing] = useState(authStorage.hasSession())
  const { showToast } = useToast()

  const persistSession = useCallback((nextToken, nextUser) => {
    authStorage.setSession(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const clearSession = useCallback(() => {
    authStorage.clear()
    setToken('')
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setInitializing(false)
      return
    }

    let active = true
    authApi.profile()
      .then((data) => {
        if (!active) return
        authStorage.setUser(data.user)
        setUser(data.user)
      })
      .catch((err) => {
        if (!active) return
        if (err.status === 401 || err.status === 403) {
          clearSession()
        }
      })
      .finally(() => {
        if (active) setInitializing(false)
      })

    return () => {
      active = false
    }
  }, [token, clearSession])

  useEffect(() => {
    const handleExpired = () => {
      clearSession()
      showToast?.('Your session expired. Please log in again.', 'error')
    }
    window.addEventListener('shopverse:auth-expired', handleExpired)
    return () => window.removeEventListener('shopverse:auth-expired', handleExpired)
  }, [clearSession, showToast])

  const login = async (payload) => {
    const data = await authApi.login(payload)
    persistSession(data.token, data.user)
    return data.user
  }

  const register = async (payload) => {
    const data = await authApi.register(payload)
    return data
  }

  const logout = async () => {
    try {
      if (token) await authApi.logout()
    } finally {
      clearSession()
    }
  }

  const updateUser = (nextUser) => {
    authStorage.setUser(nextUser)
    setUser(nextUser)
  }

  const value = useMemo(() => ({
    user,
    token,
    initializing,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser
  }), [user, token, initializing])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
