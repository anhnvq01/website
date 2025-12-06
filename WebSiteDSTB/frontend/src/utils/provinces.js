// Danh sách 34 tỉnh thành mới của Việt Nam (từ 12/6/2025)
export const PROVINCES = [
  'An Giang',
  'Bắc Ninh',
  'Cao Bằng',
  'Cần Thơ',
  'Cà Mau',
  'Đà Nẵng',
  'Đắk Lắk',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Tĩnh',
  'Hà Nội',
  'Hải Phòng',
  'Hồ Chí Minh',
  'Huế',
  'Hưng Yên',
  'Khánh Hoà',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Nghệ An',
  'Ninh Bình',
  'Phú Thọ',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sơn La',
  'Tây Ninh',
  'Thanh Hoá',
  'Thái Nguyên',
  'Tuyên Quang',
  'Vĩnh Long'
]

// Shipping cost calculation
export const calculateShipping = (totalWeight, province) => {
  // Nếu là Hà Nội, phí ship cố định 30k
  if (province === 'Hà Nội') {
    return 30000
  }
  
  // Nếu giao liên tỉnh
  // <= 5kg: 35,000đ
  // > 5kg: totalWeight * 7,000đ
  if (totalWeight <= 5) {
    return 35000
  }
  
  return Math.ceil(totalWeight) * 7000
}

// Check if product can be shipped to province
export const canShipToProvince = (product, province) => {
  // Nếu là Hà Nội, luôn giao được
  if (province === 'Hà Nội') {
    return true
  }
  
  // Nếu không phải Hà Nội, kiểm tra thuộc tính can_ship_province
  return product.can_ship_province === 1 || product.can_ship_province === true
}
