import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { normalizeProduct, productApi } from '../services/api'

const WishlistContext = createContext()

export function WishlistProvider({ children }) {
  const savedRef = useRef(readSaved('sv_wishlist'))
  const [wishlist, setWishlist] = useState([])
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    const saved = savedRef.current
    const ids = saved.map((item) => item?.id || item?._id).filter(Boolean)
    if (ids.length === 0) { setValidated(true); return }
    productApi.validate(ids)
      .then((data) => setWishlist((data.products || []).map(normalizeProduct)))
      .catch(() => setWishlist([]))
      .finally(() => setValidated(true))
  }, [])

  useEffect(() => { if (validated) localStorage.setItem('sv_wishlist', JSON.stringify(wishlist.map((item) => ({ id: item.id })))) }, [wishlist, validated])

  const toggleWishlist = (product) => setWishlist((current) => current.some((item) => item.id === product.id) ? current.filter((item) => item.id !== product.id) : [...current, product])
  const isWishlisted = (id) => wishlist.some((item) => item.id === id)
  const clearWishlist = () => setWishlist([])

  return <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, clearWishlist, loading: !validated }}>{children}</WishlistContext.Provider>
}

function readSaved(key) { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
export const useWishlist = () => useContext(WishlistContext)
