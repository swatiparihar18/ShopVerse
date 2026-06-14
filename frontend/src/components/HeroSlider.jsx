import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PRODUCTS } from '../data/products'
import './HeroSlider.css'

const productById = (id) => PRODUCTS.find((product) => product.id === id) || {}

const HERO_SLIDES = [
  {
    productId: 8,
    title: 'Big Tech Deals',
    subtitle: 'Save on laptops, audio, wearables, and everyday electronics.',
    cta: 'Shop electronics',
    to: '/products?category=Electronics',
    background: '#e8f1ff'
  },
  {
    productId: 3,
    title: 'Sports Essentials',
    subtitle: 'Fresh shoes, training gear, and performance picks for active days.',
    cta: 'Explore sports',
    to: '/products?category=Sports',
    background: '#fff4df'
  },
  {
    productId: 4,
    title: 'Style Refresh',
    subtitle: 'Upgrade your wardrobe with comfortable, easy-to-wear fashion.',
    cta: 'Shop fashion',
    to: '/products?category=Fashion',
    background: '#f7e9ff'
  },
  {
    productId: 7,
    title: 'Home Upgrades',
    subtitle: 'Smart, useful pieces that make every room feel more polished.',
    cta: 'Shop home',
    to: '/products?category=Home%20%26%20Living',
    background: '#e8fff4'
  },
  {
    productId: 9,
    title: 'Beauty Picks',
    subtitle: 'Self-care favorites and thoughtful gift sets at great prices.',
    cta: 'Shop beauty',
    to: '/products?category=Beauty',
    background: '#ffecef'
  }
]

export default function HeroSlider() {
  const slides = useMemo(() => HERO_SLIDES.map((slide) => {
    const product = productById(slide.productId)
    return {
      ...slide,
      image: product.image,
      imageAlt: product.name || slide.title,
      badge: product.badge,
      price: product.price
    }
  }), [])

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1))
  }

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length)
  }

  useEffect(() => {
    if (isPaused || slides.length <= 1) return undefined
    const interval = window.setInterval(goToNext, 4000)
    return () => window.clearInterval(interval)
  }, [isPaused, slides.length])

  return (
    <section
      className="hero-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional offers"
    >
      <div className="hero-slider__viewport">
        <div
          className="hero-slider__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <article
              className="hero-slider__slide"
              key={slide.title}
              style={{ backgroundColor: slide.background }}
            >
              <div className="hero-slider__content">
                <span className="hero-slider__eyebrow">{slide.badge || 'ShopVerse Deals'}</span>
                <h1>{slide.title}</h1>
                <p>{slide.subtitle}</p>
                <Link to={slide.to} className="hero-slider__cta">{slide.cta}</Link>
              </div>

              <div className="hero-slider__media">
                {slide.image ? (
                  <img src={slide.image} alt={slide.imageAlt} />
                ) : (
                  <div className="hero-slider__fallback">
                    <span>{slide.title}</span>
                  </div>
                )}
                {slide.price && (
                  <div className="hero-slider__price">From Rs. {slide.price.toLocaleString()}</div>
                )}
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="hero-slider__arrow hero-slider__arrow--left"
          onClick={goToPrevious}
          aria-label="Previous banner"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className="hero-slider__arrow hero-slider__arrow--right"
          onClick={goToNext}
          aria-label="Next banner"
        >
          <ChevronRight />
        </button>

        <div className="hero-slider__dots" role="tablist" aria-label="Banner slides">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.title}
              className={`hero-slider__dot ${activeIndex === index ? 'hero-slider__dot--active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to ${slide.title}`}
              aria-selected={activeIndex === index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
