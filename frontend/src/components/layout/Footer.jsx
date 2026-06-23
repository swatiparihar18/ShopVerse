import { Link } from 'react-router-dom'
import { Zap, Github, Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  const accountRoutes = {
    Login: '/login',
    Register: '/signup',
    'My Orders': '/dashboard',
    Wishlist: '/wishlist'
  }

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">Creation <span className="text-primary-400">Corner</span></span>
            </Link>
            <p className="text-sm leading-relaxed">Universe of deals — millions of products at your fingertips.</p>
            <div className="flex gap-3 mt-4">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-primary-500 hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: 'Shop', links: ['Flowers', 'Fashion', 'Keychains', 'Home accessories', 'Decoration'] },
            { title: 'Account', links: ['Login', 'Register', 'My Orders', 'Wishlist'] },
            { title: 'Help', links: ['FAQ', 'Order Policy', 'Shipping Info', 'Contact Us', 'Privacy Policy'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map(l => (
                  <li key={l}>
                    {accountRoutes[l]
                      ? <Link to={accountRoutes[l]} className="hover:text-primary-400 transition-colors">{l}</Link>
                      : <a href="#" className="hover:text-primary-400 transition-colors">{l}</a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© 2024 Creation Corner. All rights reserved.</p>
          <p>Built with React, Vite & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  )
}
