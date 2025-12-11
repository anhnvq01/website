import React from 'react'

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
              🔄 Chính sách Đổi trả
            </h1>
            <p className="text-lg text-gray-600">
              Chúng tôi cam kết đảm bảo quyền lợi của khách hàng
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Section 1 */}
            <div className="p-8 border-b border-orange-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-orange-600">1</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Thời gian áp dụng
                  </h2>
                  <div className="bg-gradient-to-r from-orange-50 to-transparent p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      Hỗ trợ đổi trả trong <span className="font-semibold text-orange-600">24–48 giờ</span> kể từ khi nhận hàng.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="p-8 border-b border-orange-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-orange-600">2</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Trường hợp được đổi trả
                  </h2>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl leading-none mt-0.5">✓</span>
                      <span className="text-gray-700">Sản phẩm bị hỏng, lỗi kỹ thuật trong quá trình sản xuất hoặc vận chuyển.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl leading-none mt-0.5">✓</span>
                      <span className="text-gray-700">Sản phẩm không đúng mô tả, sai loại hoặc sai số lượng.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="p-8 border-b border-orange-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-orange-600">3</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Điều kiện đổi trả
                  </h2>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl leading-none mt-0.5">•</span>
                      <span className="text-gray-700">Sản phẩm <span className="font-semibold">còn nguyên bao bì, chưa sử dụng</span>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl leading-none mt-0.5">•</span>
                      <span className="text-gray-700">Khách hàng vui lòng <span className="font-semibold">quay video khi mở hàng</span> nhằm đảm bảo quyền lợi khi cần hỗ trợ.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold text-xl leading-none mt-0.5">•</span>
                      <span className="text-gray-700"><span className="font-semibold">Gửi kèm hình ảnh/video lỗi</span> để cửa hàng kiểm tra và xử lý nhanh chóng.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="p-8 bg-gradient-to-br from-orange-50 to-red-50">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-red-600">4</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Chi phí đổi trả
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <p className="font-semibold text-gray-800 mb-2">✅ Trường hợp lỗi từ cửa hàng:</p>
                      <p className="text-gray-700">Cửa hàng chịu toàn bộ phí đổi trả.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                      <p className="font-semibold text-gray-800 mb-2">💭 Trường hợp khách đổi ý:</p>
                      <p className="text-gray-700">Hỗ trợ đổi nhưng khách chịu phí vận chuyển (nếu có).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Cần hỗ trợ?</h3>
            <p className="mb-4">Liên hệ ngay với chúng tôi qua Hotline hoặc Messenger</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:0989948583" className="inline-block bg-white text-orange-600 font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                📞 098.994.8583
              </a>
              <a href="https://m.me/banlangdstb" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-blue-600 font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                💬 Messenger
              </a>
              <a href="https://zalo.me/0989948583" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-blue-600 font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                📱 Zalo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
