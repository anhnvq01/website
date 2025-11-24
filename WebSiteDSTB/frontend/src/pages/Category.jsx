import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Api from '../services/api'

export default function Category(){
  const { cat } = useParams()
  const [items, setItems] = useState([])
  useEffect(()=>{ Api.products('', cat).then(setItems) },[cat])
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">{cat}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(p => (
          <div key={p.id} className="bg-white rounded shadow p-4">
            <img src={p.image} className="h-36 w-full object-cover rounded" />
            <div className="font-semibold mt-2">{p.name}</div>
            <div className="font-bold mt-1">{p.price.toLocaleString()}₫</div>
            <Link to={'/product/'+p.id} className="inline-block mt-2 px-3 py-1 border rounded">Xem</Link>
          </div>
        ))}
      </div>
    </div>
  )
}