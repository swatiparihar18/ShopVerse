import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Heart, Sun, Moon, Search, Menu, X, Zap, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { useCart }     from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useTheme }    from '../../context/ThemeContext'
import { useAuth }     from '../../context/AuthContext'
import { useToast }    from '../../context/ToastContext'

export default function Navbar() {
  const { cartCount }         = useCart()
  const { wishlist }          = useWishlist()
  const { dark, toggleTheme } = useTheme()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { showToast } = useToast()
  const [open,  setOpen]      = useState(false)
  const [query, setQuery]     = useState('')
  const navigate  = useNavigate()
  const location  = useLocation()
  const inputRef  = useRef()

  // Close mobile menu on route change
  useEffect(() => setOpen(false), [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`)
  }

  const handleLogout = async () => {
    await logout()
    showToast?.('Logged out successfully')
    navigate('/login')
  }

  const navLinks = [
    { to: '/',         label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/cart',     label: 'Cart' },
    { to: '/wishlist', label: 'Wishlist' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
              Shop<span className="text-primary-500">Verse</span>
            </span>
          </Link>

          {/* Search bar – desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="input pl-10 pr-4 h-10 text-sm"
              />
            </div>
          </form>

          {/* Desktop icons */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.slice(0, 2).map(l => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {l.label}
              </Link>
            ))}

            <Link to="/wishlist" className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
              <Heart className={`w-5 h-5 transition-colors ${location.pathname === '/wishlist' ? 'text-red-500 fill-red-500' : 'text-gray-600 dark:text-gray-300 group-hover:text-red-500'}`} />
              {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{wishlist.length}</span>}
            </Link>

            <Link to="/cart" className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
              <ShoppingCart className={`w-5 h-5 transition-colors ${location.pathname === '/cart' ? 'text-primary-500' : 'text-gray-600 dark:text-gray-300 group-hover:text-primary-500'}`} />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
            </Link>

            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 hover:text-primary-500">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link to={isAdmin ? '/admin' : '/dashboard'} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 hover:text-primary-500" title={isAdmin ? 'Admin dashboard' : 'Dashboard'}>
                  {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                </Link>
                {isAdmin && (
                  <>
                    <Link to="/admin/orders" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Orders
                    </Link>
                    <Link to="/admin/products" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Add Products
                    </Link>
                    <Link to="/admin/users" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Customers
                    </Link>
                  </>
                )}
                <Link to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                  <User className="h-4 w-4" />
                  <span className="max-w-24 truncate">{user?.name || 'Profile'}</span>
                </Link>
                <button onClick={handleLogout} className="p-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-500 dark:text-gray-300 dark:hover:bg-red-900/20" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 pl-1">
                <Link to="/login" className="px-3 py-2 text-sm font-semibold text-gray-600 hover:text-primary-500 dark:text-gray-300">Login</Link>
                <Link to="/signup" className="btn-primary px-4 py-2 text-sm">Sign up</Link>
              </div>
            )}
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-1">
            <Link to="/cart" className="relative p-2 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
            </Link>
            <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-600 dark:text-gray-300">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-gray-700 dark:text-gray-300">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="input pl-10 h-10 text-sm" />
            </div>
          </form>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-700 py-3 space-y-1 animate-fade-in">
            {[...navLinks, ...(isAuthenticated ? [{ to: isAdmin ? '/admin' : '/dashboard', label: isAdmin ? 'Admin' : 'Dashboard' }, ...(isAdmin ? [{ to: '/admin/orders', label: 'Orders Admin' }, { to: '/admin/products', label: 'Products Admin' }, { to: '/admin/users', label: 'Customers Admin' }] : []), { to: '/profile', label: 'Profile' }] : [{ to: '/login', label: 'Login' }, { to: '/signup', label: 'Sign up' }])].map(l => (
              <Link key={l.to} to={l.to}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {l.label}
                {l.to === '/cart' && cartCount > 0 && <span className="ml-auto badge bg-primary-100 text-primary-600">{cartCount}</span>}
                {l.to === '/wishlist' && wishlist.length > 0 && <span className="ml-auto badge bg-red-100 text-red-600">{wishlist.length}</span>}
              </Link>
            ))}
            {isAuthenticated && (
              <button onClick={handleLogout} className="flex w-full items-center px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
