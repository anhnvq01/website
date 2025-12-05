import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Api from '../services/api'
import html2canvas from 'html2canvas'

export default function Invoice(){
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const invoiceRef = useRef(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(()=>{ 
    Api.order(id)
      .then(setOrder)
      .catch((err) => {
        console.error('Invoice fetch error:', err)
        setError(err.message || 'Không thể tải hóa đơn')
      })
  },[id])
  
  const downloadAsImage = async () => {
    if (!invoiceRef.current) return
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        ignoreElements: (element) => {
          return element.classList.contains('no-print')
        }
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `HoaDon_${order.id}.png`
      link.click()
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err)
      alert('Không thể tải ảnh. Vui lòng thử lại!')
    }
  }
  
  if(error) return <div className="container mx-auto p-4 text-red-600 font-semibold">Lỗi: {error}</div>
  if(!order) return <div className="container mx-auto p-4 text-gray-600">Đang tải hóa đơn...</div>
  
  // Handle both items (parsed) and items_json (string) from backend
  const items = Array.isArray(order.items) ? order.items : (order.items_json ? JSON.parse(order.items_json) : [])
  const orderDate = new Date(order.createdAt)
  const dateStr = orderDate.toLocaleDateString('vi-VN')
  const timeStr = orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div ref={invoiceRef} className="bg-white p-8 rounded shadow" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Title */}
        <h2 className="text-center text-xl font-bold mb-6">HÓA ĐƠN TẠM TÍNH</h2>

        {/* Order Info */}
        <div className="mb-6 border-b pb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">{order.id} - {dateStr} {timeStr}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Khách: <span className="font-normal">{order.customer_name}</span></p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead className="border-b-2">
              <tr>
                <th className="text-left py-2 font-semibold">Đơn giá</th>
                <th className="text-center py-2 font-semibold">SL</th>
                <th className="text-right py-2 font-semibold">T.tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-3">
                    <p className="font-medium">{idx + 1}. {it.name}</p>
                    <p className="text-gray-600">{(it.price || 0).toLocaleString()}</p>
                  </td>
                  <td className="text-center py-3">
                    <span>x{it.qty}</span>
                  </td>
                  <td className="text-right py-3 font-medium">
                    {((it.price || 0) * it.qty).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t-2 pt-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
            <div className="text-right">Tạm tính ({items.length})</div>
            <div className="text-right font-semibold">
              {items.reduce((sum, it) => sum + (it.price || 0) * it.qty, 0).toLocaleString()} ₫
            </div>
          </div>
          
          {order.shipping > 0 && (
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
              <div className="text-right">Vận chuyển</div>
              <div className="text-right font-semibold">
                {(order.shipping).toLocaleString()} ₫
              </div>
            </div>
          )}
          
          {Number(order.discount) > 0 && (
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
              <div className="text-right">Giảm giá</div>
              <div className="text-right font-semibold text-red-600">
                -{(order.discount).toLocaleString()} ₫
              </div>
            </div>
          )}
          
          <div className="border-t-2 pt-3 grid grid-cols-2 gap-4 text-lg">
            <div className="text-right font-bold">Tổng:</div>
            <div className="text-right font-bold text-orange-600">
              {(order.total || 0).toLocaleString()} ₫
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="text-center border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">
            Phương thức: <strong>{order.method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt (COD)'}</strong>
          </p>
          
          <p className="text-xs text-gray-500">
            {order.paid ? '✓ Đã thanh toán' : '✗ Chưa thanh toán'}
          </p>
        </div>

        {order.method === 'BANK' && !order.paid && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg no-print">
            <p className="font-semibold text-blue-900 mb-3">Quét QR để thanh toán</p>
            <div className="flex flex-wrap gap-4 items-start">
              <img 
                src="/images/qr.jpg" 
                alt="QR chuyển khoản" 
                className="w-48 h-48 object-cover object-top rounded-lg border-2 border-blue-200 shadow-sm"
                style={{ objectPosition: 'center top' }}
              />
              <div className="text-sm text-blue-900 space-y-2">
                <p>Vui lòng chuyển khoản và ghi rõ mã đơn:</p>
                <div className="flex items-center gap-2 bg-white border border-blue-200 rounded px-3 py-2 shadow-sm">
                  <span className="font-mono font-semibold text-blue-800 text-sm">{order.id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(order.id)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1600)
                    }}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                  >
                    {copied ? '✓ Đã copy' : 'Copy'}
                  </button>
                </div>
                {copied && (
                  <div className="text-xs text-green-700 font-semibold animate-pulse">Đã copy mã đơn, dán vào nội dung chuyển khoản.</div>
                )}
                <p>Sau khi thanh toán, vui lòng báo lại để xác nhận.</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Note - không hiển thị khi tải ảnh */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700 no-print">
          <p className="font-medium mb-1">📝 Lưu ý quan trọng:</p>
          <p>Nếu quý khách có bất kỳ thắc mắc hoặc cần thay đổi thông tin đơn hàng, vui lòng liên hệ qua:</p>
          <p className="mt-2">📞 Hotline: <strong>098.994.8583</strong></p>
          <p>💬 Zalo: <strong>098.994.8583</strong> (hoặc chọn biểu tượng Zalo ở góc phải màn hình)</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none; }
          body { margin: 0; padding: 0; }
          .container { max-width: 100%; }
        }
      `}</style>
    </div>
  )
}