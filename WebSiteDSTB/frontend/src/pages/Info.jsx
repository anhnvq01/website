import React from 'react'
export default function Info(){
  return (
    <div className="container mx-auto p-4">
      {/* About Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-6 text-center text-green-700">Về Đặc Sản Sạch Tây Bắc</h2>
        
        <div className="bg-white rounded shadow p-6 mb-6">
          <p className="text-lg mb-4 leading-relaxed">
            <strong>Đặc Sản Sạch Tây Bắc</strong> là đơn vị mang những sản phẩm tinh túy nhất của núi rừng đến với người tiêu dùng trên toàn quốc. Chúng tôi hợp tác trực tiếp với bà con các bản làng, hộ gia đình và hợp tác xã uy tín tại Sơn La, Điện Biên, Lai Châu, Lào Cai… để mang đến những sản phẩm sạch – chuẩn vị – rõ nguồn gốc.
          </p>
          
          <p className="text-lg mb-6 leading-relaxed">
            Với mong muốn lan tỏa giá trị văn hóa và ẩm thực Tây Bắc, chúng tôi lựa chọn kỹ lưỡng từng đặc sản: từ thịt trâu gác bếp, lạp sườn hun khói, mắc khén – hạt dổi, cho đến mật ong rừng, chè tuyết cổ thụ, các loại mứt và gia vị núi rừng. Mỗi sản phẩm đều được chế biến theo phương pháp truyền thống, đảm bảo chất lượng, an toàn và giữ trọn hương vị đặc trưng.
          </p>
        </div>

        <div className="bg-green-50 rounded shadow p-6 mb-6">
          <h3 className="text-2xl font-semibold mb-4 text-green-700">Cam Kết Của Chúng Tôi</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span className="text-lg">100% hàng chuẩn Tây Bắc, không pha trộn, không hàng kém chất lượng</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span className="text-lg">Nguồn gốc minh bạch, thu mua trực tiếp từ người dân bản địa</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span className="text-lg">Đóng gói sạch sẽ – vận chuyển nhanh chóng</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span className="text-lg">Dịch vụ tận tâm, hỗ trợ đổi trả khi sản phẩm không đúng cam kết</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded shadow p-6 mb-6">
          <p className="text-lg leading-relaxed">
            Tại <strong>Đặc Sản Sạch Tây Bắc</strong>, mỗi sản phẩm không chỉ là món ăn, mà còn là câu chuyện của núi rừng – nơi lưu giữ tinh hoa văn hóa và tình cảm mộc mạc của con người Tây Bắc. Hãy để chúng tôi đồng hành cùng bạn trong hành trình khám phá những hương vị độc đáo và đầy cảm xúc ấy.
          </p>
        </div>
      </div>

      {/* Sales Policy Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-green-700">Chính sách bán hàng</h2>
        <div className="bg-white rounded shadow p-4">
          <ul className="list-disc pl-6 space-y-2">
            <li>Thanh toán: COD hoặc chuyển khoản trực tiếp.</li>
            <li>Hóa đơn lưu dưới 1 URL riêng. Sau khi khách thanh toán, quản trị viên đánh dấu 'Đã thanh toán' để cập nhật trạng thái.</li>
            <li>Chi phí vận chuyển hiển thị trên checkout.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}