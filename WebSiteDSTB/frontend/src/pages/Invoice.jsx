import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Api from '../services/api'

export default function Invoice(){
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  useEffect(()=>{ 
    Api.order(id)
      .then(setOrder)
      .catch((err) => {
        console.error('Invoice fetch error:', err)
        setError(err.message || 'Không thể tải hóa đơn')
      })
  },[id])
  
  if(error) return <div className="container mx-auto p-4 text-red-600 font-semibold">Lỗi: {error}</div>
  if(!order) return <div className="container mx-auto p-4 text-gray-600">Đang tải hóa đơn...</div>
  
  // Handle both items (parsed) and items_json (string) from backend
  const items = Array.isArray(order.items) ? order.items : (order.items_json ? JSON.parse(order.items_json) : [])
  const orderDate = new Date(order.createdAt)
  const dateStr = orderDate.toLocaleDateString('vi-VN')
  const timeStr = orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white p-8 rounded shadow" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold mb-1">Đặc Sản Sạch Tây Bắc</h1>
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-bold mb-6">HÓA ĐƠN TẠM TÍNH</h2>

        {/* Order Info */}
        <div className="mb-6 border-b pb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">{order.id}</p>
              <p className="text-gray-600">{dateStr} {timeStr}</p>
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
          <p className="text-sm text-gray-600 mb-3">
            Phương thức: <strong>{order.method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt (COD)'}</strong>
          </p>
          
          {order.method === 'BANK' && !order.paid && (
            <div className="my-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h4 className="font-bold text-center mb-4 text-blue-800 text-lg">Quét mã QR để chuyển khoản</h4>
              <div className="flex justify-center">
                <img src="/images/qr.jpg" alt="QR Code" className="w-80 h-80 sm:w-96 sm:h-96 object-contain rounded-lg shadow-lg" />
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Vui lòng chuyển khoản và giữ lại biên lai
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            {order.paid ? '✓ Đã thanh toán' : '✗ Chưa thanh toán'}
          </p>
        </div>

        {/* Customer Note */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
          <p className="font-medium mb-1">📝 Lưu ý quan trọng:</p>
          <p>Nếu quý khách có bất kỳ thắc mắc hoặc cần thay đổi thông tin đơn hàng, vui lòng liên hệ qua:</p>
          <p className="mt-2">📞 Hotline: <strong>098.994.8583</strong></p>
          <p>💬 Zalo: <strong>098.994.8583</strong> (hoặc nhấn vào biểu tượng Zalo ở góc phải màn hình)</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-center no-print">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            🖨️ In Hóa Đơn
          </button>
          <button 
            onClick={() => {
              const printContent = document.querySelector('.bg-white.p-8').cloneNode(true)
              printContent.querySelectorAll('.no-print').forEach(el => el.remove())
              const printWindow = window.open('', '', 'width=800,height=600')
              printWindow.document.write('<html><head><title>Hóa đơn ' + order.id + '</title>')
              printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;margin:0}table{width:100%;border-collapse:collapse}th,td{padding:8px;text-align:left}th{border-bottom:2px solid #000}td{border-bottom:1px solid #ddd}.text-center{text-align:center}.text-right{text-align:right}.font-bold{font-weight:bold}.text-orange-600{color:#ea580c}.text-red-600{color:#dc2626}.text-gray-600{color:#4b5563}.mb-6{margin-bottom:24px}.mb-4{margin-bottom:16px}.mb-3{margin-bottom:12px}.mb-2{margin-bottom:8px}.mb-1{margin-bottom:4px}.mt-2{margin-top:8px}.mt-4{margin-top:16px}.pt-3{padding-top:12px}.pt-4{padding-top:16px}.pb-4{padding-bottom:16px}.py-2{padding-top:8px;padding-bottom:8px}.py-3{padding-top:12px;padding-bottom:12px}.p-4{padding:16px}.border-b{border-bottom:1px solid #e5e7eb}.border-b-2{border-bottom:2px solid #000}.border-t{border-top:1px solid #e5e7eb}.border-t-2{border-top:2px solid #000}.border-l-4{border-left:4px solid}.border-yellow-400{border-color:#facc15}.bg-yellow-50{background-color:#fefce8}.grid{display:grid}.grid-cols-2{grid-template-columns:repeat(2,1fr)}.gap-4{gap:16px}.text-sm{font-size:14px}.text-xs{font-size:12px}.text-lg{font-size:18px}.text-xl{font-size:20px}.text-2xl{font-size:24px}</style>')
              printWindow.document.write('</head><body>')
              printWindow.document.write(printContent.innerHTML)
              printWindow.document.write('</body></html>')
              printWindow.document.close()
              setTimeout(() => {
                printWindow.print()
                printWindow.close()
              }, 250)
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            💾 Tải Hóa Đơn
          </button>
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