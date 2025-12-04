import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Api from '../services/api'

function CheckoutOrderSummary({ cart, discount }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProductDetails = async () => {
      const enriched = await Promise.all(
        cart.map(async (it) => {
          try {
            const p = await Api.product(it.id)
            return { ...it, name: p.name, price: p.promo_price || p.price }
          } catch {
            return { ...it, name: it.id, price: 0 }
          }
        })
      )
      setItems(enriched)
      setLoading(false)
    }
    
    if (cart.length > 0) {
      loadProductDetails()
    } else {
      setLoading(false)
    }
  }, [cart])

  if (loading) {
    return <div className="text-gray-600">Đang tải...</div>
  }

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const shipping = 30000
  const total = subtotal + shipping - Number(discount || 0)

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.id} className="flex justify-between items-center py-2 border-b">
          <div className="flex-1">
            <div className="font-medium">{it.name}</div>
            <div className="text-sm text-gray-600">SL: {it.qty}</div>
          </div>
          <div className="font-semibold">{(it.price * it.qty).toLocaleString()}₫</div>
        </div>
      ))}
      <div className="pt-3 space-y-2 border-t-2">
        <div className="flex justify-between">
          <span>Tạm tính:</span>
          <span className="font-semibold">{subtotal.toLocaleString()}₫</span>
        </div>
        <div className="flex justify-between">
          <span>Phí vận chuyển:</span>
          <span className="font-semibold">{shipping.toLocaleString()}₫</span>
        </div>
        {Number(discount) > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá:</span>
            <span className="font-semibold">-{Number(discount).toLocaleString()}₫</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Tổng cộng:</span>
          <span className="text-orange-600">{total.toLocaleString()}₫</span>
        </div>
      </div>
    </div>
  )
}

export default function Checkout(){
  const [cart, setCart] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [method, setMethod] = useState('COD')
  const [discount, setDiscount] = useState(0)
  const navigate = useNavigate()
  useEffect(()=> {
    const c = JSON.parse(localStorage.getItem('tb_cart')||'[]')
    setCart(c)
  },[])
  async function submit(e){
    e.preventDefault()
    // need to enrich cart with product details from backend
    const enriched = await Promise.all(cart.map(async it => {
      try { const p = await Api.product(it.id); return {...it, name: p.name, price: p.price} } catch { return {...it, name: it.id, price: 0} }
    }))
    const subtotal = enriched.reduce((s,it)=> s + it.price*it.qty, 0)
    const shipping = Number(import.meta.env.VITE_SHIPPING || 30000)
    const total = subtotal + shipping - Number(discount||0)
    const payload = {
      customer: { name, phone, address },
      items: enriched,
      subtotal, shipping, discount: Number(discount||0), total, method
    }
    const res = await Api.createOrder(payload)
    localStorage.removeItem('tb_cart')
    navigate('/invoice/'+res.id+'?tab=order')
  }
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Thanh toán</h2>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <label>Họ tên</label>
          <input required value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 border rounded my-1"/>
          <label>Số điện thoại</label>
          <input required value={phone} onChange={e=>setPhone(e.target.value)} className="w-full p-2 border rounded my-1"/>
          <label>Địa chỉ</label>
          <textarea required value={address} onChange={e=>setAddress(e.target.value)} className="w-full p-2 border rounded my-1"/>
          <label>Phương thức thanh toán</label>
          <select value={method} onChange={e=>setMethod(e.target.value)} className="w-full p-2 border rounded my-1">
            <option value="COD">COD</option>
            <option value="BANK">Chuyển khoản</option>
          </select>
          
          <label>Mã giảm (VND)</label>
          <input value={discount} onChange={e=>setDiscount(e.target.value)} className="w-full p-2 border rounded my-1"/>
          <div className="mt-4"><button className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-lg font-semibold">Xác nhận đặt hàng</button></div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold text-lg mb-4">Đơn hàng</h3>
          <CheckoutOrderSummary cart={cart} discount={discount} />
        </div>
      </form>
    </div>
  )
}