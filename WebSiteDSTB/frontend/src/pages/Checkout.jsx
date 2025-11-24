import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Api from '../services/api'

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
    navigate('/invoice/'+res.id)
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
          <div className="mt-4"><button className="bg-green-700 text-white px-4 py-2 rounded">Xác nhận đặt hàng</button></div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold">Đơn hàng</h3>
          <div className="mt-2 space-y-2">
            {cart.map(it => (<div key={it.id} className="flex justify-between"><div>{it.name || it.id} x {it.qty}</div><div>{(it.price||0*it.qty).toLocaleString()}₫</div></div>))}
          </div>
        </div>
      </form>
    </div>
  )
}