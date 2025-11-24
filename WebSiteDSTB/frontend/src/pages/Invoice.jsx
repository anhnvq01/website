import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Api from '../services/api'

export default function Invoice(){
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  useEffect(()=>{ Api.order(id).then(setOrder).catch(()=>{}) },[id])
  if(!order) return <div className="container mx-auto p-4">Hóa đơn không tìm thấy</div>
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold">Hóa đơn #{order.id}</h2>
        <div className="text-sm text-gray-600">Ngày: {new Date(order.createdAt).toLocaleString()}</div>
        <div className="mt-4">
          <div className="font-semibold">Khách hàng</div>
          <div>{order.customer_name} — {order.customer_phone}</div>
          <div>{order.customer_address}</div>
        </div>
        <div className="mt-4">
          <table className="w-full text-left">
            <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
            <tbody>
              {JSON.parse(order.items_json).map((it,idx)=>(
                <tr key={idx}><td>{it.name}</td><td>{it.qty}</td><td>{(it.price||0).toLocaleString()}₫</td><td>{((it.price||0)*it.qty).toLocaleString()}₫</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <div>Phí vận chuyển: {(order.shipping||0).toLocaleString()}₫</div>
          <div>Giảm giá: {(order.discount||0).toLocaleString()}₫</div>
          <div className="font-bold">Tổng: {(order.total||0).toLocaleString()}₫</div>
          <div>Phương thức: {order.method}</div>
          <div className="mt-3"><div className="inline-block px-3 py-1 rounded bg-yellow-100">Trạng thái: {order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</div></div>
        </div>
      </div>
    </div>
  )
}