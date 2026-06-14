export const API_URL = '/api'
import { authStorage } from '../utils/authStorage'

const getToken = () => authStorage.getToken()

const buildUrl = (path, params) => {
  const url = new URL(`${API_URL}${path}`, window.location.origin)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

export const normalizeProduct = (product) => {
  if (!product) return null
  const gallery = [
    ...(product.images || []).map((item) => item.url).filter(Boolean),
    product.imageUrl
  ].filter(Boolean)
  const image = gallery[0] || ''
  const price = Number(product.discountPrice > 0 ? product.discountPrice : product.price) || 0
  const originalPrice = Number(product.price) || price

  return {
    ...product,
    id: product._id || product.id,
    image,
    gallery,
    price,
    originalPrice,
    rating: Number(product.rating) || 0,
    reviews: Number(product.numReviews || product.reviews?.length || product.reviews) || 0,
    badge: product.isFeatured ? 'Featured' : product.stock > 0 ? '' : 'Out of Stock'
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  const response = await fetch(buildUrl(path, options.params), {
    credentials: 'include',
    ...options,
    headers
  })

  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Something went wrong'
    const error = new Error(message)
    error.status = response.status
    if (response.status === 401 && options.emitAuthExpired !== false) {
      window.dispatchEvent(new CustomEvent('shopverse:auth-expired'))
    }
    throw error
  }

  return data
}

export async function apiBlobRequest(path, options = {}) {
  const token = getToken()
  const response = await fetch(buildUrl(path, options.params), {
    credentials: 'include',
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })

  if (!response.ok) {
    let message = 'Unable to download file'
    try {
      const data = await response.json()
      message = data?.message || message
    } catch {
      // Keep the generic download error when the response is not JSON.
    }
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('shopverse:auth-expired'))
    }
    throw new Error(message)
  }

  return response.blob()
}

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOtp: (payload) => apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (payload) => apiRequest('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  profile: () => apiRequest('/auth/profile', { emitAuthExpired: false }),
  updateProfile: (formData) => apiRequest('/auth/profile', { method: 'PUT', body: formData })
}

export const productApi = {
  list: (params) => apiRequest('/products', { params }),
  detail: (id) => apiRequest(`/products/${id}`),
  create: (formData) => apiRequest('/products', { method: 'POST', body: formData }),
  update: (id, formData) => apiRequest(`/products/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  review: (id, payload) => apiRequest(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),
  upload: (formData) => apiRequest('/products/upload', { method: 'POST', body: formData }),
  imports: () => apiRequest('/products/imports'),
  template: () => apiBlobRequest('/products/template')
}

export const cartApi = {
  get: () => apiRequest('/cart'),
  add: (productId, quantity = 1) => apiRequest('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  }),
  update: (productId, quantity) => apiRequest(`/cart/update/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity })
  }),
  remove: (productId) => apiRequest(`/cart/remove/${productId}`, { method: 'DELETE' }),
  clear: () => apiRequest('/cart/clear', { method: 'DELETE' })
}

export const orderApi = {
  create: (payload) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  mine: () => apiRequest('/orders/my-orders'),
  all: () => apiRequest('/orders/admin/all'),
  updateStatus: (id, payload) => apiRequest(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(payload) })
}

export const userApi = {
  all: () => apiRequest('/users'),
  update: (id, payload) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' })
}
