import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { cartApi, normalizeProduct, productApi } from '../services/api'

const CartContext = createContext()

const toLocalItem = (item) => {
  const product = normalizeProduct(item.product || item)
  return {
    ...product,
    qty: Number(item.quantity || item.qty || 1),
    price: Number(product.price)
  }
}

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET':
      return action.payload
    case 'ADD_ITEM': {
      const exists = state.find((item) => item.id === action.payload.id)
      if (exists) return state.map((item) => item.id === action.payload.id ? { ...item, qty: item.qty + 1 } : item)
      return [...state, { ...action.payload, qty: 1 }]
    }
    case 'REMOVE_ITEM':
      return state.filter((item) => item.id !== action.payload)
    case 'INCREMENT':
      return state.map((item) => item.id === action.payload ? { ...item, qty: item.qty + 1 } : item)
    case 'DECREMENT':
      return state.map((item) => item.id === action.payload ? { ...item, qty: Math.max(1, item.qty - 1) } : item)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const savedRef = useRef(readSavedCart())
  const [cart, dispatch] = useReducer(cartReducer, [])
  const [loading, setLoading] = useState(false)
  const { isAuthenticated, initializing } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    localStorage.setItem('sv_cart', JSON.stringify(cart.map((item) => ({ id: item.id, qty: item.qty }))))
  }, [cart])

  useEffect(() => {
    if (initializing) return
    let active = true
    setLoading(true)
    const request = isAuthenticated
      ? cartApi.get().then((data) => (data.cart?.items || []).map(toLocalItem))
      : productApi.validate(savedRef.current.map((item) => item?.id || item?._id).filter(Boolean)).then((data) => {
          const quantities = new Map(savedRef.current.map((item) => [String(item?.id || item?._id), Number(item.qty) || 1]))
          return (data.products || []).map(normalizeProduct).map((product) => ({ ...product, qty: Math.min(quantities.get(String(product.id)) || 1, Math.max(product.stock, 1)) }))
        })
    request
      .then((data) => {
        if (active) dispatch({ type: 'SET', payload: data })
      })
      .catch((err) => { if (active) { dispatch({ type: 'SET', payload: [] }); showToast?.(err.message, 'error') } })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [isAuthenticated, initializing, showToast])

  const applyServerCart = (data) => {
    dispatch({ type: 'SET', payload: (data.cart?.items || []).map(toLocalItem) })
  }

  const addToCart = async (product) => {
    if (!isAuthenticated) {
      dispatch({ type: 'ADD_ITEM', payload: product })
      return
    }
    try {
      const data = await cartApi.add(product.id, 1)
      applyServerCart(data)
      showToast?.('Added to cart')
    } catch (err) {
      showToast?.(err.message, 'error')
    }
  }

  const removeFromCart = async (id) => {
    if (!isAuthenticated) {
      dispatch({ type: 'REMOVE_ITEM', payload: id })
      return
    }
    try {
      applyServerCart(await cartApi.remove(id))
    } catch (err) {
      showToast?.(err.message, 'error')
    }
  }

  const updateQuantity = async (id, quantity, fallbackAction) => {
    if (!isAuthenticated) {
      dispatch({ type: fallbackAction, payload: id })
      return
    }
    try {
      applyServerCart(await cartApi.update(id, quantity))
    } catch (err) {
      showToast?.(err.message, 'error')
    }
  }

  const increment = (id) => {
    const item = cart.find((cartItem) => cartItem.id === id)
    updateQuantity(id, Number(item?.qty || 0) + 1, 'INCREMENT')
  }

  const decrement = (id) => {
    const item = cart.find((cartItem) => cartItem.id === id)
    updateQuantity(id, Math.max(1, Number(item?.qty || 1) - 1), 'DECREMENT')
  }

  const clearCart = async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR' })
      return
    }
    try {
      applyServerCart(await cartApi.clear())
    } catch (err) {
      showToast?.(err.message, 'error')
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const isInCart = (id) => cart.some((item) => item.id === id)

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, increment, decrement, clearCart, cartCount, cartTotal, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

function readSavedCart() { try { const value = JSON.parse(localStorage.getItem('sv_cart') || '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
