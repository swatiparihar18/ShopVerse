import { useEffect, useMemo, useState } from 'react'
import { normalizeProduct, productApi } from '../services/api'

export function useProducts() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('default')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])

  useEffect(() => {
    let active = true
    const sortMap = {
      'low-high': 'price_asc',
      'high-low': 'price_desc',
      rating: 'rating',
      default: 'newest'
    }

    setLoading(true)
    productApi.list({
      search: search.trim(),
      category: category === 'All' ? '' : category,
      sort: sortMap[sort] || 'newest',
      limit: 100
    })
      .then((data) => {
        if (!active) return
        setProducts((data.products || []).map(normalizeProduct))
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setProducts([])
        setError(err.message)
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [search, category, sort])

  const categories = useMemo(() => {
    const values = products.map((product) => product.category).filter(Boolean)
    return ['All', ...Array.from(new Set(values))]
  }, [products])

  return { products, categories, search, setSearch, category, setCategory, sort, setSort, loading, error }
}

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? initial
    } catch {
      return initial
    }
  })
  const save = (v) => {
    setVal(v)
    localStorage.setItem(key, JSON.stringify(v))
  }
  return [val, save]
}
