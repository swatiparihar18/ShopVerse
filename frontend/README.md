# ⚡ ShopVerse – Modern React eCommerce

A fully responsive, production-ready eCommerce frontend built with **React + Vite + Tailwind CSS**.

## 🌟 Features

| Feature | Detail |
|---|---|
| 🏠 Home Page | Hero, features bar, categories, featured products, newsletter |
| 🛍️ Products Page | Filter by category, search, sort by price/rating |
| 📄 Product Detail | Full detail, related products, add to cart/wishlist |
| 🛒 Cart Page | Qty increment/decrement, remove, coupon input, order summary |
| ❤️ Wishlist Page | Save/remove products, move to cart |
| 🌙 Dark/Light Mode | localStorage persisted, system preference detected |
| ⚡ Loading Skeletons | Beautiful loading states |
| 📱 Responsive | Mobile, tablet, desktop |

## ⚛️ React Concepts Used

- `useState` — local component state
- `useEffect` — side effects, URL sync, theme
- `useContext` — Cart, Wishlist, Theme global state
- `useReducer` — Cart actions (add/remove/increment/decrement)
- `useParams`, `useSearchParams` — React Router hooks
- `useMemo` — Memoized filtered products
- Custom Hooks — `useProducts`, `useDebounce`, `useLocalStorage`
- Context API — `CartContext`, `WishlistContext`, `ThemeContext`
- Conditional Rendering — empty states, badges, dark mode
- Dynamic Rendering — `.map()` for products, categories, nav

## 📁 Folder Structure

```
src/
├── components/
│   ├── common/
│   │   ├── SearchBar.jsx       ← Reusable search input
│   │   └── EmptyState.jsx      ← Reusable empty states
│   ├── layout/
│   │   ├── Navbar.jsx          ← Sticky nav with search
│   │   └── Footer.jsx          ← Site footer
│   └── product/
│       ├── ProductCard.jsx     ← Reusable product card
│       └── ProductSkeleton.jsx ← Loading skeleton
├── context/
│   ├── CartContext.jsx         ← Cart global state
│   ├── WishlistContext.jsx     ← Wishlist global state
│   └── ThemeContext.jsx        ← Dark/light mode
├── data/
│   └── products.js             ← Products & categories data
├── hooks/
│   └── useProducts.js          ← Custom hooks
├── pages/
│   ├── Home.jsx
│   ├── Products.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   └── Wishlist.jsx
├── App.jsx                     ← Routes
├── main.jsx                    ← Entry point
└── index.css                   ← Tailwind + custom styles
```

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build
```

Open http://localhost:5173

## 🔗 Connecting to Backend

Replace mock data in `src/data/products.js` with API calls:

```js
// In useProducts.js custom hook:
useEffect(() => {
  setLoading(true)
  fetch('YOUR_API/products')
    .then(r => r.json())
    .then(data => { setProducts(data); setLoading(false) })
}, [])
```

For auth (Login/Register), add in `CartContext.jsx`:
```js
const token = localStorage.getItem('token')
const headers = { Authorization: `Bearer ${token}` }
```

## 🎨 Tech Stack

- **React 18** + **Vite 5**
- **React Router v6**
- **Tailwind CSS v3** (dark mode, custom animations)
- **Lucide React** icons
- **Context API** + `useReducer`
- **localStorage** persistence
