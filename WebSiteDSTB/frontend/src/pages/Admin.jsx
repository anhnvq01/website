import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Api from '../services/api'

export default function Admin(){
  const [step, setStep] = useState('login') // login, dashboard, products, orders, add-product, edit-product
  const [user, setUser] = useState('admin')
  const [pass, setPass] = useState('password123')
  const [token, setToken] = useState('')
  const toastTimer = useRef(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, message: '', onConfirm: null })

  const showToast = (message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, message, type })
    toastTimer.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3200)
  }

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ visible: true, message, onConfirm })
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    if (savedToken) {
      setToken(savedToken)
      setStep('dashboard')
      loadProducts(savedToken)
      loadOrders(savedToken)
      loadStats(savedToken)
      loadCategories(savedToken)
    }
  }, [])

  // Product management
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    category: 'Thịt Gác Bếp',
    description: '',
    image: '',
    images: [],
    weight: '',
    promo_price: null
  })
  const [imagePreview, setImagePreview] = useState('https://via.placeholder.com/200x150?text=Ảnh+sản+phẩm')
  const [gallery, setGallery] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  // Order management
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [editOrderItems, setEditOrderItems] = useState([])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [stats, setStats] = useState({})
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    method: 'COD',
    shipping: 30000,
    discount: 0,
    paid: false
  })

  function parseImagesField(value, fallback) {
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return fallback ? parseImagesField(fallback) : []
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed
      } catch (err) {
        // ignore malformed JSON and fall back to other strategies
      }
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(s => s.trim()).filter(Boolean)
      }
      return [trimmed]
    }
    if (value) return [value]
    if (fallback) return parseImagesField(fallback)
    return []
  }

  async function login(e){
    e.preventDefault()
    try {
      const res = await Api.adminLogin(user, pass)
      setToken(res.token)
      localStorage.setItem('admin_token', res.token)
      setStep('dashboard')
      loadProducts(res.token)
      loadOrders(res.token)
      loadStats(res.token)
    } catch(e) { showToast('Đăng nhập thất bại', 'error') }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    setToken('')
    setStep('login')
  }

  async function loadProducts(tk) {
    try {
      const data = await Api.adminGetProducts(tk)
      const normalized = data.map(p => ({
        ...p,
        images: parseImagesField(p.images, p.image)
      }))
      setProducts(normalized)
    } catch(e) { console.error(e) }
  }

  async function loadOrders(tk) {
    try {
      const data = await Api.adminGetOrders(tk)
      console.log('Orders loaded:', data)
      setOrders(data)
    } catch(e) { console.error(e) }
  }

  async function loadStats(tk) {
    try {
      const day = await Api.adminGetStats(tk, 'day')
      const month = await Api.adminGetStats(tk, 'month')
      const year = await Api.adminGetStats(tk, 'year')
      setStats({ day, month, year })
    } catch(e) { console.error(e) }
  }

  async function loadCategories(tk) {
    try {
      const data = await Api.adminGetCategories(tk)
      setCategories(data)
    } catch(e) { 
      console.error(e)
      showToast('Lỗi tải danh mục', 'error')
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      setImagePreview(evt.target.result)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const result = await Api.adminUploadImage(token, file)
      setProductForm(prev => ({...prev, image: result.imageUrl}))
      setUploadedFile(file.name)
      showToast('Tải ảnh thành công!')
    } catch(err) {
      showToast('Lỗi tải ảnh: ' + (err.response?.data?.error || err.message), 'error')
    } finally {
      setUploading(false)
    }
  }

  async function saveProduct(e) {
    e.preventDefault()
    const payload = {
      ...productForm,
      images: gallery
    }
    if (!payload.image && gallery.length) {
      payload.image = gallery[0]
      setProductForm(prev => ({ ...prev, image: gallery[0] }))
    }
    if (!payload.image) {
      showToast('Vui lòng chọn ảnh đại diện', 'error')
      return
    }
    if (!payload.name || !payload.price) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }

    try {
      if (editingId) {
        await Api.adminUpdateProduct(token, editingId, payload)
        showToast('Cập nhật sản phẩm thành công')
      } else {
        await Api.adminAddProduct(token, payload)
        showToast('Thêm sản phẩm thành công')
        resetProductForm()
        setEditingId(null)
        loadProducts(token)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      resetProductForm()
      setEditingId(null)
      setStep('products')
      loadProducts(token)
    } catch(e){ showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
  }

  async function deleteProduct(id) {
    showConfirm('Xác nhận xóa sản phẩm này?', async () => {
      try {
        await Api.adminDeleteProduct(token, id)
        showToast('Xóa sản phẩm thành công')
        loadProducts(token)
      } catch(e) { showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
    })
  }

  async function editProduct(product) {
    const parsedImages = parseImagesField(product.images, product.image)
    const mainImage = product.image || parsedImages[0] || 'https://via.placeholder.com/200x150?text=Ảnh+sản+phẩm'
    setProductForm({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      image: mainImage,
      images: parsedImages,
      weight: product.weight || '',
      promo_price: product.promo_price ?? null
    })
    setGallery(parsedImages)
    setImagePreview(mainImage)
    setEditingId(product.id)
    setStep('edit-product')
  }

  function resetProductForm() {
    setProductForm({
      name: '',
      price: 0,
      category: 'Thịt Gác Bếp',
      description: '',
      image: '',
      images: [],
      weight: '',
      promo_price: null
    })
    setImagePreview('https://via.placeholder.com/200x150?text=Ảnh+sản+phẩm')
    setGallery([])
    setUploadedFile(null)
  }

  async function toggleOrderPaid(order) {
    const action = order.paid ? 'Chưa TT' : 'Đã TT'
    const newPaidStatus = !order.paid
    showConfirm(`Xác nhận cập nhật trạng thái đơn hàng thành "${action}"?`, async () => {
      try {
        let updated
        if (order.paid) {
          updated = await Api.adminMarkOrderUnpaid(token, order.id)
        } else {
          updated = await Api.adminMarkOrderPaid(token, order.id)
        }
        // Cập nhật ngay trong UI
        const newPaid = updated?.paid !== undefined ? updated.paid : newPaidStatus
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, paid: newPaid } : o))
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({ ...selectedOrder, paid: newPaid })
        }
        // Cập nhật số liệu
        loadStats(token)
        showToast(`Cập nhật trạng thái thành công: ${action}`)
      } catch(e) { showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
    })
  }

  async function deleteOrder(id) {
    showConfirm('Xác nhận xóa đơn hàng này?', async () => {
      try {
        await Api.adminDeleteOrder(token, id)
        showToast('Xóa đơn hàng thành công')
        setSelectedOrder(null)
        await loadOrders(token)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch(e) { showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
    })
  }

  async function addCategory() {
    if (!newCategoryName.trim()) {
      showToast('Tên danh mục không được để trống', 'error')
      return
    }
    try {
      await Api.adminAddCategory(token, newCategoryName.trim())
      setNewCategoryName('')
      await loadCategories(token)
      showToast('Thêm danh mục thành công')
    } catch(e) {
      showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error')
    }
  }

  async function updateCategory(id, newName) {
    if (!newName.trim()) {
      showToast('Tên danh mục không được để trống', 'error')
      return
    }
    try {
      await Api.adminUpdateCategory(token, id, newName.trim())
      setEditingCategoryId(null)
      await loadCategories(token)
      showToast('Cập nhật danh mục thành công')
    } catch(e) {
      showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error')
    }
  }

  async function deleteCategory(id) {
    showConfirm('Xác nhận xóa danh mục này?', async () => {
      try {
        await Api.adminDeleteCategory(token, id)
        await loadCategories(token)
        showToast('Xóa danh mục thành công')
      } catch(e) {
        showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error')
      }
    })
  }

  function logout() {
    localStorage.removeItem('admin_token')
    setToken('')
    setStep('login')
    setProducts([])
    setOrders([])
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('storage'))
  }

  // Order item management
  function addOrderItem(productId = null) {
    const newItem = {
      id: productId || '',
      name: '',
      price: 0,
      qty: 1
    }
    
    // If selecting existing product, auto-fill info
    if (productId) {
      const product = products.find(p => p.id === productId)
      if (product) {
        newItem.name = product.name
        newItem.price = product.promo_price || product.price
      }
    }
    
    setOrderItems([...orderItems, newItem])
  }

  function updateOrderItem(index, field, value) {
    const updated = [...orderItems]
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        updated[index].id = value
        updated[index].name = product.name
        updated[index].price = product.promo_price || product.price
      }
    } else {
      updated[index][field] = value
    }
    setOrderItems(updated)
  }

  function removeOrderItem(index) {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  async function saveOrder(e) {
    e.preventDefault()
    
    if (!orderForm.customer_name || !orderForm.customer_phone) {
      showToast('Vui lòng điền tên và SĐT khách', 'error')
      return
    }
    
    if (orderItems.length === 0) {
      showToast('Vui lòng thêm ít nhất 1 sản phẩm', 'error')
      return
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const total = subtotal + orderForm.shipping - orderForm.discount

    try {
      if (editingOrderId) {
        await Api.adminUpdateOrder(token, editingOrderId, {
          customer_name: orderForm.customer_name,
          customer_phone: orderForm.customer_phone,
          customer_address: orderForm.customer_address,
          items_json: orderItems,
          subtotal,
          shipping: orderForm.shipping,
          discount: orderForm.discount,
          total,
          method: orderForm.method,
          paid: orderForm.paid
        })
        showToast('Cập nhật đơn hàng thành công')
      } else {
        await Api.adminCreateOrder(token, {
          customer_name: orderForm.customer_name,
          customer_phone: orderForm.customer_phone,
          customer_address: orderForm.customer_address,
          items_json: orderItems,
          subtotal,
          shipping: orderForm.shipping,
          discount: orderForm.discount,
          total,
          method: orderForm.method,
          paid: orderForm.paid
        })
        showToast('Tạo đơn hàng thành công')
      }
      setOrderForm({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        method: 'COD',
        shipping: 30000,
        discount: 0,
        paid: false
      })
      setOrderItems([])
      setEditingOrderId(null)
      setStep('orders')
      await loadOrders(token)
      await loadStats(token)
    } catch(e) { showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
  }

  function startEditOrder(order) {
    setEditingOrderId(order.id)
    setOrderForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      method: order.method || 'COD',
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      paid: !!order.paid
    })
    setOrderItems(order.items_json || [])
    setStep('add-order')
  }

  // Confirm dialog overlay
  const ConfirmDialog = () => {
    if (!confirmDialog.visible) return null
    return (
      <div className="fixed inset-0 z-[10000] overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmDialog({ visible: false, message: '', onConfirm: null })}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <p className="text-lg text-gray-800 font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmDialog({ visible: false, message: '', onConfirm: null })
                }}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm()
                  setConfirmDialog({ visible: false, message: '', onConfirm: null })
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Toast notification overlay
  const ToastNotification = () => {
    if (!toast.visible) return null
    const bgGradient = toast.type === 'error' 
      ? 'from-red-600 to-red-700' 
      : 'from-green-600 to-green-700'
    return (
      <div className="fixed z-[9999] top-4 left-1/2 -translate-x-1/2 w-auto max-w-md">
        <div className={`bg-gradient-to-r ${bgGradient} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl animate-slide-in-down flex items-center gap-2 sm:gap-3 border-2 border-white`}>
          <span className="text-2xl sm:text-3xl">{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <div className="font-bold text-base sm:text-lg">{toast.message}</div>
        </div>
      </div>
    )
  }

  // Login Screen
  if(step === 'login') return (
    <div className="container mx-auto p-4">
      <ConfirmDialog />
      <ToastNotification />
      <div className="max-w-md mx-auto bg-white rounded shadow p-6 mt-10">
        <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">Đăng nhập Quản Trị Viên</h3>
        <form onSubmit={login}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Tên đăng nhập</label>
            <input value={user} onChange={e=>setUser(e.target.value)} className="w-full p-3 text-base border rounded" placeholder="admin"/>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Mật khẩu</label>
            <input value={pass} onChange={e=>setPass(e.target.value)} type="password" className="w-full p-3 text-base border rounded" placeholder="password123"/>
          </div>
          <button className="w-full bg-green-700 text-white px-4 py-3 text-base rounded hover:bg-green-800">Đăng nhập</button>
        </form>
      </div>
    </div>
  )

  // Dashboard
  return (
    <div className="container mx-auto p-4">
      <ConfirmDialog />
      <ToastNotification />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trang quản trị</h1>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        <button 
          onClick={() => { setStep('dashboard'); loadStats(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'dashboard' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          📊 Tổng Quan
        </button>
        
        <button 
          onClick={() => { setStep('products'); loadProducts(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'products' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          📦 Quản Lý Sản Phẩm
        </button>
        <button 
          onClick={() => { setStep('orders'); loadOrders(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'orders' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          🛒 Quản Lý Đơn Hàng
        </button>
        <button 
          onClick={() => { setStep('categories'); loadCategories(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'categories' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          🏷️ Danh Mục
        </button>
      </div>

      {/* Dashboard Overview */}
      {step === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards - 5 cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-blue-100 font-medium text-xs uppercase tracking-wide">Tổng SP</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.totalProducts || products.length}</p>
                </div>
                <div className="text-4xl opacity-20">📦</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-orange-100 font-medium text-xs uppercase tracking-wide">Tổng Đơn Đã Đặt</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.totalOrders || orders.length}</p>
                </div>
                <div className="text-4xl opacity-20">🛒</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-yellow-100 font-medium text-xs uppercase tracking-wide">Chưa Giao</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.undeliveredOrders || 0}</p>
                </div>
                <div className="text-4xl opacity-20">📦</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-purple-100 font-medium text-xs uppercase tracking-wide">Đã Giao Chưa TT</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.unpaidDeliveredOrders || 0}</p>
                </div>
                <div className="text-4xl opacity-20">💰</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-red-100 font-medium text-xs uppercase tracking-wide">Đơn Bom</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.bomOrders || 0}</p>
                </div>
                <div className="text-4xl opacity-20">💣</div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>💰</span> Doanh Thu & Lợi Nhuận
            </h3>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Chart */}
              <div>
                <div className="mb-4 text-sm text-gray-600 font-medium">Biểu đồ so sánh (VNĐ)</div>
                <div className="w-full bg-gray-50 rounded-lg p-6">
                  {(() => {
                    const labels = ['Hôm nay','Tháng','Năm']
                    const data = [stats.day?.revenue || 0, stats.month?.revenue || 0, stats.year?.revenue || 0]
                    const profit = [stats.day?.profit || 0, stats.month?.profit || 0, stats.year?.profit || 0]
                    const max = Math.max(...data, ...profit, 1)
                    const chartW = 400
                    const chartH = 200
                    const barW = 40
                    const gap = 30
                    const totalW = labels.length * (barW * 2 + gap + 10)
                    const startX = Math.max(20, (chartW - totalW) / 2)
                    return (
                      <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
                        {/* grid lines */}
                        {[0.25,0.5,0.75,1].map((p,i) => (
                          <g key={i}>
                            <line x1="0" x2={chartW} y1={chartH - p*chartH} y2={chartH - p*chartH} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                          </g>
                        ))}
                        {labels.map((lab, i) => {
                          const rx = startX + i * (barW*2 + gap + 10)
                          const revH = Math.max(5, Math.round((data[i] / max) * (chartH - 40)))
                          const profH = Math.max(5, Math.round((profit[i] / max) * (chartH - 40)))
                          return (
                            <g key={i}>
                              {/* Revenue bar */}
                              <rect x={rx} y={chartH - revH - 30} width={barW} height={revH} fill="#f59e0b" rx="4">
                                <animate attributeName="height" from="0" to={revH} dur="0.8s" fill="freeze" />
                                <animate attributeName="y" from={chartH - 30} to={chartH - revH - 30} dur="0.8s" fill="freeze" />
                              </rect>
                              {/* Profit bar */}
                              <rect x={rx + barW + 6} y={chartH - profH - 30} width={barW} height={profH} fill="#10b981" rx="4">
                                <animate attributeName="height" from="0" to={profH} dur="0.8s" fill="freeze" />
                                <animate attributeName="y" from={chartH - 30} to={chartH - profH - 30} dur="0.8s" fill="freeze" />
                              </rect>
                              {/* Label */}
                              <text x={rx + barW + 3} y={chartH - 10} fontSize="14" fontWeight="600" textAnchor="middle" fill="#374151">{lab}</text>
                            </g>
                          )
                        })}
                      </svg>
                    )
                  })()}
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-500 rounded"></span>
                    <span className="font-medium text-gray-700">Doanh thu</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded"></span>
                    <span className="font-medium text-gray-700">Lợi nhuận</span>
                  </span>
                </div>
              </div>

              {/* Stats Details */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border-l-4 border-orange-500">
                  <div className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-2">Hôm nay</div>
                  <div className="text-2xl font-bold text-orange-700">{(stats.day?.revenue || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.day?.profit || 0).toLocaleString()}₫</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-500">
                  <div className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">Tháng này</div>
                  <div className="text-2xl font-bold text-purple-700">{(stats.month?.revenue || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.month?.profit || 0).toLocaleString()}₫</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">Năm này</div>
                  <div className="text-2xl font-bold text-blue-700">{(stats.year?.revenue || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.year?.profit || 0).toLocaleString()}₫</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Management */}
      {step === 'products' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Quản Lý Sản Phẩm</h2>
            <button 
              onClick={() => { resetProductForm(); setEditingId(null); setStep('add-product') }}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            >
              ➕ Thêm Sản Phẩm
            </button>
          </div>

          {products.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center rounded">
              <p className="text-gray-600">Chưa có sản phẩm nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded shadow">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Tên</th>
                    <th className="px-4 py-2 text-right">Giá</th>
                    <th className="px-4 py-2 text-left">Danh Mục</th>
                    <th className="px-4 py-2 text-right">KM</th>
                    <th className="px-4 py-2 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-sm">{p.id}</td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2 text-right font-medium">{p.price.toLocaleString()}₫</td>
                      <td className="px-4 py-2 text-sm">{p.category}</td>
                      <td className="px-4 py-2 text-right text-orange-600 font-medium">{p.promo_price ? p.promo_price.toLocaleString() + '₫' : '-'}</td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          onClick={() => editProduct(p)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-2"
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          onClick={() => deleteProduct(p.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Product */}
      {(step === 'add-product' || step === 'edit-product') && (
        <div className="max-w-2xl bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-6">{editingId ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
          <form onSubmit={saveProduct} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Tên sản phẩm *</label>
                <input 
                  value={productForm.name} 
                  onChange={e=>setProductForm({...productForm, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Giá (₫) *</label>
                <input 
                  type="number" 
                  value={productForm.price} 
                  onChange={e=>setProductForm({...productForm, price: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Danh mục</label>
                <select 
                  value={productForm.category} 
                  onChange={e=>setProductForm({...productForm, category: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  {categories.map(cat => (
                    <option key={cat.rowid} value={cat.category}>{cat.category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Trọng lượng</label>
                <input 
                  value={productForm.weight} 
                  onChange={e=>setProductForm({...productForm, weight: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="200g, 500ml..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Giá khuyến mãi (₫)</label>
                <input 
                  type="number" 
                  value={productForm.promo_price || ''} 
                  onChange={e=>setProductForm({...productForm, promo_price: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Mô tả</label>
              <textarea 
                value={productForm.description} 
                onChange={e=>setProductForm({...productForm, description: e.target.value})}
                className="w-full p-2 border rounded h-24"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Ảnh mô tả (nhiều ảnh)</label>
              <div className="border rounded p-2">
                {gallery.length === 0 ? (
                  <div className="text-sm text-gray-500">Chưa có ảnh mô tả</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {gallery.map((url, idx)=> (
                      <div key={idx} className="relative">
                        <img src={url} className="w-20 h-20 object-cover rounded border"/>
                        <button
                          type="button"
                          onClick={()=>{
                            const next = gallery.filter((_,i)=> i!==idx)
                            setGallery(next)
                            setProductForm({...productForm, images: next})
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <input type="file" accept="image/*" multiple onChange={async (e)=>{
                    const files = Array.from(e.target.files||[])
                    if(files.length===0) return
                    setUploading(true)
                    try {
                      const uploadedUrls = []
                      for(const f of files){
                        const res = await Api.adminUploadImage(token, f)
                        uploadedUrls.push(res.imageUrl)
                      }
                      const next = [...gallery, ...uploadedUrls]
                      setGallery(next)
                      setProductForm(prev => ({...prev, images: next}))
                    } catch(err){ showToast('Upload ảnh mô tả thất bại', 'error') } finally { setUploading(false) }
                  }} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Ảnh đại diện</label>
              <div className="border-2 border-dashed border-gray-300 rounded p-4">
                <div className="mb-3">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded"/>
                </div>
                <label className="block cursor-pointer">
                  <span className="bg-blue-500 text-white px-3 py-2 rounded inline-block hover:bg-blue-600 disabled:bg-gray-400">
                    {uploading ? 'Đang tải...' : uploadedFile ? '✓ Chọn ảnh khác' : 'Chọn ảnh'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploadedFile && <p className="text-sm text-green-600 mt-2">✓ {uploadedFile}</p>}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex-1">
                💾 {editingId ? 'Cập Nhật' : 'Thêm'} Sản Phẩm
              </button>
              <button 
                type="button"
                onClick={() => setStep('products')}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Order */}
      {step === 'add-order' && (
        <div className="max-w-4xl bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-6">Thêm Đơn Hàng Mới</h2>
          <form onSubmit={saveOrder} className="space-y-6">
            {/* Customer Info */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Thông Tin Khách Hàng</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Tên khách *</label>
                  <input 
                    value={orderForm.customer_name}
                    onChange={e=>setOrderForm({...orderForm, customer_name: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Số điện thoại *</label>
                  <input 
                    value={orderForm.customer_phone}
                    onChange={e=>setOrderForm({...orderForm, customer_phone: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Địa chỉ</label>
                  <input 
                    value={orderForm.customer_address}
                    onChange={e=>setOrderForm({...orderForm, customer_address: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Danh Sách Sản Phẩm</h3>
                <button 
                  type="button"
                  onClick={() => addOrderItem()}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Thêm Sản Phẩm
                </button>
              </div>

              {orderItems.length === 0 ? (
                <div className="text-gray-500 text-center py-4">Chưa có sản phẩm nào</div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-end bg-gray-50 p-3 rounded">
                      <div className="flex-1">
                        <label className="block text-gray-700 font-medium mb-1 text-sm">Sản Phẩm</label>
                        <select 
                          value={item.id}
                          onChange={e=>updateOrderItem(i, 'productId', e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="">-- Chọn sản phẩm hoặc tự thêm --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({(p.promo_price || p.price).toLocaleString()}₫)</option>
                          ))}
                        </select>
                      </div>
                      {!item.id && (
                        <>
                          <div className="flex-1">
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Tên</label>
                            <input 
                              value={item.name}
                              onChange={e=>updateOrderItem(i, 'name', e.target.value)}
                              className="w-full p-2 border rounded text-sm"
                              placeholder="Tên sản phẩm"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Giá</label>
                            <input 
                              type="number"
                              value={item.price}
                              onChange={e=>updateOrderItem(i, 'price', parseInt(e.target.value) || 0)}
                              className="w-full p-2 border rounded text-sm"
                            />
                          </div>
                        </>
                      )}
                      <div className="w-20">
                        <label className="block text-gray-700 font-medium mb-1 text-sm">SL</label>
                        <input 
                          type="number"
                          value={item.qty}
                          onChange={e=>updateOrderItem(i, 'qty', parseInt(e.target.value) || 1)}
                          className="w-full p-2 border rounded text-sm"
                          min="1"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeOrderItem(i)}
                        className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Thanh Toán</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Phương Thức</label>
                  <select 
                    value={orderForm.method}
                    onChange={e=>setOrderForm({...orderForm, method: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option>COD</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Vận Chuyển (₫)</label>
                  <input 
                    type="number"
                    value={orderForm.shipping}
                    onChange={e=>setOrderForm({...orderForm, shipping: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Giảm Giá (₫)</label>
                  <input 
                    type="number"
                    value={orderForm.discount}
                    onChange={e=>setOrderForm({...orderForm, discount: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium mt-6">
                    <input 
                      type="checkbox"
                      checked={orderForm.paid}
                      onChange={e=>setOrderForm({...orderForm, paid: e.target.checked})}
                    />
                    Đã thanh toán
                  </label>
                </div>
              </div>
            </div>

            {/* Summary */}
            {orderItems.length > 0 && (
              <div className="bg-orange-50 p-4 rounded">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tạm tính</p>
                    <p className="text-lg font-bold">{orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString()}₫</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Vận chuyển</p>
                    <p className="text-lg font-bold">{orderForm.shipping.toLocaleString()}₫</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Giảm giá</p>
                    <p className="text-lg font-bold">-{orderForm.discount.toLocaleString()}₫</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Tổng cộng</p>
                    <p className="text-xl font-bold text-orange-600">{(orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0) + orderForm.shipping - orderForm.discount).toLocaleString()}₫</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex-1">
                💾 Tạo Đơn Hàng
              </button>
              <button 
                type="button"
                onClick={() => { setStep('orders'); setEditingOrderId(null) }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
      {step === 'orders' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Quản Lý Đơn Hàng</h2>
            <button 
              onClick={() => { setOrderForm({ customer_name: '', customer_phone: '', customer_address: '', method: 'COD', shipping: 30000, discount: 0, paid: false }); setOrderItems([]); setStep('add-order') }}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            >
              ➕ Thêm Đơn Hàng
            </button>
          </div>

          {selectedOrder ? (
            <div className="bg-white p-6 rounded shadow max-w-3xl">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="mb-4 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                ← Quay Lại
              </button>

              <h3 className="text-xl font-semibold mb-4">Chi tiết đơn hàng #{selectedOrder.id}</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-700 mb-2">Thông tin khách</h4>
                  <p><strong>Tên:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>SĐT:</strong> {selectedOrder.customer_phone}</p>
                  <p><strong>Địa chỉ:</strong> {selectedOrder.customer_address}</p>
                  <p><strong>Ngày:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-700 mb-2">Thanh toán</h4>
                  <p><strong>Phương thức:</strong> {selectedOrder.method}</p>
                  <p><strong>Tạm tính:</strong> {selectedOrder.subtotal?.toLocaleString()}₫</p>
                  <p><strong>Vận chuyển:</strong> {selectedOrder.shipping?.toLocaleString()}₫</p>
                  {Number(selectedOrder.discount) > 0 && (
                    <p><strong>Giảm:</strong> {Number(selectedOrder.discount).toLocaleString()}₫</p>
                  )}
                  <p className="text-lg font-bold text-orange-600 mt-2"><strong>Tổng:</strong> {selectedOrder.total?.toLocaleString()}₫</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Danh sách sản phẩm</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Sản phẩm</th>
                        <th className="px-3 py-2 text-right">SL</th>
                        <th className="px-3 py-2 text-right">Giá</th>
                        <th className="px-3 py-2 text-right">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items_json?.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2 text-right">{item.qty}</td>
                          <td className="px-3 py-2 text-right">{item.price?.toLocaleString()}₫</td>
                          <td className="px-3 py-2 text-right">{(item.qty * (item.price || 0)).toLocaleString()}₫</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 bg-yellow-50 p-4 rounded mb-6">
                <span className={`px-3 py-1 rounded text-white font-medium ${selectedOrder.paid ? 'bg-green-600' : 'bg-red-600'}`}>
                  {selectedOrder.paid ? '✓ Đã thanh toán' : '✗ Chưa thanh toán'}
                </span>
                <span className={`px-3 py-1 rounded text-white font-medium ${
                  selectedOrder.status === 'delivered' ? 'bg-green-600' :
                  selectedOrder.status === 'tomorrow_delivery' ? 'bg-blue-600' :
                  selectedOrder.status === 'cancelled' ? 'bg-gray-600' :
                  selectedOrder.status === 'bom' ? 'bg-red-600' :
                  'bg-yellow-600'
                }`}>
                  {selectedOrder.status === 'delivered' ? '📦 Đã giao' :
                   selectedOrder.status === 'tomorrow_delivery' ? '🚚 Giao ngày mai' :
                   selectedOrder.status === 'cancelled' ? '❌ Đã hủy' :
                   selectedOrder.status === 'bom' ? '💣 Bom hàng' :
                   '⏳ Chưa giao'}
                </span>
              </div>

              {isEditingOrder ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-lg mb-4 text-blue-900">✏️ Chỉnh sửa đơn hàng</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách</label>
                      <input className="w-full p-2 border rounded" value={selectedOrder.customer_name || ''} onChange={e=>setSelectedOrder(s=>({...s, customer_name: e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
                      <input className="w-full p-2 border rounded" value={selectedOrder.customer_phone || ''} onChange={e=>setSelectedOrder(s=>({...s, customer_phone: e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input className="w-full p-2 border rounded" value={selectedOrder.customer_address || ''} onChange={e=>setSelectedOrder(s=>({...s, customer_address: e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức</label>
                      <select className="w-full p-2 border rounded" value={selectedOrder.method || 'COD'} onChange={e=>setSelectedOrder(s=>({...s, method: e.target.value}))}>
                        <option value="COD">COD</option>
                        <option value="BANK">Chuyển khoản</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vận chuyển (₫)</label>
                      <input type="number" className="w-full p-2 border rounded" value={selectedOrder.shipping || 0} onChange={e=>setSelectedOrder(s=>({...s, shipping: Number(e.target.value||0)}))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (₫)</label>
                      <input type="number" className="w-full p-2 border rounded" value={selectedOrder.discount || 0} onChange={e=>setSelectedOrder(s=>({...s, discount: Number(e.target.value||0)}))} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Danh sách sản phẩm</label>
                      <button
                        onClick={() => setEditOrderItems([...editOrderItems, { id: '', name: '', price: 0, qty: 1 }])}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        ➕ Thêm SP
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editOrderItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2 rounded border">
                          <div className="col-span-5">
                            <input
                              placeholder="Tên sản phẩm"
                              className="w-full p-1 text-sm border rounded"
                              value={item.name}
                              onChange={e => {
                                const next = [...editOrderItems]
                                next[idx].name = e.target.value
                                setEditOrderItems(next)
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="SL"
                              className="w-full p-1 text-sm border rounded"
                              value={item.qty}
                              onChange={e => {
                                const next = [...editOrderItems]
                                next[idx].qty = Number(e.target.value) || 1
                                setEditOrderItems(next)
                              }}
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              placeholder="Giá"
                              className="w-full p-1 text-sm border rounded"
                              value={item.price}
                              onChange={e => {
                                const next = [...editOrderItems]
                                next[idx].price = Number(e.target.value) || 0
                                setEditOrderItems(next)
                              }}
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <span className="text-xs font-medium">{(item.qty * item.price).toLocaleString()}₫</span>
                            <button
                              onClick={() => setEditOrderItems(editOrderItems.filter((_, i) => i !== idx))}
                              className="text-red-600 hover:text-red-800 text-lg"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Tạm tính:</span>
                      <span className="font-medium">{editOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString()}₫</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Vận chuyển:</span>
                      <span className="font-medium">{(selectedOrder.shipping || 0).toLocaleString()}₫</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{(selectedOrder.discount || 0).toLocaleString()}₫</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-orange-600 mt-2 pt-2 border-t">
                      <span>Tổng cộng:</span>
                      <span>{(editOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0) + (selectedOrder.shipping || 0) - (selectedOrder.discount || 0)).toLocaleString()}₫</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const subtotal = editOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
                          const total = subtotal + (selectedOrder.shipping || 0) - (selectedOrder.discount || 0)
                          const payload = {
                            customer_name: selectedOrder.customer_name,
                            customer_phone: selectedOrder.customer_phone,
                            customer_address: selectedOrder.customer_address,
                            method: selectedOrder.method,
                            items_json: editOrderItems,
                            subtotal,
                            shipping: selectedOrder.shipping || 0,
                            discount: selectedOrder.discount || 0,
                            total,
                            paid: selectedOrder.paid,
                            status: selectedOrder.status || 'undelivered'
                          }
                          await Api.adminUpdateOrder(token, selectedOrder.id, payload)
                          await loadOrders(token)
                          const updated = orders.find(o => o.id === selectedOrder.id) || selectedOrder
                          setSelectedOrder({...updated, items_json: editOrderItems})
                          setIsEditingOrder(false)
                          showToast('Đã cập nhật đơn hàng')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        } catch(e) {
                          showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error')
                        }
                      }}
                      className="flex-1 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 font-medium"
                    >
                      💾 Lưu thay đổi
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingOrder(false)
                        setEditOrderItems(selectedOrder.items_json || [])
                      }}
                      className="px-4 py-2 rounded text-white bg-gray-500 hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setIsEditingOrder(true)
                    setEditOrderItems(selectedOrder.items_json || [])
                  }}
                  className="px-4 py-2 rounded text-white bg-orange-600 hover:bg-orange-700 font-medium"
                >
                  ✏️ Chỉnh Sửa Đơn Hàng
                </button>
                <Link 
                  to={`/invoice/${selectedOrder.id}`}
                  target="_blank"
                  className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  📄 Xem Hóa Đơn
                </Link>
                <button 
                  onClick={async () => {
                    await toggleOrderPaid(selectedOrder)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`px-4 py-2 rounded text-white ${selectedOrder.paid ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {selectedOrder.paid ? '❌ Chưa TT' : '✅ Đã TT'}
                </button>
                <button 
                  onClick={() => {
                    setNewStatus(selectedOrder.status || 'undelivered')
                    setIsUpdatingStatus(true)
                  }}
                  className="px-4 py-2 rounded text-white bg-purple-600 hover:bg-purple-700 font-medium"
                >
                  📋 Cập Nhật Trạng Thái
                </button>
                <button 
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ) : (
            <div>
              {orders.length === 0 ? (
                <div className="bg-gray-50 p-8 text-center rounded">
                  <p className="text-gray-600">Chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded shadow">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Khách</th>
                        <th className="px-4 py-2 text-right">Tổng</th>
                        <th className="px-4 py-2 text-center">Trạng Thái</th>
                        <th className="px-4 py-2 text-left">Ngày</th>
                        <th className="px-4 py-2 text-center">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders
                        .sort((a, b) => {
                          const priority = {
                            'tomorrow_delivery': 1,
                            'delivered': 2,
                            'undelivered': 3,
                            'bom': 4,
                            'cancelled': 5
                          }
                          const aPri = priority[a.status] || 3
                          const bPri = priority[b.status] || 3
                          if (aPri !== bPri) return aPri - bPri
                          return new Date(b.createdAt) - new Date(a.createdAt)
                        })
                        .map(o => (
                        <tr key={o.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-sm">{o.id}</td>
                          <td className="px-4 py-2">{o.customer_name}</td>
                          <td className="px-4 py-2 text-right font-medium text-orange-600">{o.total?.toLocaleString()}₫</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <span className={`px-2 py-1 rounded text-white text-xs font-medium ${o.paid ? 'bg-green-600' : 'bg-red-600'}`}>
                                {o.paid ? '✓ TT' : '✗ Chưa TT'}
                              </span>
                              <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                                o.status === 'delivered' ? 'bg-green-600' :
                                o.status === 'tomorrow_delivery' ? 'bg-blue-600' :
                                o.status === 'cancelled' ? 'bg-gray-600' :
                                o.status === 'bom' ? 'bg-red-600' :
                                'bg-yellow-600'
                              }`}>
                                {o.status === 'delivered' ? '📦 Đã giao' :
                                 o.status === 'tomorrow_delivery' ? '🚚 Giao mai' :
                                 o.status === 'cancelled' ? '❌ Hủy' :
                                 o.status === 'bom' ? '💣 Bom' :
                                 '⏳ Chưa giao'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-2 text-center">
                            <button 
                              onClick={async () => {
                                try {
                                  const fullOrder = await Api.adminGetOrder(token, o.id)
                                  setSelectedOrder(fullOrder)
                                } catch(e) {
                                  console.error('Error loading order:', e)
                                  setSelectedOrder(o)
                                }
                              }}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              👁️ Chi Tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {isUpdatingStatus && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Cập Nhật Trạng Thái Đơn Hàng</h3>
            <p className="text-sm text-gray-600 mb-4">Đơn hàng: <span className="font-mono font-bold">{selectedOrder.id}</span></p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="undelivered">⏳ Chưa giao</option>
                <option value="tomorrow_delivery">🚚 Giao ngày mai</option>
                <option value="delivered">📦 Đã giao</option>
                <option value="bom">💣 Đơn bom</option>
                <option value="cancelled">❌ Hủy đơn</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    console.log('Updating order status:', selectedOrder.id, newStatus)
                    const payload = { status: newStatus }
                    console.log('Sending payload:', payload)
                    await Api.adminUpdateOrder(token, selectedOrder.id, payload)
                    console.log('Update successful')
                    const updated = { ...selectedOrder, status: newStatus }
                    setSelectedOrder(updated)
                    setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o))
                    setIsUpdatingStatus(false)
                    showToast(`✅ Cập nhật trạng thái thành công`, 'success')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } catch (error) {
                    console.error('Update error:', error)
                    showToast(`❌ Lỗi: ${error.message}`, 'error')
                  }
                }}
                className="flex-1 px-4 py-2 rounded text-white bg-purple-600 hover:bg-purple-700 font-medium"
              >
                💾 Cập Nhật
              </button>
              <button
                onClick={() => setIsUpdatingStatus(false)}
                className="flex-1 px-4 py-2 rounded text-white bg-gray-400 hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management */}
      {step === 'categories' && (
        <div>
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-2xl font-bold mb-4">Quản Lý Danh Mục</h2>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Nhập tên danh mục mới..."
                className="flex-1 px-4 py-2 border rounded"
                onKeyPress={e => e.key === 'Enter' && addCategory()}
              />
              <button 
                onClick={addCategory}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
              >
                ➕ Thêm Danh Mục
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded">
                <p className="text-gray-600">Chưa có danh mục nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Danh Mục</th>
                      <th className="px-4 py-2 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.rowid} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {editingCategoryId === cat.rowid ? (
                            <input 
                              type="text" 
                              defaultValue={cat.category}
                              onBlur={e => updateCategory(cat.rowid, e.target.value)}
                              onKeyPress={e => {
                                if (e.key === 'Enter') updateCategory(cat.rowid, e.target.value)
                                if (e.key === 'Escape') setEditingCategoryId(null)
                              }}
                              autoFocus
                              className="px-2 py-1 border rounded w-full"
                            />
                          ) : (
                            cat.category
                          )}
                        </td>
                        <td className="px-4 py-2 text-center space-x-2">
                          <button 
                            onClick={() => setEditingCategoryId(cat.rowid)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            ✏️ Sửa
                          </button>
                          <button 
                            onClick={() => deleteCategory(cat.rowid)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}