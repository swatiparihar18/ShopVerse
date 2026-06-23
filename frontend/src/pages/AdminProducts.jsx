import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Download, FileSpreadsheet, ImagePlus, Pencil, Plus, RefreshCw, Star, Trash2, UploadCloud, X } from 'lucide-react'
import { normalizeProduct, productApi } from '../services/api'
import { useToast } from '../context/ToastContext'

const initialForm = {
  name: '',
  description: '',
  heroDescription: '',
  price: '',
  discountPrice: '',
  category: '',
  brand: 'Creation Corner',
  stock: '',
  sku: '',
  imageUrl: '',
  status: 'active',
  isFeatured: false,
  isActive: true
}

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [imports, setImports] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingProduct, setEditingProduct] = useState(null)
  const [imageItems, setImageItems] = useState([])
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [spreadsheet, setSpreadsheet] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const categories = useMemo(() => {
    const values = products.map((product) => product.category).filter(Boolean)
    return Array.from(new Set(values)).sort()
  }, [products])

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const [productData, importData] = await Promise.all([
        productApi.list({ limit: 100, sort: 'newest', active: 'all' }),
        productApi.imports()
      ])
      setProducts((productData.products || []).map(normalizeProduct))
      setImports(importData.imports || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingProduct(null)
    imageItems.filter((item) => item.type === 'new').forEach((item) => URL.revokeObjectURL(item.url))
    setImageItems([])
    setPrimaryIndex(0)
  }

  const startEdit = (product) => {
    setEditingProduct(product)
    const existing = (product.images || []).map((image) => ({ type: 'existing', url: image.url, public_id: image.public_id || '' }))
    if (existing.length === 0 && product.imageUrl) existing.push({ type: 'existing', url: product.imageUrl, public_id: '' })
    setImageItems(existing)
    const selectedPrimary = (product.images || []).findIndex((image) => image.isPrimary)
    setPrimaryIndex(selectedPrimary >= 0 ? selectedPrimary : 0)
    setForm({
      name: product.name || '',
      description: product.description || '',
      heroDescription: product.heroDescription || '',
      price: product.originalPrice || product.price || '',
      discountPrice: product.discountPrice || '',
      category: product.category || '',
      brand: product.brand || 'Creation Corner',
      stock: product.stock ?? '',
      sku: product.sku || '',
      imageUrl: '',
      status: product.status || 'active',
      isFeatured: Boolean(product.isFeatured),
      isActive: product.isActive !== false && product.status === 'active'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const buildProductFormData = () => {
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      body.append(key, key === 'isFeatured' ? String(Boolean(value)) : value)
    })
    const newItems = imageItems.filter((item) => item.type === 'new')
    newItems.forEach(({ file }) => {
      body.append('images', file)
    })
    body.append('imageOrder', JSON.stringify(imageItems.map((item) => item.type === 'new'
      ? { type: 'new', index: newItems.indexOf(item) }
      : { type: 'existing', url: item.url, public_id: item.public_id }
    )))
    body.append('primaryIndex', String(primaryIndex))
    return body
  }

  const addImages = (files) => {
    const selected = Array.from(files || [])
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    if (imageItems.length + selected.length > 8) {
      setError('A product can have at most 8 images')
      return
    }
    const invalid = selected.find((file) => !allowed.has(file.type) || file.size > 5 * 1024 * 1024)
    if (invalid) {
      setError('Images must be JPG, PNG, WebP, or GIF and no larger than 5 MB each')
      return
    }
    setError('')
    setImageItems((current) => [...current, ...selected.map((file) => ({ type: 'new', file, url: URL.createObjectURL(file) }))])
  }

  const removeImage = (index) => {
    const removed = imageItems[index]
    if (removed?.type === 'new') URL.revokeObjectURL(removed.url)
    setImageItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setPrimaryIndex((current) => current === index ? 0 : current > index ? current - 1 : current)
  }

  const moveImage = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= imageItems.length) return
    setImageItems((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setPrimaryIndex((current) => current === index ? target : current === target ? index : current)
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.price || form.stock === '') {
      setError('Product name, price, and stock are required')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, buildProductFormData())
        showToast?.('Product updated')
      } else {
        await productApi.create(buildProductFormData())
        showToast?.('Product created')
      }
      resetForm()
      await loadProducts()
    } catch (err) {
      setError(err.message)
      showToast?.(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`Delete "${product.name}"?`)
    if (!confirmed) return

    try {
      await productApi.delete(product.id)
      showToast?.('Product deleted')
      await loadProducts()
    } catch (err) {
      showToast?.(err.message, 'error')
    }
  }

  const uploadSpreadsheet = async (event) => {
    event.preventDefault()
    if (!spreadsheet) {
      showToast?.('Choose an Excel or CSV file first', 'error')
      return
    }

    const body = new FormData()
    body.append('file', spreadsheet)
    setUploading(true)
    setUploadResult(null)
    try {
      const result = await productApi.upload(body)
      setUploadResult(result)
      showToast?.(`Upload complete: ${result.imported || 0} imported, ${result.updated || 0} updated`)
      setSpreadsheet(null)
      await loadProducts()
    } catch (err) {
      setUploadResult({ success: false, message: err.message })
      showToast?.(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const blob = await productApi.template()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'product-import-template.xlsx'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      showToast?.(err.message, 'error')
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create, edit, delete, and bulk import catalog products.</p>
        </div>
        <button type="button" onClick={loadProducts} className="btn-outline inline-flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,430px),1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              {editingProduct && (
                <button type="button" onClick={resetForm} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200" aria-label="Cancel edit">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <form onSubmit={submitProduct} className="space-y-4">
              <Field label="Product name" value={form.name} onChange={(value) => updateField('name', value)} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price" type="number" min="0" value={form.price} onChange={(value) => updateField('price', value)} required />
                <Field label="Discount" type="number" min="0" value={form.discountPrice} onChange={(value) => updateField('discountPrice', value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock" type="number" min="0" value={form.stock} onChange={(value) => updateField('stock', value)} required />
                <Field label="SKU" value={form.sku} onChange={(value) => updateField('sku', value.toUpperCase())} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Category</label>
                  <input className="input" list="admin-product-categories" value={form.category} onChange={(event) => updateField('category', event.target.value)} />
                  <datalist id="admin-product-categories">
                    {categories.map((category) => <option key={category} value={category} />)}
                  </datalist>
                </div>
                <Field label="Brand" value={form.brand} onChange={(value) => updateField('brand', value)} />
              </div>
              <Field label="Image URL" value={form.imageUrl} onChange={(value) => updateField('imageUrl', value)} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Product images ({imageItems.length}/8)</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-600 dark:border-gray-600 dark:text-gray-300">
                  <ImagePlus className="h-4 w-4" /> Add images
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => { addImages(event.target.files); event.target.value = '' }} />
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, PNG, WebP or GIF; 5 MB each. Choose a primary image and reorder with arrows.</p>
                {imageItems.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imageItems.map((item, index) => <div key={`${item.url}-${index}`} className={`relative overflow-hidden rounded-xl border-2 bg-gray-100 ${primaryIndex === index ? 'border-primary-500' : 'border-gray-200 dark:border-gray-600'}`}>
                    <img src={item.url} alt={`Product preview ${index + 1}`} className="aspect-square w-full object-contain p-1" />
                    <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1 rounded-lg bg-gray-950/70 p-1">
                      <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="rounded p-1 text-white disabled:opacity-30" aria-label="Move image left"><ArrowLeft className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setPrimaryIndex(index)} className={`rounded p-1 ${primaryIndex === index ? 'text-primary-300' : 'text-white'}`} aria-label="Set primary image"><Star className="h-3.5 w-3.5" fill={primaryIndex === index ? 'currentColor' : 'none'} /></button>
                      <button type="button" onClick={() => moveImage(index, 1)} disabled={index === imageItems.length - 1} className="rounded p-1 text-white disabled:opacity-30" aria-label="Move image right"><ArrowRight className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => removeImage(index)} className="rounded p-1 text-red-300" aria-label="Remove image"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    {primaryIndex === index && <span className="absolute left-1 top-1 rounded bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Primary</span>}
                  </div>)}
                </div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Status</label>
                  <select className="input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value, isActive: event.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="mt-7 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={form.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} />Featured</label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked, status: event.target.checked ? 'active' : 'inactive' }))} />Active</label>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Hero description</label>
                <textarea className="input min-h-20 resize-y" maxLength={240} value={form.heroDescription} onChange={(event) => updateField('heroDescription', event.target.value)} placeholder="Optional short copy for the hero banner" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">Description</label>
                <textarea className="input min-h-28 resize-y" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
              </div>
              <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={saving}>
                {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : editingProduct ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingProduct ? 'Update product' : 'Create product'}
              </button>
            </form>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Bulk Upload</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload .xlsx, .xls, or .csv using the backend template columns.</p>
              </div>
              <button type="button" onClick={downloadTemplate} className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:border-primary-400 hover:text-primary-500 dark:border-gray-700 dark:text-gray-300" aria-label="Download template">
                <Download className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={uploadSpreadsheet} className="space-y-3">
              <input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setSpreadsheet(event.target.files?.[0] || null)} />
              <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={uploading}>
                {uploading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <UploadCloud className="h-4 w-4" />}
                Upload spreadsheet
              </button>
            </form>
            {uploadResult && (
              <div className={`mt-4 rounded-xl p-3 text-sm ${uploadResult.success === false ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
                {uploadResult.message || `${uploadResult.imported || 0} imported, ${uploadResult.updated || 0} updated, ${uploadResult.failed || 0} failed`}
                {uploadResult.errors?.length > 0 && <p className="mt-1 text-xs">{uploadResult.errors.length} rows need correction.</p>}
              </div>
            )}
          </section>
        </div>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-gray-100 p-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Products</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{loading ? 'Loading...' : `${products.length} products`}</p>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-20" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No products found. Create a product or upload a spreadsheet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                            {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-contain p-1" /> : <FileSpreadsheet className="m-3 h-6 w-6 text-gray-400" />}
                          </div>
                          <div className="min-w-48">
                            <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{product.sku || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${Number(product.stock) <= 5 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>{product.stock}</span>
                      </td>
                      <td className="px-5 py-4"><span className="badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{product.status || 'active'}</span></td>
                      <td className="px-5 py-4 text-right font-bold">{money(product.originalPrice || product.price)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(product)} className="rounded-lg p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10" aria-label={`Edit ${product.name}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => deleteProduct(product)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" aria-label={`Delete ${product.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {imports.length > 0 && (
        <section className="card mt-6 p-5">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Recent Imports</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {imports.slice(0, 6).map((item) => (
              <div key={item._id} className="rounded-xl border border-gray-100 p-4 text-sm dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">{item.fileName}</p>
                <p className="mt-1 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-gray-500">Rows: {item.totalRows} | Imported: {item.imported} | Updated: {item.updated} | Failed: {item.failed}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', min, required }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>
      <input className="input" type={type} min={min} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
