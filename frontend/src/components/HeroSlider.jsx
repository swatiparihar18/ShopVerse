import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import './HeroSlider.css'

export default function HeroSlider({ products = [], loading = false }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => setActiveIndex(0), [products])
  useEffect(() => {
    if (isPaused || products.length <= 1) return undefined
    const interval = window.setInterval(() => setActiveIndex((current) => (current + 1) % products.length), 5000)
    return () => window.clearInterval(interval)
  }, [isPaused, products.length])

  if (loading) return <section className="hero-slider hero-slider--loading" aria-label="Loading featured products"><div className="skeleton h-[360px] w-full rounded-none" /></section>
  if (products.length === 0) return null

  const multiple = products.length > 1
  const previous = () => setActiveIndex((current) => current === 0 ? products.length - 1 : current - 1)
  const next = () => setActiveIndex((current) => (current + 1) % products.length)

  return <section className="hero-slider" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} aria-label="Featured products">
    <div className="hero-slider__viewport">
      <div className="hero-slider__track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {products.map((product) => <article className="hero-slider__slide" key={product.id}>
          <div className="hero-slider__content">
            <span className="hero-slider__eyebrow">{product.category || 'Featured product'}</span>
            <h1>{product.name}</h1>
            <p>{product.heroDescription || product.description || 'View product details, availability, and pricing.'}</p>
            <div className="hero-slider__current-price">Rs. {product.price.toLocaleString('en-IN')}</div>
            <Link to={`/product/${product.id}`} className="hero-slider__cta">View product</Link>
          </div>
          <HeroImage product={product} />
        </article>)}
      </div>
      {multiple && <>
        <button type="button" className="hero-slider__arrow hero-slider__arrow--left" onClick={previous} aria-label="Previous featured product"><ChevronLeft /></button>
        <button type="button" className="hero-slider__arrow hero-slider__arrow--right" onClick={next} aria-label="Next featured product"><ChevronRight /></button>
        <div className="hero-slider__dots" role="tablist" aria-label="Featured products">{products.map((product, index) => <button type="button" key={product.id} className={`hero-slider__dot ${activeIndex === index ? 'hero-slider__dot--active' : ''}`} onClick={() => setActiveIndex(index)} aria-label={`Show ${product.name}`} aria-selected={activeIndex === index} />)}</div>
      </>}
    </div>
  </section>
}

function HeroImage({ product }) {
  const [failed, setFailed] = useState(false)
  if (!product.image || failed) return <div className="hero-slider__media hero-slider__fallback"><ImageOff aria-hidden="true" /><span>No image available</span></div>
  return <div className="hero-slider__media"><img src={product.image} alt={product.name} onError={() => setFailed(true)} /></div>
}
