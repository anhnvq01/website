import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Cart(){
  const [items, setItems] = useState([])
  const [products, setProducts] = useState({})
  const navigate = useNavigate()
  useEffect(()=> {
    const c = JSON.parse(localStorage.getItem('tb_cart')||'[]')
    setItems(c)
    // load product details quickly via API is possible; keep minimal
  },[])
  function updateQty(id, qty){
    const next = items.map(it => it.id===id ? {...it, qty: Number(qty)} : it).filter(i=>i.qty>0)
    setItems(next); localStorage.setItem('tb_cart', JSON.stringify(next))
  }
  function checkout(){ navigate('/checkout') }
  const subtotal = items.reduce((s,it)=> s + (it.price || 0) * it.qty, 0)
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Giỏ hàng</h2>
      {items.length===0 ? <div>Giỏ hàng trống. <Link to="/">Tiếp tục mua</Link></div> :
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="space-y-3">
              {items.map(it => (
                <div key={it.id} className="flex items-center gap-3 bg-white rounded p-3">
                  <div className="flex-1">
                    <div className="font-semibold">{it.name||it.id}</div>
                    <div className="text-sm text-gray-600">{(it.price||0).toLocaleString()}₫ x {it.qty}</div>
                  </div>
                  <div>
                    <input value={it.qty} onChange={(e)=>updateQty(it.id, e.target.value)} className="w-20 p-1 border rounded text-center" type="number" min="1"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="mb-2">Tạm tính: <span className="float-right">{subtotal.toLocaleString()}₫</span></div>
            <div className="mb-2">Phí vận chuyển: <span className="float-right">30,000₫</span></div>
            <hr className="my-2"/>
            <div className="font-bold">Tổng: <span className="float-right">{(subtotal+30000).toLocaleString()}₫</span></div>
            <div className="mt-4">
              <button onClick={checkout} className="w-full bg-green-700 text-white px-4 py-2 rounded">Thanh toán</button>
            </div>
          </div>
        </div>
      }
    </div>
  )
}