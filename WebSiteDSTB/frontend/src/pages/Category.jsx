import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Api from '../services/api'

export default function Category(){
  const { cat } = useParams()
  const [items, setItems] = useState([])
  useEffect(()=>{ Api.products('', cat).then(setItems) },[cat])
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{cat}</h1>
        <p className="text-gray-600">Khám phá các sản phẩm đặc sản chất lượng cao</p>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-lg">Chưa có sản phẩm trong danh mục này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(p => {
            const oldPrice = Math.round(p.price * 1.18)
            return (
              <Link key={p.id} to={'/product/'+p.id} className="product-card group">
                <div className="relative overflow-hidden">
                  <img 
                    src={p.image || '/images/products/placeholder.jpg'} 
                    className="product-image h-56 w-full object-cover" 
                    alt={p.name}
                  />
                  {p.promo_price && (
                    <div className="absolute top-3 left-3 price-badge bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      -{Math.round((1 - p.promo_price/p.price)*100)}%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-orange-600">
                        {(p.promo_price || p.price).toLocaleString()}₫
                      </div>
                      {p.promo_price && (
                        <div className="text-xs text-gray-400 line-through">{p.price.toLocaleString()}₫</div>
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