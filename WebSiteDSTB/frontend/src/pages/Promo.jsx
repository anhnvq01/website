import React, { useEffect, useState } from 'react'
import Api from '../services/api'
import { ProductCard } from './Home'

// Helper to add cache-busting timestamp to image URLs
function addTimestampToUrl(url) {
  if (!url) return url
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
}

export default function Promo(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Api.products()
      .then(all => {
        const promos = (all || []).filter(p => p.promo_price && p.promo_price < p.price)
        const withTimestamps = promos.map(p => ({
          ...p,
          image: addTimestampToUrl(p.image),
          images: Array.isArray(p.images) ? p.images.map(img => addTimestampToUrl(img)) : []
        }))
        setItems(withTimestamps)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto p-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">💥 Danh mục sản phẩm khuyến mãi HOT</h1>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-600 py-16">Chưa có sản phẩm khuyến mãi.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {items.map(p => <ProductCard key={p.id} product={p} showSoldCount={false} />)}
        </div>
      )}
    </div>
  )
}
