import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Api from '../services/api'

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
  function updateQty(id, qty){
    const next = items.map(it => it.id===id ? {...it, qty: Number(qty)} : it).filter(i=>i.qty>0)
    setItems(next); localStorage.setItem('tb_cart', JSON.stringify(next))
  }
  
  function removeItem(id){
    const next = items.filter(it => it.id !== id)
    setItems(next)
    localStorage.setItem('tb_cart', JSON.stringify(next))
  }
  
  function checkout(){ navigate('/checkout') }
  
  const subtotal = items.reduce((s,it)=> {
    const product = products[it.id]
    const price = product ? (product.promo_price || product.price) : 0
    return s + price * it.qty
  }, 0)
  if (loading) {
    return <div className="container mx-auto p-4">Đang tải giỏ hàng...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Giỏ hàng</h2>
      {items.length===0 ? <div>Giỏ hàng trống. <Link to="/" className="text-green-700 underline">Tiếp tục mua</Link></div> :
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="space-y-3">
              {items.map(it => {
                const product = products[it.id]
                const price = product ? (product.promo_price || product.price) : 0
                const image = product?.images?.[0] || product?.image || 'https://via.placeholder.com/100'
                
                return (
                  <div key={it.id} className="flex items-center gap-3 bg-white rounded p-3 shadow">
                    <img src={image} className="w-20 h-20 object-cover rounded" alt={product?.name || ''} />
                    <div className="flex-1">
                      <div className="font-semibold">{product?.name || it.id}</div>
                      <div className="text-sm text-gray-600">{price.toLocaleString()}₫</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        value={it.qty} 
                        onChange={(e)=>updateQty(it.id, e.target.value)} 
                        className="w-20 p-2 border rounded text-center" 
                        type="number" 
                        min="1"
                      />
                      <button 
                        onClick={()=>removeItem(it.id)} 
                        className="text-red-600 hover:text-red-800 font-bold px-2"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="p-4 bg-white rounded shadow h-fit">
            <h3 className="font-semibold text-lg mb-3">Tổng đơn hàng</h3>
            <div className="mb-2 flex justify-between">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString()}₫</span>
            </div>
            <div className="mb-2 flex justify-between">
              <span>Phí vận chuyển:</span>
              <span>30,000₫</span>
            </div>
            <hr className="my-3"/>
            <div className="font-bold text-lg flex justify-between">
              <span>Tổng:</span>
              <span className="text-green-700">{(subtotal+30000).toLocaleString()}₫</span>
            </div>
            <div className="mt-4">
              <button onClick={checkout} className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded font-semibold">
                Thanh toán
              </button>
              <Link to="/" className="block mt-2 text-center text-green-700">Tiếp tục mua hàng</Link>
            </div>
          </div>
        </div>
      }
    </div>
  )
}