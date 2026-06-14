import { createContext, useContext, useState, useEffect } from 'react'

const WishlistContext = createContext()

export function WishlistProvider({ children }) {
  const saved = JSON.parse(localStorage.getItem('sv_wishlist') || '[]')
  const [wishlist, setWishlist] = useState(saved)

  useEffect(() => { localStorage.setItem('sv_wishlist', JSON.stringify(wishlist)) }, [wishlist])

  const toggleWishlist = (product) => {
    setWishlist(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    )
  }

  const isWishlisted  = (id) => wishlist.some(p => p.id === id)
  const clearWishlist = ()   => setWishlist([])

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
