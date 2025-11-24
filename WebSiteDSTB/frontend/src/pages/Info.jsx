import React from 'react'
export default function Info(){
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-2">Chính sách bán hàng</h2>
      <div className="bg-white rounded shadow p-4">
        <ul className="list-disc pl-6">
          <li>Thanh toán: COD hoặc chuyển khoản trực tiếp.</li>
          <li>Hóa đơn lưu dưới 1 URL riêng. Sau khi khách thanh toán, quản trị viên đánh dấu 'Đã thanh toán' để cập nhật trạng thái.</li>
          <li>Chi phí vận chuyển hiển thị trên checkout.</li>
        </ul>
      </div>
    </div>
  )
}