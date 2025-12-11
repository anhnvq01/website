import React from 'react'

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
              🚚 Chính sách Giao hàng
            </h1>
            <p className="text-lg text-gray-600">
              Giao hàng nhanh chóng, an toàn đến tay bạn
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Section 1 */}
            <div className="p-8 border-b border-blue-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Phạm vi giao hàng
                  </h2>
                  <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      Giao hàng <span className="font-semibold text-blue-600">toàn quốc</span> thông qua các đơn vị vận chuyển uy tín:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">📦 Viettel Post</span>
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">📦 GHTK</span>
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">📦 J&T</span>
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">🚀 Giao hàng nhanh</span>
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">⚡ Ahamove</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="p-8 border-b border-blue-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">2</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Thời gian giao hàng
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-transparent p-4 rounded-lg border-l-4 border-green-500">
                      <div className="font-semibold text-gray-800 mb-1">⚡ Nội thành Hà Nội</div>
                      <p className="text-gray-700"><span className="font-bold text-green-600">3–5 ngày</span></p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-transparent p-4 rounded-lg border-l-4 border-orange-500">
                      <div className="font-semibold text-gray-800 mb-1">🚗 Liên tỉnh</div>
                      <p className="text-gray-700"><span className="font-bold text-orange-600">5–7 ngày</span></p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 mt-4">
                      <p className="text-gray-700 text-sm">
                        <span className="font-semibold">⚠️ Lưu ý:</span> Thời gian có thể thay đổi tùy điều kiện thời tiết hoặc đơn vị vận chuyển.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-cyan-600">3</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Hình thức thanh toán
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                      <span className="text-2xl flex-shrink-0">💳</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Thanh toán khi nhận hàng (COD)</p>
                        <p className="text-gray-600 text-sm">Nhận hàng – kiểm tra – trả tiền tại chỗ</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                      <span className="text-2xl flex-shrink-0">🏦</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Chuyển khoản ngân hàng</p>
                        <p className="text-gray-600 text-sm">Thanh toán trước để ưu tiên xử lý đơn hàng</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-gray-800 mb-2">Đảm bảo an toàn</h3>
              <p className="text-gray-600 text-sm">Hàng được đóng gói cẩn thận, bảo vệ tuyệt đối</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-800 mb-2">Giao hàng nhanh</h3>
              <p className="text-gray-600 text-sm">Theo dõi vị trí hàng hóa theo thời gian thực</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="font-bold text-gray-800 mb-2">Hỗ trợ tích cực</h3>
              <p className="text-gray-600 text-sm">Liên hệ với chúng tôi nếu có bất kỳ vấn đề gì</p>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Cần tư vấn về vận chuyển?</h3>
            <p className="mb-4">Hãy liên hệ với chúng tôi, chúng tôi sẵn sàng giúp đỡ</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:0989948583" className="inline-block bg-white text-blue-600 font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
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
