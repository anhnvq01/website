import React, { useState } from 'react'
import Api from '../services/api'

export default function Admin(){
  const [step, setStep] = useState('login')
  const [user, setUser] = useState('admin')
  const [pass, setPass] = useState('password123')
  const [token, setToken] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState('Thịt Gác Bếp')
  const [image, setImage] = useState('https://via.placeholder.com/600x400')
  const [desc, setDesc] = useState('')

  async function login(e){
    e.preventDefault()
    try {
      const res = await Api.adminLogin(user, pass)
      setToken(res.token)
      setStep('panel')
    } catch(e) { alert('Đăng nhập thất bại') }
  }
  async function addProduct(e){
    e.preventDefault()
    try {
      await Api.adminAddProduct(token, { name, price, category, description: desc, image })
      alert('Thêm xong')
    } catch(e){ alert('Lỗi') }
  }

  if(step==='login') return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Đăng nhập quản trị</h3>
        <form onSubmit={login}>
          <input value={user} onChange={e=>setUser(e.target.value)} className="w-full p-2 border rounded my-1"/>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" className="w-full p-2 border rounded my-1"/>
          <div className="mt-4"><button className="bg-green-700 text-white px-4 py-2 rounded">Đăng nhập</button></div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Quản trị</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold">Thêm sản phẩm</h3>
          <form onSubmit={addProduct} className="space-y-2 mt-2">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tên" className="w-full p-2 border rounded"/>
            <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Giá" className="w-full p-2 border rounded"/>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full p-2 border rounded">
              <option>Thịt Gác Bếp</option><option>Đồ Khô</option><option>Rau Rừng – Gia Vị</option><option>Rượu – Đồ Uống</option><option>Đồ ngâm rượu</option>
            </select>
            <input value={image} onChange={e=>setImage(e.target.value)} placeholder="URL ảnh" className="w-full p-2 border rounded"/>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Mô tả" className="w-full p-2 border rounded"/>
            <div><button className="bg-green-700 text-white px-3 py-2 rounded">Thêm</button></div>
          </form>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold">Ghi chú</h3>
          <div className="text-sm text-gray-600 mt-2">
            Đăng nhập sẽ trả token JWT. Đây là demo để quản trị thêm sản phẩm. Để xem đơn hàng và đánh dấu đã thanh toán, truy cập endpoint /api/orders (bổ sung giao diện nếu cần).
          </div>
        </div>
      </div>
    </div>
  )
}