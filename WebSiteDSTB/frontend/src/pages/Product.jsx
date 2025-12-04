import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Api from '../services/api'

export default function Product(){
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [error, setError] = useState(null)
  const [active, setActive] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showAddedNotification, setShowAddedNotification] = useState(false)
  const navigate = useNavigate()
  useEffect(()=>{ 
    Api.product(id)
      .then(setP)
      .catch((err) => {
        console.error('Product fetch error:', err)
        setError(err.message || 'Không thể tải sản phẩm')
      })
  },[id])
  function addToCart(){
    const cart = JSON.parse(localStorage.getItem('tb_cart')||'[]')
    const found = cart.find(x=>x.id===id)
    if(found) found.qty += quantity; else cart.push({id, qty: quantity})
    localStorage.setItem('tb_cart', JSON.stringify(cart))
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Show notification
    setShowAddedNotification(true)
    
    // Scroll to top to see notification
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    setTimeout(() => setShowAddedNotification(false), 3000)
  }
  if(error) return <div className="container mx-auto p-4 text-red-600 font-semibold">Lỗi: {error}</div>
  if(!p) return <div className="container mx-auto p-4 text-gray-600">Đang tải sản phẩm...</div>
  const images = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : [])
  return (
    <div className="container mx-auto p-4 py-8">
      {/* Add to cart notification */}
      {showAddedNotification && (
        <div
          className="fixed z-[9999] 
                     left-2 right-2 top-20 
                     sm:left-auto sm:right-4 sm:top-24 sm:w-auto"
        >
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white 
                          px-4 sm:px-6 py-3 sm:py-4 
                          rounded-2xl shadow-2xl animate-slide-in-right 
                          flex items-center gap-2 sm:gap-3 border-2 border-white 
                          max-w-full sm:max-w-sm">
            <span className="text-2xl sm:text-3xl">✓</span>
            <div>
              <div className="font-bold text-base sm:text-lg">Đã thêm vào giỏ hàng!</div>
              <Link to="/cart" className="text-xs sm:text-sm underline hover:text-green-100 font-medium">Xem giỏ hàng →</Link>
            </div>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {images.length ? (
              <div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                  <img src={images[active]} className="w-full h-96 object-contain rounded-lg" alt={p.name} />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i)=> (
                    <button 
                      key={i} 
                      onClick={()=>setActive(i)} 
                      className={`flex-shrink-0 border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                        i===active 
                          ? 'ring-4 ring-orange-400 border-orange-400 scale-105' 
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <img src={img} className="w-24 h-20 object-contain bg-gray-50" alt={`${p.name} ${i+1}`} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <span className="text-gray-400 text-6xl">📦</span>
              </div>
            )}
            <div className="mt-6 p-4 bg-green-50 rounded-xl border-2 border-green-100">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span>📝</span> Mô tả sản phẩm
              </h4>
              <p className="text-gray-700 leading-relaxed">{p.description || 'Đặc sản Tây Bắc chất lượng cao, đảm bảo nguồn gốc xuất xứ rõ ràng.'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 h-fit sticky top-24">
          <div className="mb-4">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{p.category}</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-2 leading-tight">{p.name}</h1>
          </div>
          
          <div className="mb-6 pb-6 border-b border-gray-200">
            {p.promo_price ? (
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-1">{p.promo_price.toLocaleString()}₫</div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-gray-400 line-through">{p.price.toLocaleString()}₫</span>
                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full">
                    -{Math.round((1 - p.promo_price/p.price)*100)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-orange-600">{p.price.toLocaleString()}₫</div>
            )}
          </div>

          <div className="mb-6 flex items-center gap-3 text-sm text-gray-700">
            {p.weight && (
              <div className="flex items-center gap-1">
                <span>⚖️</span>
                <span className="font-semibold">{p.weight}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>📊</span>
              <span className="font-semibold">Đã bán: {p.sold_count || 0}</span>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Số lượng:</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border-2 border-gray-300 rounded-lg p-2 font-semibold text-lg"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={addToCart} 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🛒</span>
              Thêm vào giỏ hàng
            </button>
            <Link 
              to="/cart" 
              className="block w-full text-center border-2 border-green-600 text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-300"
            >
              Xem giỏ hàng
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span>✅</span>
              <span>Sản phẩm chính hãng 100%</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🚚</span>
              <span>Giao hàng toàn quốc</span>
            </div>
            <div className="flex items-start gap-2">
              <span>💰</span>
              <span>Thanh toán khi nhận hàng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}