import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function OrderGuide(){
  const navigate = useNavigate()

  // Store current page as the referrer when entering OrderGuide
  useEffect(() => {
    sessionStorage.setItem('orderGuideReferrer', window.location.pathname)
  }, [])

  const handleContinueShopping = () => {
    // Get the previous page - if it was OrderGuide, go to home, otherwise go back
    const referrer = sessionStorage.getItem('orderGuideReferrer')
    sessionStorage.removeItem('orderGuideReferrer')
    
    if (referrer === '/order-guide' || !referrer) {
      navigate('/')
    } else {
      navigate(referrer)
    }
  }
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Hướng Dẫn Đặt Hàng Online</h1>
          <p className="text-blue-100 text-lg">Mua sắm dễ dàng, nhanh chóng và an toàn</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Steps Section */}
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-center">
              <div className="text-5xl font-bold text-white mb-2">1</div>
              <h3 className="text-xl font-bold text-white">Tìm Sản Phẩm</h3>
            </div>
            <div className="p-4">
              <div className="text-center mb-4 text-4xl">🔍</div>
              <p className="text-gray-700 text-center">
                Sử dụng thanh tìm kiếm hoặc duyệt theo danh mục để tìm sản phẩm yêu thích.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 text-center">
              <div className="text-5xl font-bold text-white mb-2">2</div>
              <h3 className="text-xl font-bold text-white">Thêm Vào Giỏ</h3>
            </div>
            <div className="p-4">
              <div className="text-center mb-4 text-4xl">🛒</div>
              <p className="text-gray-700 text-center">
                Bấm nút "Thêm vào giỏ" hoặc chọn số lượng rồi thêm vào giỏ hàng.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-5 text-center">
              <div className="text-5xl font-bold text-white mb-2">3</div>
              <h3 className="text-xl font-bold text-white">Kiểm Tra Đơn</h3>
            </div>
            <div className="p-4">
              <div className="text-center mb-4 text-4xl">✓</div>
              <p className="text-gray-700 text-center">
                Kiểm tra danh sách sản phẩm, số lượng và tính toán tổng tiền.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-5 text-center">
              <div className="text-5xl font-bold text-white mb-2">4</div>
              <h3 className="text-xl font-bold text-white">Thanh Toán</h3>
            </div>
            <div className="p-4">
              <div className="text-center mb-4 text-4xl">💳</div>
              <p className="text-gray-700 text-center">
                Nhập thông tin giao hàng và chọn phương thức thanh toán.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-5 text-center">Chi Tiết Các Bước</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Step 1 Detailed */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">Bước 1: Tìm Kiếm Sản Phẩm</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">→</span>
                  <span>Bấm vào thanh tìm kiếm 🔍 ở đầu trang</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">→</span>
                  <span>Nhập từ khóa sản phẩm bạn cần tìm</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">→</span>
                  <span>Hoặc chọn danh mục sản phẩm từ menu</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">→</span>
                  <span>Xem chi tiết từng sản phẩm bằng cách bấm vào</span>
                </li>
              </ul>
            </div>

            {/* Step 2 Detailed */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-2xl font-bold text-green-600 mb-4">Bước 2: Thêm Vào Giỏ Hàng</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-3">→</span>
                  <span>Chọn số lượng sản phẩm cần mua</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-3">→</span>
                  <span>Bấm nút "Thêm vào giỏ" 🛒</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-3">→</span>
                  <span>Tiếp tục mua hoặc xem giỏ hàng</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-3">→</span>
                  <span>Số lượng sản phẩm sẽ hiện trên icon giỏ hàng</span>
                </li>
              </ul>
            </div>

            {/* Step 3 Detailed */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-4">Bước 3: Kiểm Tra Đơn Hàng</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 font-bold mr-3">→</span>
                  <span>Bấm icon giỏ hàng 🛒 ở góc trên cùng bên phải</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 font-bold mr-3">→</span>
                  <span>Xem toàn bộ sản phẩm đã chọn</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 font-bold mr-3">→</span>
                  <span>Thay đổi số lượng hoặc xóa sản phẩm nếu cần</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 font-bold mr-3">→</span>
                  <span>Kiểm tra lại tổng tiền trước khi thanh toán</span>
                </li>
              </ul>
            </div>

            {/* Step 4 Detailed */}
            <div className="border-l-4 border-pink-500 pl-6">
              <h3 className="text-2xl font-bold text-pink-600 mb-4">Bước 4: Hoàn Tất Thanh Toán</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-pink-500 font-bold mr-3">→</span>
                  <span>Bấm nút "Thanh toán" từ trang giỏ hàng</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 font-bold mr-3">→</span>
                  <span>Điền đầy đủ thông tin giao hàng</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 font-bold mr-3">→</span>
                  <span>Chọn phương thức thanh toán: COD hoặc Chuyển khoản</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 font-bold mr-3">→</span>
                  <span>Bấm "Hoàn tất" để xác nhận đơn hàng</span>
                </li>
              </ul>
            </div>
          </div>
        </div>



        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-5 text-center">Câu Hỏi Thường Gặp</h2>
          
          <div className="space-y-6">
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">❓ Tôi có thể thay đổi đơn hàng sau khi đặt không?</h3>
              <p className="text-gray-700">
                Vâng, bạn có thể liên hệ với chúng tôi qua hotline <span className="font-bold text-pink-600">098.994.8583</span> trong vòng 1 giờ sau khi đặt hàng để thay đổi hoặc hủy đơn.
              </p>
            </div>

            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">❓ Hàng được giao trong bao lâu?</h3>
              <div className="text-gray-700 space-y-3">
                <div>
                  <p className="font-semibold text-blue-600 mb-2">📍 Nội Thành:</p>
                  <p>Giao hàng nhanh từ <span className="font-semibold">3-5 ngày</span>, phí ship <span className="font-semibold">từ 30.000đ/đơn</span></p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600 mb-2">📍 Liên Tỉnh:</p>
                  <p className="mb-2">Giao hàng từ <span className="font-semibold">5-7 ngày</span> với chi tiết phí ship:</p>
                  <ul className="ml-4 space-y-1">
                    <li>🚚 Đơn hàng ≤ 5kg: <span className="font-semibold">35.000đ</span></li>
                    <li>🚚 Đơn hàng {'>'} 5kg: <span className="font-semibold">7.000đ/kg</span></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">❓ Nếu tôi nhận được hàng lỗi thì sao?</h3>
              <p className="text-gray-700">
                Vui lòng liên hệ ngay với chúng tôi qua hotline hoặc zalo hoặc facebook trong vòng 24 giờ nhận hàng. Chúng tôi sẽ hỗ trợ đổi trả hoặc hoàn tiền.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">❓ Làm sao để liên hệ hỗ trợ?</h3>
              <p className="text-gray-700 mb-2">
                Hotline: <span className="font-bold text-blue-600">098.994.8583</span> 
              </p>
              <p className="text-gray-700">
                Hoặc liên hệ qua <span className="font-semibold text-blue-600">Messenger</span> và <span className="font-semibold text-blue-600">Zalo</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
