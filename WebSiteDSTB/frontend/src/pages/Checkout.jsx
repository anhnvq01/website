import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Api from '../services/api'
import { PROVINCES, calculateShipping, canShipToProvince } from '../utils/provinces'

const parseWeight = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const cleaned = String(value).replace(',', '.').replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

function CheckoutOrderSummary({ cart, discount, province }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProductDetails = async () => {
      const enriched = await Promise.all(
        cart.map(async (it) => {
          try {
            const p = await Api.product(it.id)
            return { ...it, name: p.name, price: p.promo_price || p.price, weight: parseWeight(p.weight), can_ship_province: p.can_ship_province }
          } catch {
            return { ...it, name: it.id, price: 0, weight: 0, can_ship_province: 1 }
          }
        })
      )
      setItems(enriched)
      setLoading(false)
    }
    
    if (cart.length > 0) {
      loadProductDetails()
    } else {
      setLoading(false)
    }
  }, [cart])

  if (loading) {
    return <div className="text-gray-600">Đang tải...</div>
  }

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const totalWeight = items.reduce((s, it) => s + (it.weight || 0) * it.qty, 0)
  const shipping = calculateShipping(totalWeight, province || 'Hà Nội')
  const total = subtotal + shipping - Number(discount || 0)

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.id} className="flex justify-between items-center py-2 border-b">
          <div className="flex-1">
            <div className="font-medium">{it.name}</div>
            <div className="text-sm text-gray-600">SL: {it.qty}</div>
          </div>
          <div className="font-semibold">{(it.price * it.qty).toLocaleString()}₫</div>
        </div>
      ))}
      <div className="pt-3 space-y-2 border-t-2">
        <div className="flex justify-between">
          <span>Tạm tính:</span>
          <span className="font-semibold">{subtotal.toLocaleString()}₫</span>
        </div>
        <div className="flex justify-between">
          <span>Phí vận chuyển:</span>
          <span className="font-semibold">{shipping.toLocaleString()}₫</span>
        </div>
        {Number(discount) > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá:</span>
            <span className="font-semibold">-{Number(discount).toLocaleString()}₫</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Tổng cộng:</span>
          <span className="text-orange-600">{total.toLocaleString()}₫</span>
        </div>
      </div>
    </div>
  )
}

export default function Checkout(){
  const [cart, setCart] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [province, setProvince] = useState('Hà Nội')
  const [method, setMethod] = useState('COD')
  const [discount, setDiscount] = useState(0)
  const [phoneError, setPhoneError] = useState('')
  const [nameError, setNameError] = useState('')
  const [addressError, setAddressError] = useState('')
  const [provinceError, setProvinceError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()
  
  useEffect(()=> {
    const c = JSON.parse(localStorage.getItem('tb_cart')||'[]')
    setCart(c)
    
    // Load form data from localStorage
    const savedForm = JSON.parse(localStorage.getItem('tb_checkout_form')||'{}')
    if (savedForm.name) setName(savedForm.name)
    if (savedForm.phone) setPhone(savedForm.phone)
    if (savedForm.address) setAddress(savedForm.address)
    if (savedForm.province) setProvince(savedForm.province)
    if (savedForm.method) setMethod(savedForm.method)
  },[])
  
  // Save form data to localStorage on change
  useEffect(() => {
    localStorage.setItem('tb_checkout_form', JSON.stringify({
      name, phone, address, province, method
    }))
  }, [name, phone, address, province, method])
  
  async function submit(e){
    e.preventDefault()
    
    // Validate cart is not empty
    if (cart.length === 0) {
      setSuccessMessage('error')
      setTimeout(() => setSuccessMessage(''), 3000)
      return
    }
    
    // Validate name
    const trimmedName = name.trim()
    if (!trimmedName || /^\s+$/.test(name)) {
      setNameError('Vui lòng nhập họ tên')
      return
    }
    setNameError('')
    
    // Validate phone
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84)')
      return
    }
    setPhoneError('')
    
    // Validate address
    const trimmedAddress = address.trim()
    if (!trimmedAddress || /^\s+$/.test(address)) {
      setAddressError('Vui lòng nhập địa chỉ giao hàng')
      return
    }
    setAddressError('')
    
    // need to enrich cart with product details from backend
    const enriched = await Promise.all(cart.map(async it => {
      try { const p = await Api.product(it.id); return {...it, name: p.name, price: p.promo_price || p.price, weight: parseWeight(p.weight), can_ship_province: p.can_ship_province} } catch { return {...it, name: it.id, price: 0, weight: 0, can_ship_province: 1} }
    }))
    
    // Check if all products can be shipped to selected province
    if (province !== 'Hà Nội') {
      const cannotShip = enriched.filter(it => !canShipToProvince(it, province))
      if (cannotShip.length > 0) {
        const productNames = cannotShip.map(it => it.name).join(', ')
        setProvinceError(`Sản phẩm sau không giao được đến ${province}: ${productNames}. Vui lòng loại bỏ sản phẩm khỏi giỏ hàng.`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    setProvinceError('')
    
    const subtotal = enriched.reduce((s,it)=> s + it.price*it.qty, 0)
    const totalWeight = enriched.reduce((s,it)=> s + (it.weight || 0)*it.qty, 0)
    const shipping = calculateShipping(totalWeight, province)
    const total = subtotal + shipping - Number(discount||0)
    const payload = {
      customer: { name: trimmedName, phone, address: trimmedAddress, province },
      items: enriched,
      subtotal, shipping, discount: Number(discount||0), total, method
    }
    const res = await Api.createOrder(payload)
    
    // Clear cart and form data
    localStorage.removeItem('tb_cart')
    localStorage.removeItem('tb_checkout_form')
    
    // Show success message and scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSuccessMessage('success')
    
    // Redirect after showing message
    setTimeout(() => {
      navigate('/invoice/'+res.id+'?tab=order')
    }, 2000)
  }
  return (
    <div className="container mx-auto p-4">
      {successMessage === 'success' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full text-center transform animate-scale-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl text-green-600">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h3>
            <p className="text-gray-600 mb-4">Cảm ơn bạn đã đặt hàng. Vui lòng hoàn tất thanh toán để chúng tôi xử lý đơn hàng.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
              <span>Đang chuyển hướng...</span>
            </div>
          </div>
        </div>
      )}
      {successMessage === 'error' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl text-red-600">✕</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng rỗng!</h3>
            <p className="text-gray-600">Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.</p>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-semibold mb-4">Thanh toán</h2>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <label className="block text-gray-700 font-semibold mb-2">Họ tên <span className="text-red-600">*</span></label>
          <input 
            required 
            value={name} 
            onChange={e=>{setName(e.target.value); setNameError('')}} 
            className={`w-full p-2 border rounded my-1 ${nameError ? 'border-red-500 ring-2 ring-red-200' : ''}`}
          />
          {nameError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-2 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{nameError}</span>
            </div>
          )}
          
          <label className="block text-gray-700 font-semibold mb-2 mt-4">Số điện thoại <span className="text-red-600">*</span></label>
          <input 
            required 
            value={phone} 
            onChange={e=>{setPhone(e.target.value); setPhoneError('')}} 
            className={`w-full p-2 border rounded my-1 ${phoneError ? 'border-red-500 ring-2 ring-red-200' : ''}`}
          />
          {phoneError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-2 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{phoneError}</span>
            </div>
          )}
          
          <label className="block text-gray-700 font-semibold mb-2 mt-4">Địa chỉ <span className="text-red-600">*</span></label>
          <textarea 
            required 
            value={address} 
            onChange={e=>{setAddress(e.target.value); setAddressError('')}} 
            className={`w-full p-2 border rounded my-1 ${addressError ? 'border-red-500 ring-2 ring-red-200' : ''}`}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
          />
          {addressError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-2 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{addressError}</span>
            </div>
          )}
          
          <label className="block text-gray-700 font-semibold mb-2 mt-4">Tỉnh/Thành phố <span className="text-red-600">*</span></label>
          <select 
            required
            value={province} 
            onChange={e=>{setProvince(e.target.value); setProvinceError('')}} 
            className={`w-full p-2 border rounded my-1 ${provinceError ? 'border-red-500 ring-2 ring-red-200' : ''}`}
          >
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {provinceError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-2 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{provinceError}</span>
            </div>
          )}
          
          <label className="block text-gray-700 font-semibold mb-2 mt-4">Phương thức thanh toán</label>
          <select value={method} onChange={e=>setMethod(e.target.value)} className="w-full p-2 border rounded my-1">
            <option value="COD">COD (Thanh toán khi nhận hàng)</option>
            <option value="BANK">Chuyển khoản ngân hàng</option>
          </select>
          
          {/* Shipping info */}
          <div className="mt-4 bg-white border-l-4 border-orange-500 shadow-md rounded-r-lg p-4">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-base">
              🚚 Thông tin vận chuyển
            </h4>
            <div className="space-y-3 text-sm">
              <div className="bg-orange-50 rounded-lg p-3 border-l-2 border-orange-400">
                <div className="font-semibold text-orange-800 mb-1">▸ Nội thành Hà Nội</div>
                <div className="text-gray-700">
                  Giao hàng nhanh trong ngày, phí ship <span className="font-bold text-orange-600">Từ 30.000đ/đơn</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border-l-2 border-blue-400">
                <div className="font-semibold text-blue-800 mb-1">▸ Giao hàng liên tỉnh</div>
                <div className="text-gray-700">
                  • Đơn hàng ≤ 5kg: <span className="font-bold text-blue-600">35.000đ</span><br/>
                  • Đơn hàng &gt; 5kg: <span className="font-bold text-blue-600">7.000đ/kg</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 italic">
                💡 Lưu ý: Một số sản phẩm không giao được liên tỉnh. Hệ thống sẽ tự động kiểm tra khi bạn đặt hàng.
              </div>
            </div>
          </div>
          
          <div className="mt-4"><button className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-lg font-semibold">Xác nhận đặt hàng</button></div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold text-lg mb-4">Đơn hàng</h3>
          <CheckoutOrderSummary cart={cart} discount={discount} province={province} />
        </div>
      </form>
    </div>
  )
}