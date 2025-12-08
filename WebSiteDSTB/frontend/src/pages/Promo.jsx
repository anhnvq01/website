import React, { useEffect, useState } from 'react'
import Api from '../services/api'
import { ProductCard } from './Home'

export default function Promo(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Api.products()
      .then(all => {
        const promos = (all || []).filter(p => p.promo_price && p.promo_price < p.price)
        setItems(promos)
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(p => <ProductCard key={p.id} product={p} showSoldCount={false} />)}
        </div>
      )}
    </div>
  )
}
