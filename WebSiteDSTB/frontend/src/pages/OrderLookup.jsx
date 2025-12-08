import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Api from '../services/api'

export default function OrderLookup() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại')
      return
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Số điện thoại không hợp lệ')
      return
    }

    setError('')
    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch(`/api/orders/lookup/${phone.replace(/\s/g, '')}`)
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">🔍 Tra Cứu Đơn Hàng</h1>
          <p className="text-gray-600">Nhập số điện thoại để xem lịch sử đơn hàng của bạn</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Số điện thoại <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setError('')
                }}
                placeholder="Nhập số điện thoại đã đặt hàng"
                className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Đang tìm kiếm...
                </span>
              ) : (
                '🔍 Tra Cứu'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy đơn hàng</h3>
                <p className="text-gray-600">
                  Không có đơn hàng nào với số điện thoại <strong>{phone}</strong>
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Tìm thấy {orders.length} đơn hàng
                  </h2>
                </div>

                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            Mã đơn: <span className="font-mono text-green-600">{order.id}</span>
                          </h3>
                          <p className="text-sm text-gray-600">
                            Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            order.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {order.paid ? '✓ Đã thanh toán' : '✗ Chưa thanh toán'}
                          </span>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status === 'delivered' ? '✓ Đã giao' :
                             order.status === 'cancelled' ? '✗ Đã hủy' :
                             '⏳ Chưa giao'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Khách hàng:</span>
                          <span className="font-semibold">{order.customer_name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Địa chỉ:</span>
                          <span className="font-semibold text-right">{order.customer_address}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phương thức:</span>
                          <span className="font-semibold">{order.method === 'COD' ? 'COD (Thanh toán khi nhận hàng)' : 'Chuyển khoản ngân hàng'}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t">
                          <span className="text-gray-700">Tổng tiền:</span>
                          <span className="text-green-600">{order.total?.toLocaleString()}₫</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Link
                          to={`/invoice/${order.id}`}
                          className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-bold text-center hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                        >
                          📄 Xem Chi Tiết Đơn Hàng
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
