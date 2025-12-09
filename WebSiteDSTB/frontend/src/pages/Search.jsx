import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Api from '../services/api'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const addToCart = (product, e) => {
    e.preventDefault()
    e.stopPropagation()
    const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]')
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      existing.qty += 1
    } else {
      cart.push({ id: product.id, qty: 1 })
    }
    localStorage.setItem('tb_cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { animate: true } }))
  }

  const normalize = (text = '') => text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
  
  const filterByQuery = (products, q) => {
    const tokens = normalize(q).split(/\s+/).filter(Boolean)
    if (!tokens.length) return products
    const filtered = products.filter(p => {
      const hay = normalize(`${p.name || ''} ${p.category || ''}`)
      return tokens.every(t => hay.includes(t))
    })
    // Nếu lọc ra rỗng, trả lại kết quả gốc để không blank toàn bộ
    return filtered.length ? filtered : products
  }

  useEffect(() => {
    const searchProducts = async () => {
      setLoading(true)
      try {
        const results = await Api.products(query)
        setItems(filterByQuery(results, query))
      } catch (err) {
        console.error('Search error:', err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    if (query) {
      searchProducts()
    } else {
      setItems([])
      setLoading(false)
    }
  }, [query])

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Kết quả tìm kiếm: "{query}"
        </h1>
        <p className="text-gray-600">
          {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${items.length} sản phẩm`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin text-6xl">⚙️</div>
          <p className="mt-4 text-gray-600">Đang tìm kiếm...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg mb-4">
            Không tìm thấy sản phẩm nào với từ khóa "{query}"
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
          >
            Quay về trang chủ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(p => {
            const discountPercent = p.promo_price && p.promo_price < p.price ? Math.round((p.price - p.promo_price) / p.price * 100) : 0
            return (
              <div 
                key={p.id}
                className="product-card group cursor-pointer"
                onClick={() => window.location.href = '/product/' + p.id}
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={p.image || '/images/products/placeholder.jpg'}
                    className="product-image w-full aspect-square object-cover"
                    alt={p.name}
                  />
                  {discountPercent > 0 && (
                    <div className="absolute top-3 left-3 price-badge bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      -{discountPercent}%
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span 
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `/category/${p.category}`
                    }}
                    className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1 hover:text-orange-700 transition-colors w-fit cursor-pointer"
                  >
                    {p.category}
                  </span>
                  <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">
                    {p.name}
                  </h3>
                  <div className="mt-auto">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xl font-bold text-orange-600">
                          {(p.promo_price || p.price).toLocaleString()}₫
                        </div>
                        {discountPercent > 0 && (
                          <div className="text-xs text-gray-400 line-through">
                            {p.price.toLocaleString()}₫
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={(e) => addToCart(p, e)}
                        className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105 transition-transform px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap flex-shrink-0 min-h-[44px]"
                        aria-label="Thêm vào giỏ"
                        title="Thêm sản phẩm vào giỏ"
                      >
                        <span className="text-base">🛒</span>
                        <span className="hidden sm:inline">Thêm vào giỏ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
