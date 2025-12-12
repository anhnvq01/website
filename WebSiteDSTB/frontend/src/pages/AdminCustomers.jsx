import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Api from '../services/api'

const ownerOptions = [
  { value: 'Quang Tâm', label: 'Quang Tâm' },
  { value: 'Mẹ Hằng', label: 'Mẹ Hằng' }
]

function AdminCustomers() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', phone: '', owner: ownerOptions[0].value })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate('/admin')
      return
    }
    load()
  }, [token])

  const load = async () => {
    try {
      setLoading(true)
      const data = await Api.adminGetCustomers(token)
      setCustomers(data)
    } catch (e) {
      console.error(e)
      if (e.response?.status === 401) {
        localStorage.removeItem('admin_token')
        navigate('/admin')
      } else {
        setError('Không tải được danh sách khách hàng')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ name: '', phone: '', owner: ownerOptions[0].value })
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Vui lòng nhập đầy đủ tên và số điện thoại')
      return
    }
    try {
      if (editingId) {
        await Api.adminUpdateCustomer(token, editingId, form)
      } else {
        await Api.adminCreateCustomer(token, form)
      }
      resetForm()
      load()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Lỗi khi lưu khách hàng')
    }
  }

  const handleEdit = (c) => {
    setForm({ name: c.name, phone: c.phone, owner: c.owner })
    setEditingId(c.id)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa khách hàng này?')) return
    try {
      await Api.adminDeleteCustomer(token, id)
      if (editingId === id) resetForm()
      load()
    } catch (err) {
      console.error(err)
      setError('Không thể xóa khách hàng')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Admin / Khách hàng</p>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/import-customers" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium">📤 Import Excel</Link>
            <button onClick={() => navigate('/admin')} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">← Quay về Admin</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white shadow rounded p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Thêm / Sửa khách hàng</h2>
            {editingId && (
              <button onClick={resetForm} className="text-sm text-blue-600 hover:underline">Huỷ chỉnh sửa</button>
            )}
          </div>
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách</label>
              <input className="w-full border rounded px-3 py-2" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ví dụ: Khách A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0xxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thuộc về</label>
              <select className="w-full border rounded px-3 py-2" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
                {ownerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{editingId ? 'Lưu thay đổi' : 'Thêm khách hàng'}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-100 text-gray-700 rounded">Huỷ</button>}
            </div>
          </form>
        </section>

        <section className="bg-white shadow rounded p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Danh sách khách hàng</h2>
            <p className="text-sm text-gray-500">Tổng: {customers.length}</p>
          </div>
          {loading ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : customers.length === 0 ? (
            <p className="text-gray-600">Chưa có khách hàng</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2">SĐT</th>
                    <th className="px-3 py-2">Thuộc</th>
                    <th className="px-3 py-2">Ngày tạo</th>
                    <th className="px-3 py-2 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2">{c.phone}</td>
                      <td className="px-3 py-2">{c.owner}</td>
                      <td className="px-3 py-2 text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : ''}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button onClick={() => handleEdit(c)} className="px-3 py-1 text-blue-600 hover:underline">Sửa</button>
                        <button onClick={() => handleDelete(c.id)} className="px-3 py-1 text-red-600 hover:underline">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default AdminCustomers
