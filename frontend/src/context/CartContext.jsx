import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { cartApi, normalizeProduct } from '../services/api'

const CartContext = createContext()

const toLocalItem = (item) => {
  const product = normalizeProduct(item.product || item)
  return {
    ...product,
    qty: Number(item.quantity || item.qty || 1),
    price: Number(item.price || product.price)
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
  const saved = JSON.parse(localStorage.getItem('sv_cart') || '[]')
  const [cart, dispatch] = useReducer(cartReducer, saved)
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    localStorage.setItem('sv_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    setLoading(true)
    cartApi.get()
      .then((data) => {
        if (active) dispatch({ type: 'SET', payload: (data.cart?.items || []).map(toLocalItem) })
      })
      .catch((err) => showToast?.(err.message, 'error'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [isAuthenticated, showToast])

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
