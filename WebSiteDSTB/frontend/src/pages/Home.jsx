import React, { useEffect, useState } from 'react'
import Api from '../services/api'
import { Link } from 'react-router-dom'

export default function Home(){
  const [items, setItems] = useState([])
  useEffect(()=>{ Api.products().then(setItems) },[])
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Sản phẩm nổi bật</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(p => (
          <div key={p.id} className="bg-white rounded shadow p-4 flex flex-col">
            <img src={p.image} className="h-40 w-full object-cover rounded" />
            <div className="mt-2 flex-1">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-600">{p.category}</div>
              <div className="font-bold mt-2">{p.price.toLocaleString()}₫</div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={'/product/'+p.id} className="flex-1 text-center p-2 border rounded">Xem</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}