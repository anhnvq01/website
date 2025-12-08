import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Api from '../services/api'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

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
            const oldPrice = Math.round(p.price * 1.18)
            return (
              <Link key={p.id} to={'/product/' + p.id} className="product-card group">
                <div className="relative overflow-hidden">
                  <img
                    src={p.image || '/images/products/placeholder.jpg'}
                    className="product-image w-full aspect-square object-cover"
                    alt={p.name}
                  />
                  {p.promo_price && (
                    <div className="absolute top-3 left-3 price-badge bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      -{Math.round((1 - p.promo_price / p.price) * 100)}%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">
                    {p.category}
                  </div>
                  <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-orange-600">
                        {(p.promo_price || p.price).toLocaleString()}₫
                      </div>
                      {p.promo_price && (
                        <div className="text-xs text-gray-400 line-through">
                          {p.price.toLocaleString()}₫
                        </div>
                      )}
                    </div>
                    <button className="icon-circle bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
                      🛒
                    </button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
