import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Api from '../services/api'

export default function Product(){
  const { id } = useParams()
  const [p, setP] = useState(null)
  const navigate = useNavigate()
  useEffect(()=>{ Api.product(id).then(setP).catch(()=>{}) },[id])
  function addToCart(){
    const cart = JSON.parse(localStorage.getItem('tb_cart')||'[]')
    const found = cart.find(x=>x.id===id)
    if(found) found.qty += 1; else cart.push({id, qty:1})
    localStorage.setItem('tb_cart', JSON.stringify(cart))
    navigate('/cart')
  }
  if(!p) return <div className="container mx-auto p-4">Sản phẩm không tìm thấy</div>
  return (
    <div className="container mx-auto p-4">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <img src={p.image} className="w-full h-80 object-cover rounded" />
          <p className="mt-3 text-gray-700">{p.description}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-xl font-semibold">{p.name}</h3>
          <div className="text-2xl font-bold mt-2">{p.price.toLocaleString()}₫</div>
          <div className="mt-4">
            <button onClick={addToCart} className="w-full bg-green-700 text-white px-4 py-2 rounded">Thêm vào giỏ</button>
            <Link to="/cart" className="block mt-2 text-center">Xem giỏ hàng</Link>
          </div>
        </div>
      </div>
    </div>
  )
}