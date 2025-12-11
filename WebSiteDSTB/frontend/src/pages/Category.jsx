import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Api from '../services/api'
import { ProductCard } from './Home'

// Helper to add cache-busting timestamp to image URLs
function addTimestampToUrl(url) {
  if (!url) return url
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
}

export default function Category(){
  const { cat } = useParams()
  const [items, setItems] = useState([])
  
  useEffect(()=>{
    const loadProducts = async () => {
      try {
        // Special handling for Tết Nguyên Đán category - filter by is_tet flag instead
        if (cat === 'Tết Nguyên Đán') {
          const allProducts = await Api.products('')
            const tetProducts = allProducts.filter(p => p.is_tet === 1 || p.is_tet === true).map(p => ({
              ...p,
              image: addTimestampToUrl(p.image),
              images: Array.isArray(p.images) ? p.images.map(img => addTimestampToUrl(img)) : []
            }))
          setItems(tetProducts)
        } else {
          // Normal category filtering
            const products = await Api.products('', cat)
            const withTimestamps = products.map(p => ({
              ...p,
              image: addTimestampToUrl(p.image),
              images: Array.isArray(p.images) ? p.images.map(img => addTimestampToUrl(img)) : []
            }))
            setItems(withTimestamps)
        }
      } catch (err) {
        console.error('Error loading products:', err)
        setItems([])
      }
    }
    loadProducts()
  }, [cat])
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {items.map(p => (
            <ProductCard key={p.id} product={p} showSoldCount={true} />
          ))}
        </div>
      )}
    </div>
  )
}