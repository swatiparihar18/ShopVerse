import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }     from './context/AuthContext'
import { CartProvider }     from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider }    from './context/ToastContext'
import Navbar         from './components/layout/Navbar'
import Footer         from './components/layout/Footer'
import ProtectedRoute from './components/routes/ProtectedRoute'
import Home           from './pages/Home'
import Products       from './pages/Products'
import ProductDetail  from './pages/ProductDetail'
import Cart           from './pages/Cart'
import Checkout       from './pages/Checkout'
import Wishlist       from './pages/Wishlist'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import VerifyOtp      from './pages/VerifyOtp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import Dashboard      from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrders     from './pages/AdminOrders'
import AdminProducts   from './pages/AdminProducts'
import AdminUsers      from './pages/AdminUsers'
import Profile        from './pages/Profile'
import NotFound       from './pages/NotFound'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Layout><Home /></Layout>} />
                  <Route path="/products" element={<Layout><Products /></Layout>} />
                  <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
                  <Route path="/cart" element={<Layout><Cart /></Layout>} />
                  <Route path="/checkout" element={<Layout><ProtectedRoute><Checkout /></ProtectedRoute></Layout>} />
                  <Route path="/wishlist" element={<Layout><Wishlist /></Layout>} />
                  <Route path="/login" element={<Layout><Login /></Layout>} />
                  <Route path="/signup" element={<Layout><Signup /></Layout>} />
                  <Route path="/verify-otp" element={<Layout><VerifyOtp /></Layout>} />
                  <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
                  <Route path="/reset-password/:token?" element={<Layout><ResetPassword /></Layout>} />
                  <Route path="/dashboard" element={<Layout><ProtectedRoute><Dashboard /></ProtectedRoute></Layout>} />
                  <Route path="/admin" element={<Layout><ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute></Layout>} />
                  <Route path="/admin/orders" element={<Layout><ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute></Layout>} />
                  <Route path="/admin/products" element={<Layout><ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute></Layout>} />
                  <Route path="/admin/users" element={<Layout><ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute></Layout>} />
                  <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
                  <Route path="*" element={<Layout><NotFound /></Layout>} />
                </Routes>
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
    </ToastProvider>
  )
}
