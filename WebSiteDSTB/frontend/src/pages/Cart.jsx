import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Api from '../services/api'

// Helper to add cache-busting timestamp to image URLs
function addTimestampToUrl(url) {
  if (!url) return url
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
}

export default function Cart(){
  const [items, setItems] = useState([])
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  // Prevent scroll from changing number inputs
  useEffect(() => {
    const preventNumberScroll = (e) => {
      if (e.target.type === 'number') {
        e.target.blur()
        setTimeout(() => e.target.focus(), 0)
      }
    }
    document.addEventListener('wheel', preventNumberScroll, { passive: false })
    return () => document.removeEventListener('wheel', preventNumberScroll)
  }, [])
  
  useEffect(()=> {
    const c = JSON.parse(localStorage.getItem('tb_cart')||'[]')
    setItems(c)
    
    // Load product details for each item in cart
    const loadProducts = async () => {
      const productData = {}
      for (const item of c) {
        try {
          const product = await Api.product(item.id)
          productData[item.id] = product
        } catch(err) {
          console.error('Failed to load product', item.id, err)
        }
      }
      setProducts(productData)
      setLoading(false)
    }
    
    if (c.length > 0) {
      loadProducts()
    } else {
      setLoading(false)
    }
  },[])

  // Refresh product data if admin updates a product while cart is open
  useEffect(() => {
    const handleProductUpdate = async (event) => {
      const updatedProductId = event.detail?.productId
      if (!updatedProductId) return
      try {
        const product = await Api.product(updatedProductId)
        setProducts(prev => ({ ...prev, [updatedProductId]: product }))
      } catch (err) {
        console.error('Failed to refresh product in cart', updatedProductId, err)
      }
    }
    window.addEventListener('productUpdated', handleProductUpdate)
    return () => window.removeEventListener('productUpdated', handleProductUpdate)
  }, [])
  
  function updateQty(id, qty){
    const qtyNum = Number(qty) || 0
    // Allow qty = 0, user can delete with X button
    const next = items.map(it => it.id===id ? {...it, qty: qtyNum} : it)
    setItems(next); localStorage.setItem('tb_cart', JSON.stringify(next))
  }
  
  function removeItem(id){
    const next = items.filter(it => it.id !== id)
    setItems(next)
    localStorage.setItem('tb_cart', JSON.stringify(next))
  }
  
  function checkout(){ navigate('/checkout') }
  
  const subtotal = items.reduce((s,it)=> {
    if (it.qty <= 0) return s // Skip items with qty 0
    const product = products[it.id]
    const price = product ? (product.promo_price || product.price) : 0
    return s + price * it.qty
  }, 0)
  
  const shipping = 30000
  const total = subtotal + shipping
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center py-20">
        <div className="text-gray-500 text-lg">Đang tải giỏ hàng...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="container mx-auto px-4 pt-8 pb-2">
          <div className="text-center max-w-md mx-auto">
            <div className="text-7xl mb-3">🛒</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Giỏ Hàng Trống</h2>
            <p className="text-gray-600 mb-3">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
            <div className="space-y-2 mb-2">
              <button 
                onClick={() => navigate(-1)}
                className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                ← Tiếp Tục Mua
              </button>
              <br/>
              <Link 
                to="/order-guide" 
                className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                📖 Hướng Dẫn Mua Hàng Online
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">🛒 Giỏ Hàng Của Bạn</h1>
          <p className="text-gray-600 text-sm">Bạn có <span className="font-bold text-green-600">{items.filter(it => it.qty > 0).reduce((sum, it) => sum + it.qty, 0)}</span> sản phẩm trong giỏ</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {items.map((it, idx) => {
                const product = products[it.id]
                const price = product ? (product.promo_price || product.price) : 0
                  // Prefer main image field; fallback to gallery[0]
                  let image = product?.image || product?.images?.[0] || 'https://via.placeholder.com/100'
                  // Add timestamp to bypass cache
                  image = addTimestampToUrl(image)
                const itemTotal = price * it.qty
                
                return (
                  <div 
                    key={it.id}
                    className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-3 sm:p-5 border-l-4 ${
                      it.qty === 0 ? 'border-l-red-400 opacity-60' : 'border-l-green-500'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {/* Product Image & Info */}
                      <div className="flex gap-3 flex-1 min-w-0">
                        <img 
                          src={image} 
                          alt={product?.name || ''} 
                          className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform shadow-md" 
                          onClick={()=>navigate('/product/'+it.id)}
                        />
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>navigate('/product/'+it.id)}>
                          <h3 className="font-bold text-base sm:text-lg text-gray-800 hover:text-green-600 transition-colors line-clamp-2">
                            {product?.name || 'Đang tải...'}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1">
                            {product?.category || 'Sản phẩm'}
                          </p>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-green-600 font-bold text-base sm:text-lg">
                              {price.toLocaleString()}₫
                            </span>
                            {product?.promo_price && (
                              <span className="text-gray-400 line-through text-xs sm:text-sm">
                                {product?.price?.toLocaleString()}₫
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                          <button 
                            onClick={()=>updateQty(it.id, Math.max(0, it.qty - 1))} 
                            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white hover:bg-gray-200 rounded-lg font-bold text-gray-700 transition-colors shadow-sm text-lg"
                            title="Giảm số lượng"
                          >
                            -
                          </button>
                          <span className="w-10 sm:w-12 text-center font-semibold text-base sm:text-lg text-gray-800">
                            {it.qty}
                          </span>
                          <button 
                            onClick={()=>updateQty(it.id, it.qty + 1)} 
                            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white hover:bg-green-100 rounded-lg font-bold text-green-600 transition-colors shadow-sm text-lg"
                            title="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={()=>removeItem(it.id)} 
                          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-bold text-2xl transition-colors flex-shrink-0"
                          title="Xóa khỏi giỏ"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border border-gray-100">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <span className="text-2xl">📋</span>
                <h3 className="font-bold text-xl text-gray-800">Tổng Đơn Hàng</h3>
              </div>
              
              {/* Order Summary */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-semibold text-gray-900">
                    {subtotal.toLocaleString()}₫
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-semibold text-orange-600">
                    +{shipping.toLocaleString()}₫
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tổng số sản phẩm:</span>
                    <span className="font-bold text-gray-900">
                      {items.filter(it => it.qty > 0).reduce((sum, it) => sum + it.qty, 0)} sản phẩm
                    </span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white text-xs font-medium uppercase tracking-wider opacity-80 mb-1">
                      Tổng Cộng
                    </div>
                    <div className="text-white text-3xl font-bold">
                      {total.toLocaleString()}₫
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={checkout}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="text-xl">💳</span>
                  Đặt Hàng Ngay
                </button>
                
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-center transition-all shadow-sm hover:shadow-md"
                >
                  ← Tiếp Tục Mua
                </button>

                <Link 
                  to="/order-guide" 
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-center transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <span>📖</span>
                  Hướng Dẫn Mua Hàng
                </Link>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}