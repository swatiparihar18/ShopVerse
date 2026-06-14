const TOKEN_KEY = 'sv_token'
const USER_KEY = 'sv_user'

export const authStorage = {
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  },
  getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  },
  setSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.removeItem(USER_KEY)
  },
  clear() {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  },
  hasSession() {
    return Boolean(sessionStorage.getItem(TOKEN_KEY))
  }
}
