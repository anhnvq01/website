import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Api from '../services/api'
import html2canvas from 'html2canvas'

// Helper to add cache-busting timestamp to image URLs
function addTimestampToUrl(url) {
  if (!url) return url
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
}

export default function Admin(){
  const [step, setStep] = useState('login') // login, dashboard, products, orders, add-product, edit-product
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [token, setToken] = useState('')
  const [uploading, setUploading] = useState(false) // Track upload status
  const toastTimer = useRef(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, message: '', onConfirm: null })

  // Image crop states - declare early for useEffect
  const [showCropTool, setShowCropTool] = useState(false)
  const [cropImage, setCropImage] = useState(null)
  const [cropOffsetX, setCropOffsetX] = useState(0)
  const [cropOffsetY, setCropOffsetY] = useState(0)
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  const canvasRef = useRef(null)
  const cropCanvasRef = useRef(null)

  const showToast = (message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, message, type })
    toastTimer.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3200)
  }

  const showConfirm = (message, onConfirm) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setConfirmDialog({ visible: true, message, onConfirm })
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  // Prevent scroll from changing number inputs
  useEffect(() => {
    const preventNumberScroll = (e) => {
      if (e.target.type === 'number') {
        e.target.blur()
        setTimeout(() => e.target.focus(), 0)
      }
    }
    document.addEventListener('wheel', preventNumberScroll, { passive: false })
    return () => document.removeEventListener('wheel', preventNumberScroll)
  }, [])

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    if (savedToken) {
      // Try to validate; if 401, show login form without clearing token yet
      setToken(savedToken)
      setStep('dashboard')
      validateAndLoad(savedToken)
    }
  }, [])

  // Reset crop tool when step changes (e.g., when navigating away)
  useEffect(() => {
    if (step !== 'add-product' && step !== 'edit-product') {
      setShowCropTool(false)
      setCropImage(null)
      setCropOffsetX(0)
      setCropOffsetY(0)
      setUploadedFile(null)
      setImagePreview('https://via.placeholder.com/200x150?text=Ảnh+sản+phẩm')
      // Clear canvas completely
      if (cropCanvasRef.current) {
        const ctx = cropCanvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, cropCanvasRef.current.width, cropCanvasRef.current.height)
      }
    }
  }, [step])

  // Draw crop image on canvas when showCropTool changes
  useEffect(() => {
    if (!showCropTool || !cropImage || !cropCanvasRef.current) return
    
    const canvas = cropCanvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Set canvas size to match image aspect ratio (square for cropping)
      const size = Math.min(img.width, img.height)
      canvas.width = size
      canvas.height = size
      
      // Draw with adjustable offset
      const offsetX = cropOffsetX
      const offsetY = cropOffsetY
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)
      
      // Draw grid overlay to show crop area (ONLY FOR DISPLAY - not saved)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      const gridSize = size / 3
      for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(gridSize * i, 0)
        ctx.lineTo(gridSize * i, size)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(0, gridSize * i)
        ctx.lineTo(size, gridSize * i)
        ctx.stroke()
      }
    }
    
    img.src = cropImage
  }, [showCropTool, cropImage, cropOffsetX, cropOffsetY])

  // Product management
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoriesDirty, setCategoriesDirty] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    category: 'Thịt Gác Bếp',
    description: '',
    image: '',
    images: [],
    weight: '',
    promo_price: null,
    sold_count: 0,
    import_price: 0,
    is_tet: false,
    can_ship_province: true
  })
  const [imagePreview, setImagePreview] = useState('https://via.placeholder.com/200x150?text=Ảnh+sản+phẩm')
  const [gallery, setGallery] = useState([])
  const [uploadedFile, setUploadedFile] = useState(null)

  // Order management
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [isEditingCustomerInfo, setIsEditingCustomerInfo] = useState(false)
  const [editOrderItems, setEditOrderItems] = useState([])
  const [editInvoiceInfo, setEditInvoiceInfo] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [stats, setStats] = useState({})
  const [filterOrderStatus, setFilterOrderStatus] = useState('all')
  const [filterOrderDateFrom, setFilterOrderDateFrom] = useState('')
  const [filterOrderDateTo, setFilterOrderDateTo] = useState('')
  const [filterSeller, setFilterSeller] = useState('all')
  const [filterCustomerName, setFilterCustomerName] = useState('')
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    method: 'COD',
    shipping: 30000,
    discount: 0,
    paid: false,
    seller: 'Quang Tâm',
    extra_cost: 0
  })

  // Validation error states
  const [productFormErrors, setProductFormErrors] = useState({})
  const [orderFormErrors, setOrderFormErrors] = useState({})
  
  // Refs for scrolling to errors
  const productFormRef = useRef(null)
  const orderFormRef = useRef(null)
  const statusUpdateFormRef = useRef(null)
  const invoiceEditFormRef = useRef(null)

  // Admin accounts management
  const [admins, setAdmins] = useState([])
  const [editingAdminId, setEditingAdminId] = useState(null)
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    role: 'admin'
  })

  const invoiceInfo = editInvoiceInfo || {
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    method: 'COD',
    shipping: 0,
    discount: 0
  }

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
      localStorage.setItem('admin_token', res.token)
      // Notify other parts of the app (e.g., header) that auth state changed
      window.dispatchEvent(new Event('storage'))
      await bootstrapAuth(res.token)
    } catch(e) { showToast('Đăng nhập thất bại', 'error') }
  }

  function logout(message) {
    localStorage.removeItem('admin_token')
    setToken('')
    setStep('login')
    setProducts([])
    setOrders([])
    if (message) showToast(message, 'error')
    window.dispatchEvent(new Event('storage'))
  }

  const handleAuthError = (err) => {
    if (err?.response?.status === 401) {
      showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setStep('login')
      return true
    }
    return false
  }

  async function validateAndLoad(tk) {
    try {
      await Api.adminMe(tk)
      await Promise.all([
        loadProducts(tk),
        loadOrders(tk),
        loadStats(tk),
        loadCategories(tk),
        loadAdmins(tk)
      ])
    } catch (e) {
      if (e?.response?.status === 401) {
        showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
        setStep('login')
      } else {
        console.error('Load error:', e)
      }
    }
  }

  async function bootstrapAuth(tk) {
    try {
      await Api.adminMe(tk)
      setToken(tk)
      setStep('dashboard')
      await Promise.all([
        loadProducts(tk),
        loadOrders(tk),
        loadStats(tk),
        loadCategories(tk),
        loadAdmins(tk)
      ])
    } catch (e) {
      handleAuthError(e)
    }
  }

  // Export orders with status "Ngày mai giao" to Excel
  async function exportNgayMaiGiao() {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const response = await fetch(`${apiUrl}/admin/export-ngay-mai-giao`, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Xuất file thất bại')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DonHang_NgayMaiGiao_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showToast('Xuất file Excel thành công', 'success')
    } catch (e) {
      showToast('Lỗi xuất file: ' + e.message, 'error')
    }
  }

  const normalizeCanShip = (value) => {
    // Accept numeric, boolean, or string values from backend
    if (value === true || value === 1 || value === '1' || value === 'true') return true
    return false
  }

  async function loadProducts(tk) {
    try {
      const data = await Api.adminGetProducts(tk)
      const normalized = data.map(p => ({
        ...p,
        // Keep clean URLs from DB; add cache-busting only when rendering
        images: parseImagesField(p.images, p.image),
        import_price: Number(p.import_price || 0),
        is_tet: !!p.is_tet,
        can_ship_province: normalizeCanShip(p.can_ship_province)
      }))
      setProducts(normalized)
    } catch(e) { if (!handleAuthError(e)) console.error(e) }
  }

  async function loadOrders(tk) {
    try {
      const data = await Api.adminGetOrders(tk)
      console.log('Orders loaded:', data)
      // Normalize paid status to boolean
      const normalizedOrders = data.map(order => ({
        ...order,
        paid: !!(order.paid === true || order.paid === 1 || order.paid === '1')
      }))
      setOrders(normalizedOrders)
    } catch(e) { if (!handleAuthError(e)) console.error(e) }
  }

  async function loadStats(tk) {
    try {
      const day = await Api.adminGetStats(tk, 'day')
      const month = await Api.adminGetStats(tk, 'month')
      const year = await Api.adminGetStats(tk, 'year')
      setStats({ day, month, year })
    } catch(e) { if (!handleAuthError(e)) console.error(e) }
  }

  async function loadCategories(tk) {
    try {
      const data = await Api.adminGetCategories(tk)
      setCategories(data)
      setCategoriesDirty(false)
    } catch(e) { 
      if (!handleAuthError(e)) {
        console.error(e)
        showToast('Lỗi tải danh mục', 'error')
      }
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      setCropImage(evt.target.result)
      setShowCropTool(true)
    }
    reader.readAsDataURL(file)
  }

  function handleCropConfirm() {
    const displayCanvas = cropCanvasRef.current
    if (!displayCanvas || !cropImage) return
    
    const currentStep = step  // Capture current step
    
    // Create a NEW canvas for export (without grid overlay)
    const exportCanvas = document.createElement('canvas')
    const img = new Image()
    
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      exportCanvas.width = size
      exportCanvas.height = size
      
      const ctx = exportCanvas.getContext('2d')
      const offsetX = cropOffsetX
      const offsetY = cropOffsetY
      // Draw image WITHOUT grid
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)
      
      // Convert CLEAN canvas to blob
      exportCanvas.toBlob(async (blob) => {
        try {
          const croppedFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
          setUploading(true)
          const result = await Api.adminUploadImage(token, croppedFile)
          let uploadedUrl = result.imageUrl || result.url
          
          // IMPORTANT: Store clean URL (without timestamp) for database
          const cleanUrl = uploadedUrl
          // For preview: add timestamp to bypass browser cache
          const displayUrl = uploadedUrl + (uploadedUrl.includes('?') ? '&' : '?') + 't=' + Date.now()
          
          setImagePreview(displayUrl)
          // Save CLEAN URL to form (without timestamp for DB)
          setProductForm(prev => ({...prev, image: cleanUrl}))
          setUploadedFile('cropped-image.jpg')
          setShowCropTool(false)
          setCropImage(null)
          setCropOffsetX(0)
          setCropOffsetY(0)
          console.log('Image uploaded. Clean URL for DB:', cleanUrl)
          showToast('Tải ảnh thành công!')
          // Don't scroll - stay on form
        } catch(err) {
          if (!handleAuthError(err)) {
            console.error('Upload error:', err)
            showToast('Lỗi tải ảnh: ' + (err.response?.data?.error || err.message), 'error')
          }
        } finally {
          setUploading(false)
        }
      }, 'image/jpeg', 0.9)
    }
    
    img.src = cropImage
  }

  function handleCanvasMouseDown(e) {
    if (!cropImage) return
    setIsDraggingCrop(true)
    setDragStartX(e.clientX)
    setDragStartY(e.clientY)
  }

  function handleCanvasMouseMove(e) {
    if (!isDraggingCrop || !cropImage || !cropCanvasRef.current) return
    
    const deltaX = e.clientX - dragStartX
    const deltaY = e.clientY - dragStartY
    
    const img = new Image()
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const maxOffsetX = img.width - size
      const maxOffsetY = img.height - size
      
      // Clamp offsets within image bounds
      const newOffsetX = Math.max(0, Math.min(cropOffsetX - deltaX, maxOffsetX))
      const newOffsetY = Math.max(0, Math.min(cropOffsetY - deltaY, maxOffsetY))
      
      setCropOffsetX(newOffsetX)
      setCropOffsetY(newOffsetY)
      setDragStartX(e.clientX)
      setDragStartY(e.clientY)
    }
    img.src = cropImage
  }

  function handleCanvasMouseUp() {
    setIsDraggingCrop(false)
  }

  async function saveProduct(e) {
    e.preventDefault()
    const errors = {}
    
    // Validate required fields
    if (!productForm.name || !productForm.name.trim()) {
      errors.name = 'Vui lòng nhập tên sản phẩm'
    }
    if (!productForm.price || productForm.price <= 0) {
      errors.price = 'Vui lòng nhập giá sản phẩm (lớn hơn 0)'
    }
    if (!productForm.image && gallery.length === 0) {
      errors.image = 'Vui lòng chọn ảnh đại diện'
    }
    
    // If there are errors, display them and scroll to first error
    if (Object.keys(errors).length > 0) {
      setProductFormErrors(errors)
      productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }
    
    setProductFormErrors({})
    
    const weightNormalized = (() => {
      if (productForm.weight === null || productForm.weight === undefined || productForm.weight === '') return null
      const cleaned = String(productForm.weight).replace(',', '.').replace(/[^0-9.]/g, '')
      const num = parseFloat(cleaned)
      return Number.isFinite(num) ? num : null
    })()
    const payload = {
      ...productForm,
      images: gallery,
      import_price: Number(productForm.import_price) || 0,
      is_tet: productForm.is_tet ? 1 : 0,
      can_ship_province: productForm.can_ship_province ? 1 : 0,
      weight: weightNormalized
    }
    if (!payload.image && gallery.length) {
      payload.image = gallery[0]
      setProductForm(prev => ({ ...prev, image: gallery[0] }))
    }

    try {
      if (editingId) {
        console.log('Updating product with payload:', payload)
        await Api.adminUpdateProduct(token, editingId, payload)
        showToast('Cập nhật sản phẩm thành công')
        // Reload products to update all views
        await loadProducts(token)
        // Trigger event to update CartIcon if product is in cart
        window.dispatchEvent(new CustomEvent('productUpdated', { detail: { productId: editingId } }))
        // Stay on edit page after update
      } else {
        console.log('Adding product with payload:', payload)
        await Api.adminAddProduct(token, payload)
        showToast('Thêm sản phẩm thành công')
        resetProductForm()
        setEditingId(null)
        // Go to products list only after adding new product
        setStep('products')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (!editingId) {
        resetProductForm()
        setEditingId(null)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch(e){ if (!handleAuthError(e)) showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
  }

  async function deleteProduct(id) {
    showConfirm('Xác nhận xóa sản phẩm này?', async () => {
      try {
        await Api.adminDeleteProduct(token, id)
        showToast('Xóa sản phẩm thành công')
        loadProducts(token)
      } catch(e) { if (!handleAuthError(e)) showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
    })
  }

  async function editProduct(product) {
    // Refetch latest product data from API to ensure we have the most recent image
    let freshProduct = product
    try {
      freshProduct = await Api.product(product.id)
    } catch (err) {
      console.warn('Could not refetch product for edit:', err)
    }
    
    const parsedImages = parseImagesField(freshProduct.images, freshProduct.image)
    const mainImage = freshProduct.image || parsedImages[0] || 'https://via.placeholder.com/200x150?text=Ảnh+sản+phẩm'
    setProductForm({
      name: freshProduct.name,
      price: freshProduct.price,
      category: freshProduct.category,
      description: freshProduct.description,
      image: mainImage,
      images: parsedImages,
      weight: freshProduct.weight || '',
      promo_price: freshProduct.promo_price ?? null,
      sold_count: freshProduct.sold_count || 0,
      import_price: Number(freshProduct.import_price || 0),
      is_tet: !!freshProduct.is_tet,
      can_ship_province: normalizeCanShip(freshProduct.can_ship_province)
    })
    setGallery(parsedImages)
    // Add timestamp to bypass browser cache for updated images
    setImagePreview(addTimestampToUrl(mainImage))
    setEditingId(freshProduct.id)
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
      promo_price: null,
      sold_count: 0,
      import_price: 0,
      is_tet: false,
      can_ship_province: true
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
        // Normalize the paid status from API response
        const newPaid = updated?.paid !== undefined ? !!(updated.paid === true || updated.paid === 1 || updated.paid === '1') : newPaidStatus
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, paid: newPaid } : o))
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({ ...selectedOrder, paid: newPaid })
        }
        // Cập nhật số liệu
        loadStats(token)
        showToast(`Cập nhật trạng thái thành công: ${action}`)
      } catch(e) { if (!handleAuthError(e)) showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
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
      } catch(e) { if (!handleAuthError(e)) showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error') }
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
      if (!handleAuthError(e)) showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error')
    }
  }
  
    function moveCategory(id, direction) {
      setCategories(prev => {
        const idx = prev.findIndex(c => c.id === id)
        if (idx === -1) return prev
        const target = direction === 'up' ? idx - 1 : idx + 1
        if (target < 0 || target >= prev.length) return prev
        const next = [...prev]
        ;[next[idx], next[target]] = [next[target], next[idx]]
        setCategoriesDirty(true)
        return next
      })
    }
  
    async function saveCategoryOrder() {
      if (!categoriesDirty) return
      const order = categories.map(c => c.id)
      try {
        await Api.adminReorderCategories(token, order)
        showToast('Đã lưu thứ tự danh mục', 'success')
        setCategoriesDirty(false)
      } catch (e) {
        if (!handleAuthError(e)) showToast('Lưu thứ tự thất bại: ' + (e.response?.data?.error || e.message), 'error')
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
      if (!handleAuthError(e)) showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error')
    }
  }

  async function deleteCategory(id) {
    showConfirm('Xác nhận xóa danh mục này?', async () => {
      try {
        await Api.adminDeleteCategory(token, id)
        await loadCategories(token)
        showToast('Xóa danh mục thành công')
      } catch(e) {
        if (!handleAuthError(e)) showToast('Lỗi: ' + (e.response?.data?.error || e.message), 'error')
      }
    })
  }

  // Order item management
  function mergeSimilarItems(items = []) {
    const grouped = new Map()
    items.forEach(raw => {
      const item = { ...raw }
      const key = item.id ? `id-${item.id}` : `name-${(item.name || '').trim().toLowerCase()}-${item.price || 0}`
      const existing = grouped.get(key)
      if (existing) {
        existing.qty += Number(item.qty) || 0
        existing.price = Number(item.price) || existing.price
        existing.name = item.name || existing.name
      } else {
        grouped.set(key, {
          ...item,
          qty: Number(item.qty) || 1,
          price: Number(item.price) || 0
        })
      }
    })
    return Array.from(grouped.values())
  }

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
    const errors = {}
    
    // Validate required fields
    if (!orderForm.customer_name || !orderForm.customer_name.trim()) {
      errors.customer_name = 'Vui lòng nhập tên khách hàng'
    }
    if (!orderForm.customer_phone || !orderForm.customer_phone.trim()) {
      errors.customer_phone = 'Vui lòng nhập số điện thoại'
    }
    if (orderItems.length === 0) {
      errors.items = 'Vui lòng thêm ít nhất 1 sản phẩm vào đơn hàng'
    }
    
    // If there are errors, display them and scroll to first error
    if (Object.keys(errors).length > 0) {
      setOrderFormErrors(errors)
      orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error')
      return
    }
    
    setOrderFormErrors({})
    
    const compactItems = mergeSimilarItems(orderItems)

    try {
      const subtotal = compactItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
      const total = subtotal + orderForm.shipping - orderForm.discount + (orderForm.extra_cost || 0)

      if (editingOrderId) {
        await Api.adminUpdateOrder(token, editingOrderId, {
          customer_name: orderForm.customer_name,
          customer_phone: orderForm.customer_phone,
          customer_address: orderForm.customer_address,
          items_json: compactItems,
          subtotal,
          shipping: orderForm.shipping,
          discount: orderForm.discount,
          total,
          method: orderForm.method,
          paid: orderForm.paid,
          extra_cost: orderForm.extra_cost || 0
        })
        showToast('Cập nhật đơn hàng thành công')
      } else {
        await Api.adminCreateOrder(token, {
          customer_name: orderForm.customer_name,
          customer_phone: orderForm.customer_phone,
          customer_address: orderForm.customer_address,
          items_json: compactItems,
          subtotal,
          shipping: orderForm.shipping,
          discount: orderForm.discount,
          total,
          method: orderForm.method,
          paid: orderForm.paid,
          seller: orderForm.seller || 'Quang Tâm',
          extra_cost: orderForm.extra_cost || 0
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
        paid: false,
        seller: 'Quang Tâm'
      })
      setOrderItems([])
      setEditingOrderId(null)
      setStep('orders')
      await loadOrders(token)
      await loadStats(token)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      paid: !!order.paid,
      seller: order.seller || 'Quang Tâm',
      extra_cost: order.extra_cost || 0
    })
    setOrderItems(mergeSimilarItems(order.items_json || []))
    setStep('add-order')
  }

  // Admin accounts management
  async function loadAdmins(tk) {
    try {
      const data = await Api.adminGetAdmins(tk)
      console.log('Admins loaded:', data)
      setAdmins(data)
    } catch(e) { if (!handleAuthError(e)) console.error(e) }
  }

  async function saveAdmin() {
    try {
      if (editingAdminId) {
        await Api.adminUpdateAdmin(token, editingAdminId, adminForm)
        showToast('Cập nhật tài khoản thành công')
      } else {
        await Api.adminCreateAdmin(token, adminForm)
        showToast('Tạo tài khoản thành công')
      }
      setAdminForm({ username: '', password: '', role: 'admin' })
      setEditingAdminId(null)
      await loadAdmins(token)
    } catch(e) { 
      const errorMsg = e.response?.data?.error || e.message
      showToast('Lỗi: ' + errorMsg, 'error') 
    }
  }

  function startEditAdmin(admin) {
    setEditingAdminId(admin.id)
    setAdminForm({
      username: admin.username,
      password: '',
      role: admin.role || 'admin'
    })
  }

  function cancelEditAdmin() {
    setEditingAdminId(null)
    setAdminForm({ username: '', password: '', role: 'admin' })
  }

  async function deleteAdmin(id) {
    try {
      await Api.adminDeleteAdmin(token, id)
      showToast('Xóa tài khoản thành công')
      await loadAdmins(token)
    } catch(e) {
      const errorMsg = e.response?.data?.error || e.message
      showToast('Lỗi: ' + errorMsg, 'error')
    }
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
            <input value={user} onChange={e=>setUser(e.target.value)} className="w-full p-3 text-base border rounded"/>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Mật khẩu</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full p-3 text-base border rounded"/>
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
          📊 Tổng quan
        </button>
        
        <button 
          onClick={() => { setStep('products'); loadProducts(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'products' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          📦 Quản lý sản phẩm
        </button>
        <button 
          onClick={() => { setStep('orders'); loadOrders(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'orders' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          🛒 Quản lý đơn hàng
        </button>
        <button 
          onClick={() => { setStep('categories'); loadCategories(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'categories' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          🏷️ Danh mục
        </button>
        <button 
          onClick={() => { setStep('admins'); loadAdmins(token) }}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${step === 'admins' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-600'}`}
        >
          👤 Tài khoản
        </button>
        <button 
          onClick={exportNgayMaiGiao}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap border-transparent text-gray-600 hover:text-green-600 ml-auto`}
          title="Xuất đơn hàng Ngày mai giao ra Excel"
        >
          📊 Xuất đơn ngày mai giao
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
                  <h3 className="text-blue-100 font-medium text-sm uppercase tracking-wide">Tổng SP</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.totalProducts || products.length}</p>
                </div>
                <div className="text-4xl opacity-20">📦</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-orange-100 font-medium text-sm uppercase tracking-wide">Tổng đơn đã đặt</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.totalOrders || orders.length}</p>
                </div>
                <div className="text-4xl opacity-20">🛒</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-yellow-100 font-medium text-sm uppercase tracking-wide">Chưa giao</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.undeliveredOrders || 0}</p>
                </div>
                <div className="text-4xl opacity-20">📦</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-purple-100 font-medium text-sm uppercase tracking-wide">Đã giao chưa TT</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.unpaidDeliveredOrders || 0}</p>
                </div>
                <div className="text-4xl opacity-20">💰</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-red-100 font-medium text-sm uppercase tracking-wide">Đơn bom</h3>
                  <p className="text-3xl font-bold mt-1">{stats.day?.bomOrders || 0}</p>
                </div>
                <div className="text-4xl opacity-20">💣</div>
              </div>
            </div>
          </div>

          {/* Revenue Charts - Quang Tâm */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-orange-500">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>👨‍💼</span> Quang Tâm - Doanh thu & Lợi nhuận
            </h3>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Chart */}
              <div>
                <div className="mb-4 text-sm text-gray-600 font-medium">Biểu đồ so sánh (VNĐ)</div>
                <div className="w-full bg-gray-50 rounded-lg p-6">
                  {(() => {
                    const labels = ['Hôm nay','Tháng','Năm']
                    const data = [stats.day?.revenueQuangTam || 0, stats.month?.revenueQuangTam || 0, stats.year?.revenueQuangTam || 0]
                    const profit = [stats.day?.profitQuangTam || 0, stats.month?.profitQuangTam || 0, stats.year?.profitQuangTam || 0]
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
                  <div className="text-2xl font-bold text-orange-700">{(stats.day?.revenueQuangTam || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.day?.profitQuangTam || 0).toLocaleString()}₫</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-500">
                  <div className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">Tháng này</div>
                  <div className="text-2xl font-bold text-purple-700">{(stats.month?.revenueQuangTam || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.month?.profitQuangTam || 0).toLocaleString()}₫</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">Năm này</div>
                  <div className="text-2xl font-bold text-blue-700">{(stats.year?.revenueQuangTam || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.year?.profitQuangTam || 0).toLocaleString()}₫</div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Charts - Mẹ Hằng */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-pink-500">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>👩‍💼</span> Mẹ Hằng - Doanh Thu & Lợi Nhuận
            </h3>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Chart */}
              <div>
                <div className="mb-4 text-sm text-gray-600 font-medium">Biểu đồ so sánh (VNĐ)</div>
                <div className="w-full bg-gray-50 rounded-lg p-6">
                  {(() => {
                    const labels = ['Hôm nay','Tháng','Năm']
                    const data = [stats.day?.revenueMeHang || 0, stats.month?.revenueMeHang || 0, stats.year?.revenueMeHang || 0]
                    const profit = [stats.day?.profitMeHang || 0, stats.month?.profitMeHang || 0, stats.year?.profitMeHang || 0]
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
                              <rect x={rx} y={chartH - revH - 30} width={barW} height={revH} fill="#ec4899" rx="4">
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
                    <span className="w-4 h-4 bg-pink-500 rounded"></span>
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
                <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-6 rounded-lg border-l-4 border-pink-500">
                  <div className="text-xs text-pink-600 font-semibold uppercase tracking-wider mb-2">Hôm nay</div>
                  <div className="text-2xl font-bold text-pink-700">{(stats.day?.revenueMeHang || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.day?.profitMeHang || 0).toLocaleString()}₫</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-500">
                  <div className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">Tháng này</div>
                  <div className="text-2xl font-bold text-purple-700">{(stats.month?.revenueMeHang || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.month?.profitMeHang || 0).toLocaleString()}₫</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">Năm này</div>
                  <div className="text-2xl font-bold text-blue-700">{(stats.year?.revenueMeHang || 0).toLocaleString()}₫</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">↑ Lợi nhuận: {(stats.year?.profitMeHang || 0).toLocaleString()}₫</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Management */}
      {step === 'products' && (
        <div>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-2xl font-semibold">Quản Lý Sản Phẩm</h2>
            <div className="flex gap-3 items-center w-full sm:w-auto">
              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white flex-1 sm:flex-none"
              >
                <option key="all" value="all">🏷️ Tất cả danh mục</option>
                {categories.map(cat => (
                  <option key={cat.rowid || cat.id || cat.category} value={cat.category}>{cat.category}</option>
                ))}
              </select>
              <button 
                onClick={() => { resetProductForm(); setEditingId(null); setStep('add-product') }}
                className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 whitespace-nowrap"
              >
                ➕ Thêm Sản Phẩm
              </button>
            </div>
          </div>

          {(() => {
            const filtered = filterCategory === 'all' 
              ? products 
              : products.filter(p => p.category === filterCategory)
            
            return filtered.length === 0 ? (
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
                    <th className="px-4 py-2 text-right">Giá nhập</th>
                    <th className="px-4 py-2 text-left">Danh Mục</th>
                    <th className="px-4 py-2 text-center">Tết</th>
                    <th className="px-4 py-2 text-right">KM</th>
                    <th className="px-4 py-2 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-sm">{p.id}</td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2 text-right font-medium">{p.price.toLocaleString()}₫</td>
                      <td className="px-4 py-2 text-right text-gray-700">{(p.import_price || 0).toLocaleString()}₫</td>
                      <td className="px-4 py-2 text-sm">{p.category}</td>
                      <td className="px-4 py-2 text-center">
                        {p.is_tet ? <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-semibold">Tết</span> : '-' }
                      </td>
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
            )
          })()}
        </div>
      )}

      {/* Add/Edit Product */}
      {(step === 'add-product' || step === 'edit-product') && (
        <div className="max-w-2xl bg-white p-6 rounded shadow" ref={productFormRef}>
          <h2 className="text-2xl font-semibold mb-6">{editingId ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
          <form onSubmit={saveProduct} noValidate className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Tên sản phẩm <span className="text-red-600">*</span></label>
                <input 
                  value={productForm.name} 
                  onChange={e=>{setProductForm({...productForm, name: e.target.value}); setProductFormErrors({...productFormErrors, name: ''})}}
                  className={`w-full p-2 border rounded ${productFormErrors.name ? 'border-red-500 ring-2 ring-red-200 bg-red-50' : ''}`}
                />
                {productFormErrors.name && (
                  <div className="text-red-600 text-sm mt-1 flex items-start gap-1">
                    <span className="text-lg">⚠️</span>
                    <span>{productFormErrors.name}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Giá (₫) <span className="text-red-600">*</span></label>
                <input 
                  type="number" 
                  value={productForm.price} 
                  onChange={e=>{setProductForm({...productForm, price: parseInt(e.target.value) || 0}); setProductFormErrors({...productFormErrors, price: ''})}}
                  className={`w-full p-2 border rounded ${productFormErrors.price ? 'border-red-500 ring-2 ring-red-200 bg-red-50' : ''}`}
                />
                {productFormErrors.price && (
                  <div className="text-red-600 text-sm mt-1 flex items-start gap-1">
                    <span className="text-lg">⚠️</span>
                    <span>{productFormErrors.price}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Giá nhập (₫)</label>
                <input 
                  type="number" 
                  value={productForm.import_price}
                  onChange={e=>setProductForm({...productForm, import_price: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-2 mt-7">
                <input 
                  type="checkbox"
                  checked={productForm.is_tet}
                  onChange={e=>setProductForm({...productForm, is_tet: e.target.checked})}
                />
                <label className="text-gray-700 font-medium">Thuộc danh mục Tết</label>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox"
                  checked={productForm.can_ship_province}
                  onChange={e=>setProductForm({...productForm, can_ship_province: e.target.checked})}
                />
                <label className="text-gray-700 font-medium">Có giao hàng liên tỉnh</label>
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
                <label className="block text-gray-700 font-medium mb-1">Trọng lượng (kg)</label>
                <input 
                  value={productForm.weight} 
                  onChange={e=>setProductForm({...productForm, weight: e.target.value})}
                  className="w-full p-2 border rounded"
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
              <div>
                <label className="block text-gray-700 font-medium mb-1">Số lượng đã bán</label>
                <input 
                  type="number" 
                  value={productForm.sold_count || 0} 
                  onChange={e=>setProductForm({...productForm, sold_count: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded"
                  min="0"
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
                        const uploadedUrl = res.imageUrl || res.url
                        uploadedUrls.push(uploadedUrl)
                      }
                      const next = [...gallery, ...uploadedUrls]
                      setGallery(next)
                      setProductForm(prev => ({...prev, images: next}))
                      if (!productForm.image && next.length > 0) {
                        setImagePreview(next[0])
                        setProductForm(prev => ({...prev, image: next[0]}))
                      }
                      showToast(`Đã tải ${uploadedUrls.length} ảnh thành công!`)
                    } catch(err){ 
                      console.error('Gallery upload error:', err)
                      showToast('Upload ảnh mô tả thất bại: ' + (err.response?.data?.error || err.message), 'error') 
                    } finally { setUploading(false) }
                  }} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Ảnh đại diện <span className="text-red-600">*</span></label>
              
              {/* Crop Tool Modal - Only render when showCropTool is true */}
              {showCropTool && cropImage && step === 'edit-product' ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 mb-4 animate-fade-in">
                  <div className="bg-white rounded shadow-lg max-w-2xl w-full p-6 animate-scale-in">
                    <h3 className="text-lg font-bold mb-2">✏️ Chọn vùng ảnh đại diện (Hình Vuông)</h3>
                    <p className="text-sm text-gray-600 mb-4">Kéo chuột trên ảnh để điều chỉnh vị trí cắt. Những đường lưới giúp bạn căn chỉnh ảnh tốt hơn.</p>
                    
                    <div className="mb-4 border rounded overflow-auto max-h-96 flex justify-center items-center bg-gray-100">
                      <canvas 
                        ref={cropCanvasRef}
                        className="max-w-full cursor-move"
                        style={{ maxHeight: '400px' }}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      />
                    </div>
                    
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                      💡 Mẹo: Kéo chuột từ trái sang phải hoặc từ trên xuống dưới để điều chỉnh vị trí cắt
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleCropConfirm}
                        disabled={uploading}
                        className="flex-1 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 font-medium disabled:bg-gray-400"
                      >
                        💾 {uploading ? 'Đang tải...' : 'Lưu & Tải lên'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCropTool(false)
                          setCropImage(null)
                          setCropOffsetX(0)
                          setCropOffsetY(0)
                        }}
                        disabled={uploading}
                        className="flex-1 px-4 py-2 rounded text-white bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={`border-2 border-dashed rounded p-4 ${productFormErrors.image ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                <div className="mb-3">
                  <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover rounded"/>
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
                {productFormErrors.image && (
                  <div className="text-red-600 text-sm mt-2 flex items-start gap-1">
                    <span className="text-lg">⚠️</span>
                    <span>{productFormErrors.image}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex-1">
                💾 {editingId ? 'Cập Nhật' : 'Thêm'} Sản Phẩm
              </button>
              <button 
                type="button"
                onClick={() => {
                  setStep('products')
                  resetProductForm()
                  setEditingId(null)
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                ← Quay lại danh sách
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Order */}
      {step === 'add-order' && (
        <div className="max-w-4xl bg-white p-6 rounded shadow" ref={orderFormRef}>
          <h2 className="text-2xl font-semibold mb-6">Thêm Đơn Hàng Mới</h2>
          <form onSubmit={saveOrder} noValidate className="space-y-6">
            {/* Customer Info */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Thông Tin Khách Hàng</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Tên khách <span className="text-red-600">*</span></label>
                  <input 
                    value={orderForm.customer_name}
                    onChange={e=>{setOrderForm({...orderForm, customer_name: e.target.value}); setOrderFormErrors({...orderFormErrors, customer_name: ''})}}
                    className={`w-full p-2 border rounded ${orderFormErrors.customer_name ? 'border-red-500 ring-2 ring-red-200 bg-red-50' : ''}`}
                  />
                  {orderFormErrors.customer_name && (
                    <div className="text-red-600 text-sm mt-1 flex items-start gap-1">
                      <span className="text-lg">⚠️</span>
                      <span>{orderFormErrors.customer_name}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Số điện thoại <span className="text-red-600">*</span></label>
                  <input 
                    value={orderForm.customer_phone}
                    onChange={e=>{setOrderForm({...orderForm, customer_phone: e.target.value}); setOrderFormErrors({...orderFormErrors, customer_phone: ''})}}
                    className={`w-full p-2 border rounded ${orderFormErrors.customer_phone ? 'border-red-500 ring-2 ring-red-200 bg-red-50' : ''}`}
                  />
                  {orderFormErrors.customer_phone && (
                    <div className="text-red-600 text-sm mt-1 flex items-start gap-1">
                      <span className="text-lg">⚠️</span>
                      <span>{orderFormErrors.customer_phone}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Địa chỉ</label>
                  <input 
                    value={orderForm.customer_address}
                    onChange={e=>setOrderForm({...orderForm, customer_address: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Người bán</label>
                  <select 
                    value={orderForm.seller}
                    onChange={e=>setOrderForm({...orderForm, seller: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option key="seller-qt" value="Quang Tâm">Quang Tâm</option>
                    <option key="seller-mh" value="Mẹ Hằng">Mẹ Hằng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className={`border-b pb-4 ${orderFormErrors.items ? 'border-red-500' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Danh Sách Sản Phẩm <span className="text-red-600">*</span></h3>
                <button 
                  type="button"
                  onClick={() => addOrderItem()}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Thêm Sản Phẩm
                </button>
              </div>

              {orderItems.length === 0 ? (
                <div className={`text-center py-4 rounded ${orderFormErrors.items ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                  <div className="text-gray-500">Chưa có sản phẩm nào</div>
                  {orderFormErrors.items && (
                    <div className="text-red-600 text-sm mt-2 flex items-center justify-center gap-1">
                      <span className="text-lg">⚠️</span>
                      <span>{orderFormErrors.items}</span>
                    </div>
                  )}
                </div>
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
                          <option key="product-empty" value="">-- Chọn sản phẩm hoặc tự thêm --</option>
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
                    <option key="method-cod">COD</option>
                    <option key="method-bank">Bank Transfer</option>
                    <option key="method-card">Card</option>
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
                  <label className="block text-gray-700 font-medium mb-1">Chi phí phát sinh (₫)</label>
                  <input 
                    type="number"
                    value={orderForm.extra_cost || 0}
                    onChange={e=>setOrderForm({...orderForm, extra_cost: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded"
                    placeholder="Không hiển thị cho khách"
                  />
                  <p className="text-xs text-gray-500 mt-1">*Chỉ admin thấy</p>
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
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-2xl font-semibold">Quản Lý Đơn Hàng</h2>
              <button 
                onClick={() => { setOrderForm({ customer_name: '', customer_phone: '', customer_address: '', method: 'COD', shipping: 30000, discount: 0, paid: false, seller: 'Quang Tâm' }); setOrderItems([]); setStep('add-order') }}
                className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 whitespace-nowrap"
              >
                ➕ Thêm Đơn Hàng
              </button>
            </div>
            
            {/* Filters */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">👤 Tên khách</label>
                  <input 
                    type="text"
                    value={filterCustomerName}
                    onChange={e => setFilterCustomerName(e.target.value)}
                    placeholder="Nhập tên khách..."
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">📋 Trạng thái</label>
                  <select 
                    value={filterOrderStatus}
                    onChange={e => setFilterOrderStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option key="status-all" value="all">Tất cả trạng thái</option>
                    <option key="status-undelivered" value="undelivered">⏳ Chưa giao</option>
                    <option key="status-delivered" value="delivered">✅ Đã giao</option>
                    <option key="status-tomorrow" value="tomorrow_delivery">📅 Giao ngày mai</option>
                    <option key="status-cancelled" value="cancelled">❌ Đã hủy</option>
                    <option key="status-bom" value="bom">💣 Bom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">👤 Người bán</label>
                  <select 
                    value={filterSeller}
                    onChange={e => setFilterSeller(e.target.value)}
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option key="filter-seller-all" value="all">Tất cả người bán</option>
                    <option key="filter-seller-qt" value="Quang Tâm">Quang Tâm</option>
                    <option key="filter-seller-mh" value="Mẹ Hằng">Mẹ Hằng</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">📅 Từ ngày</label>
                  <input 
                    type="date"
                    value={filterOrderDateFrom}
                    onChange={e => setFilterOrderDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">📅 Đến ngày</label>
                  <input 
                    type="date"
                    value={filterOrderDateTo}
                    onChange={e => setFilterOrderDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-end">
                  <button 
                    onClick={() => { setFilterOrderStatus('all'); setFilterOrderDateFrom(''); setFilterOrderDateTo(''); setFilterSeller('all'); setFilterCustomerName(''); }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg font-semibold shadow-md transition-all transform hover:scale-105"
                  >
                    🔄 Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedOrder ? (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-5xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
                >
                  ← Quay Lại
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm">#{selectedOrder.id}</span>
                  <span className={`px-3 py-1 rounded-full text-white text-sm ${selectedOrder.paid ? 'bg-green-600' : 'bg-red-500'}`}> 
                    {selectedOrder.paid ? '✓ Đã thanh toán' : '✗ Chưa thanh toán'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-white text-sm ${
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
              </div>

              <h3 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h3>
              
              {isEditingCustomerInfo ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-lg mb-4 text-green-900">✏️ Sửa thông tin khách hàng & thanh toán</h4>
                  
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
                        <option key="detail-method-cod" value="COD">COD</option>
                        <option key="detail-method-bank" value="BANK">Chuyển khoản</option>
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
                  
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const subtotal = selectedOrder.items_json.reduce((sum, item) => sum + (item.price * item.qty), 0)
                          const total = subtotal + (selectedOrder.shipping || 0) - (selectedOrder.discount || 0)
                          const payload = {
                            customer_name: selectedOrder.customer_name,
                            customer_phone: selectedOrder.customer_phone,
                            customer_address: selectedOrder.customer_address,
                            method: selectedOrder.method,
                            items_json: selectedOrder.items_json,
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
                          setSelectedOrder(updated)
                          setIsEditingCustomerInfo(false)
                          showToast('Đã cập nhật thông tin khách hàng')
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
                        setIsEditingCustomerInfo(false)
                        loadOrders(token).then(() => {
                          const original = orders.find(o => o.id === selectedOrder.id)
                          if (original) setSelectedOrder(original)
                        })
                      }}
                      className="px-4 py-2 rounded text-white bg-gray-500 hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-100 shadow-sm p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg">👤</div>
                      <h4 className="font-semibold text-gray-800 text-lg">Thông tin khách</h4>
                    </div>
                    <div className="space-y-1 text-gray-700">
                      <p><span className="font-semibold">Tên:</span> {selectedOrder.customer_name}</p>
                      <p><span className="font-semibold">SĐT:</span> {selectedOrder.customer_phone}</p>
                      <p><span className="font-semibold">Địa chỉ:</span> {selectedOrder.customer_address}</p>
                      <p className="text-sm text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-lg">👨‍💼</div>
                      <h4 className="font-semibold text-gray-800 text-lg">Người bán</h4>
                    </div>
                    <div className="space-y-2">
                      <select 
                        value={selectedOrder.seller || 'Quang Tâm'}
                        onChange={async (e) => {
                          try {
                            await Api.adminUpdateOrder(token, selectedOrder.id, { seller: e.target.value })
                            setSelectedOrder({...selectedOrder, seller: e.target.value})
                            showToast('Cập nhật người bán thành công')
                            await loadOrders(token)
                            await loadStats(token)
                          } catch(err) {
                            showToast('Lỗi cập nhật: ' + (err.response?.data?.error || err.message), 'error')
                          }
                        }}
                        className="w-full p-2 border rounded-lg bg-white"
                      >
                        <option key="seller-detail-qt" value="Quang Tâm">Quang Tâm</option>
                        <option key="seller-detail-mh" value="Mẹ Hằng">Mẹ Hằng</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 shadow-sm p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-lg">💳</div>
                      <h4 className="font-semibold text-gray-800 text-lg">Thanh toán</h4>
                    </div>
                    <div className="space-y-1 text-gray-700">
                      <p><span className="font-semibold">Phương thức:</span> {selectedOrder.method === 'BANK' ? 'Chuyển khoản' : 'COD'}</p>
                      <p><span className="font-semibold">Tạm tính:</span> {(selectedOrder.subtotal || 0).toLocaleString()}₫</p>
                      <p><span className="font-semibold">Vận chuyển:</span> {(selectedOrder.shipping || 0).toLocaleString()}₫</p>
                      {Number(selectedOrder.discount) > 0 && (
                        <p><span className="font-semibold">Giảm:</span> {Number(selectedOrder.discount).toLocaleString()}₫</p>
                      )}
                      <div className="mt-2 pt-2 border-t border-orange-100">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Chi phí phát sinh (admin):</label>
                        <input 
                          type="number"
                          value={selectedOrder.extra_cost || 0}
                          onChange={async (e) => {
                            const newCost = Number(e.target.value) || 0
                            try {
                              await Api.adminUpdateOrder(token, selectedOrder.id, { extra_cost: newCost })
                              setSelectedOrder({...selectedOrder, extra_cost: newCost})
                              showToast('Cập nhật chi phí phát sinh')
                              await loadStats(token)
                            } catch(err) {
                              showToast('Lỗi: ' + (err.response?.data?.error || err.message), 'error')
                            }
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">*Không hiển thị cho khách hàng</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-orange-100 flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Tổng:</span>
                      <span className="text-2xl font-bold text-orange-600">{(selectedOrder.total || 0).toLocaleString()}₫</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Danh sách sản phẩm</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left">Sản phẩm</th>
                        <th className="px-3 py-3 text-right">SL</th>
                        <th className="px-4 py-3 text-right">Giá</th>
                        <th className="px-4 py-3 text-right">Tổng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items_json?.map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                          <td className="px-3 py-3 text-right text-gray-700">{item.qty}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.price?.toLocaleString()}₫</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{(item.qty * (item.price || 0)).toLocaleString()}₫</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 text-sm">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-gray-700" colSpan={3}>Tạm tính</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{(selectedOrder.subtotal || 0).toLocaleString()}₫</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-gray-700" colSpan={3}>Vận chuyển</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{(selectedOrder.shipping || 0).toLocaleString()}₫</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-gray-700" colSpan={3}>Giảm giá</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">-{(selectedOrder.discount || 0).toLocaleString()}₫</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-900" colSpan={3}>Tổng cộng</td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600 text-lg">{(selectedOrder.total || 0).toLocaleString()}₫</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {isEditingOrder ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6" ref={invoiceEditFormRef}>
                  <h4 className="font-semibold text-lg mb-4 text-blue-900">✏️ Sửa Hóa Đơn</h4>
                  
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-4 text-sm">
                    <p className="font-medium text-yellow-800">⚠️ Lưu ý:</p>
                    <p className="text-gray-700">Chỉnh sửa toàn bộ hóa đơn (sản phẩm, vận chuyển, giảm giá, thông tin khách). Bấm lưu để cập nhật ngay ở phần chi tiết.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={invoiceInfo.customer_name}
                        onChange={e => setEditInvoiceInfo(prev => ({ ...(prev || invoiceInfo), customer_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={invoiceInfo.customer_phone}
                        onChange={e => setEditInvoiceInfo(prev => ({ ...(prev || invoiceInfo), customer_phone: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={invoiceInfo.customer_address}
                        onChange={e => setEditInvoiceInfo(prev => ({ ...(prev || invoiceInfo), customer_address: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={invoiceInfo.method || 'COD'}
                        onChange={e => setEditInvoiceInfo(prev => ({ ...(prev || invoiceInfo), method: e.target.value }))}
                      >
                        <option key="invoice-method-cod" value="COD">COD</option>
                        <option key="invoice-method-bank" value="BANK">Chuyển khoản</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vận chuyển (₫)</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={invoiceInfo.shipping}
                        onChange={e => setEditInvoiceInfo(prev => ({ ...(prev || invoiceInfo), shipping: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (₫)</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={invoiceInfo.discount}
                        onChange={e => setEditInvoiceInfo(prev => ({ ...(prev || invoiceInfo), discount: Number(e.target.value) || 0 }))}
                      />
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
                            <select
                              className="w-full p-1 text-sm border rounded"
                              value={item.id || ''}
                              onChange={e => {
                                const next = [...editOrderItems]
                                if (e.target.value === 'custom') {
                                  next[idx] = { id: '', name: '', price: 0, qty: item.qty }
                                } else if (e.target.value) {
                                  const product = products.find(p => p.id == e.target.value)
                                  if (product) {
                                    next[idx] = { 
                                      id: product.id, 
                                      name: product.name, 
                                      price: product.promo_price || product.price, 
                                      qty: item.qty 
                                    }
                                  }
                                }
                                setEditOrderItems(next)
                              }}
                            >
                              <option key="product-select-empty" value="">-- Chọn sản phẩm --</option>
                              {products.map(p => (
                                <option key={`product-${p.id}`} value={p.id}>
                                  {p.name} - {(p.promo_price || p.price).toLocaleString()}₫
                                </option>
                              ))}
                              <option key="product-select-custom" value="custom">✏️ Nhập tên khác</option>
                            </select>
                            {!item.id && (
                              <input
                                placeholder="Tên sản phẩm"
                                className="w-full p-1 text-sm border rounded mt-1"
                                value={item.name}
                                onChange={e => {
                                  const next = [...editOrderItems]
                                  next[idx].name = e.target.value
                                  setEditOrderItems(next)
                                }}
                              />
                            )}
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
                      <span className="font-medium">{(invoiceInfo.shipping || 0).toLocaleString()}₫</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{(invoiceInfo.discount || 0).toLocaleString()}₫</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-orange-600 mt-2 pt-2 border-t">
                      <span>Tổng cộng:</span>
                      <span>{(editOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0) + (invoiceInfo.shipping || 0) - (invoiceInfo.discount || 0)).toLocaleString()}₫</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const normalizedItems = mergeSimilarItems(editOrderItems)
                          setEditOrderItems(normalizedItems)
                          const subtotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
                          const shipping = Number(invoiceInfo.shipping) || 0
                          const discount = Number(invoiceInfo.discount) || 0
                          const total = subtotal + shipping - discount
                          const payload = {
                            customer_name: invoiceInfo.customer_name,
                            customer_phone: invoiceInfo.customer_phone,
                            customer_address: invoiceInfo.customer_address,
                            method: invoiceInfo.method,
                            items_json: normalizedItems,
                            subtotal,
                            shipping,
                            discount,
                            total,
                            paid: selectedOrder.paid,
                            status: selectedOrder.status || 'undelivered'
                          }
                          await Api.adminUpdateOrder(token, selectedOrder.id, payload)
                          setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...payload } : o))
                          setSelectedOrder({
                            ...selectedOrder,
                            ...payload
                          })
                          setIsEditingOrder(false)
                          showToast('Đã cập nhật hóa đơn')
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
                        setEditOrderItems(mergeSimilarItems(selectedOrder.items_json || []))
                        setEditInvoiceInfo({
                          customer_name: selectedOrder.customer_name || '',
                          customer_phone: selectedOrder.customer_phone || '',
                          customer_address: selectedOrder.customer_address || '',
                          method: selectedOrder.method || 'COD',
                          shipping: Number(selectedOrder.shipping) || 0,
                          discount: Number(selectedOrder.discount) || 0
                        })
                      }}
                      className="px-4 py-2 rounded text-white bg-gray-500 hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid md:grid-cols-4 gap-3 mb-3">
                <button
                  onClick={() => {
                    setIsEditingOrder(true)
                    setEditOrderItems(mergeSimilarItems(selectedOrder.items_json || []))
                    setEditInvoiceInfo({
                      customer_name: selectedOrder.customer_name || '',
                      customer_phone: selectedOrder.customer_phone || '',
                      customer_address: selectedOrder.customer_address || '',
                      method: selectedOrder.method || 'COD',
                      shipping: Number(selectedOrder.shipping) || 0,
                      discount: Number(selectedOrder.discount) || 0
                    })
                    setTimeout(() => invoiceEditFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:to-orange-700 font-semibold shadow"
                >
                  🧾 Sửa Hóa Đơn
                </button>
                <Link 
                  to={`/invoice/${selectedOrder.id}`}
                  target="_blank"
                  className="w-full px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:to-blue-700 font-semibold shadow text-center"
                >
                  📄 Xem Hóa Đơn
                </Link>
                <button 
                  onClick={() => {
                    setNewStatus(selectedOrder.status || 'undelivered')
                    setIsUpdatingStatus(true)
                    setTimeout(() => statusUpdateFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:to-purple-700 font-semibold shadow"
                >
                  📋 Cập Nhật Trạng Thái
                </button>
                <button 
                  onClick={async () => {
                    await toggleOrderPaid(selectedOrder)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-white font-semibold shadow ${selectedOrder.paid ? 'bg-gradient-to-r from-red-500 to-red-600 hover:to-red-700' : 'bg-gradient-to-r from-green-500 to-green-600 hover:to-green-700'}`}
                >
                  {selectedOrder.paid ? '❌ Chưa thanh toán' : '✅ Đã thanh toán'}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    const invoiceUrl = `${window.location.origin}/invoice/${selectedOrder.id}`
                    window.open(invoiceUrl, '_blank')
                    setTimeout(() => {
                      const printWindow = window.open(invoiceUrl, '_blank')
                      if (printWindow) {
                        printWindow.onload = () => {
                          setTimeout(() => printWindow.print(), 500)
                        }
                      }
                    }, 100)
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:to-indigo-700 font-semibold shadow"
                >
                  🖨️ In Hóa Đơn
                </button>
                <button
                  onClick={async () => {
                    try {
                      const invoiceUrl = `${window.location.origin}/invoice/${selectedOrder.id}`
                      const newWindow = window.open(invoiceUrl, '_blank')
                      if (!newWindow) {
                        showToast('Vui lòng cho phép popup để tải ảnh', 'error')
                        return
                      }
                      await new Promise(resolve => {
                        newWindow.onload = () => setTimeout(resolve, 1000)
                      })
                      const invoiceElement = newWindow.document.querySelector('.bg-white.p-8')
                      if (!invoiceElement) {
                        showToast('Không tìm thấy hóa đơn', 'error')
                        newWindow.close()
                        return
                      }
                      const canvas = await html2canvas(invoiceElement, {
                        scale: 2,
                        backgroundColor: '#ffffff',
                        useCORS: true,
                        ignoreElements: (element) => element.classList.contains('no-print')
                      })
                      const link = document.createElement('a')
                      link.href = canvas.toDataURL('image/png')
                      link.download = `HoaDon_${selectedOrder.id}.png`
                      link.click()
                      newWindow.close()
                      showToast('Đã tải ảnh hóa đơn')
                    } catch (err) {
                      console.error('Lỗi khi tải ảnh:', err)
                      showToast('Không thể tải ảnh. Vui lòng thử lại!', 'error')
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:to-pink-700 font-semibold shadow"
                >
                  📸 Tải Ảnh
                </button>
                <button 
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="w-full px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:to-black font-semibold shadow"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ) : (
            <div>
              {(() => {
                let filtered = orders.filter(o => {
                  // Filter by customer name
                  if (filterCustomerName && !o.customer_name?.toLowerCase().includes(filterCustomerName.toLowerCase())) return false
                  
                  // Filter by status
                  if (filterOrderStatus !== 'all' && o.status !== filterOrderStatus) return false
                  
                  // Filter by seller
                  if (filterSeller !== 'all' && o.seller !== filterSeller) return false
                  
                  // Filter by date range
                  try {
                    const orderDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : ''
                    if (filterOrderDateFrom && orderDate && orderDate < filterOrderDateFrom) return false
                    if (filterOrderDateTo && orderDate && orderDate > filterOrderDateTo) return false
                  } catch (e) {
                    console.warn('Invalid date:', o.createdAt)
                  }
                  
                  return true
                })
                
                return filtered.length === 0 ? (
                  <div className="bg-gray-50 p-8 text-center rounded">
                    <p className="text-gray-600">Không tìm thấy đơn hàng nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded shadow">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">Khách</th>
                          <th className="px-4 py-2 text-left">Người bán</th>
                          <th className="px-4 py-2 text-right">Tổng</th>
                          <th className="px-4 py-2 text-center">Trạng Thái</th>
                          <th className="px-4 py-2 text-left">Ngày</th>
                          <th className="px-4 py-2 text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered
                          .sort((a, b) => {
                          // Sort by createdAt (newest first)
                          try {
                            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                            return dateB - dateA
                          } catch (e) {
                            return 0
                          }
                        })
                          .map(o => (
                          <tr key={`order-${o.id}`} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-sm">{o.id}</td>
                            <td className="px-4 py-2">{o.customer_name}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 font-medium">
                                {o.seller || 'Quang Tâm'}
                              </span>
                            </td>
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
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                onClick={async () => {
                                  try {
                                    const fullOrder = await Api.adminGetOrder(token, o.id)
                                    setSelectedOrder({
                                      ...fullOrder,
                                      paid: !!(fullOrder.paid === true || fullOrder.paid === 1 || fullOrder.paid === '1'),
                                      items_json: mergeSimilarItems(fullOrder.items_json || [])
                                    })
                                  } catch(e) {
                                    console.error('Error loading order:', e)
                                    setSelectedOrder({
                                      ...o,
                                      paid: !!(o.paid === true || o.paid === 1 || o.paid === '1'),
                                      items_json: mergeSimilarItems(o.items_json || [])
                                    })
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
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {isUpdatingStatus && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg max-w-md w-full p-6" ref={statusUpdateFormRef}>
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
            <h2 className="text-2xl font-bold mb-4">Quản lý danh mục</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Kéo/sắp xếp danh mục bằng nút ⬆️⬇️, sau đó nhấn "Lưu thứ tự" để áp dụng cho menu và trang chủ.
              </div>
              <button
                onClick={saveCategoryOrder}
                disabled={!categoriesDirty}
                className={`px-4 py-2 rounded font-semibold shadow ${categoriesDirty ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                💾 Lưu thứ tự
              </button>
            </div>
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
                ➕ Thêm danh mục
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
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {editingCategoryId === cat.id ? (
                            <input 
                              type="text" 
                              defaultValue={cat.category}
                              onBlur={e => updateCategory(cat.id, e.target.value)}
                              onKeyPress={e => {
                                if (e.key === 'Enter') updateCategory(cat.id, e.target.value)
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
                            onClick={() => moveCategory(cat.id, 'up')}
                            disabled={idx === 0}
                            className={`px-2 py-1 rounded text-sm ${idx === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            ⬆️
                          </button>
                          <button 
                            onClick={() => moveCategory(cat.id, 'down')}
                            disabled={idx === categories.length - 1}
                            className={`px-2 py-1 rounded text-sm ${idx === categories.length - 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            ⬇️
                          </button>
                          <button 
                            onClick={() => setEditingCategoryId(cat.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            ✏️ Sửa
                          </button>
                          <button 
                            onClick={() => deleteCategory(cat.id)}
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

      {/* Admin Accounts Management */}
      {step === 'admins' && (
        <div>
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-2xl font-bold mb-4">Quản Lý Tài Khoản Admin</h2>
            
            {/* Add/Edit Form */}
            <div className="bg-gray-50 p-4 rounded mb-6">
              <h3 className="text-lg font-semibold mb-3">{editingAdminId ? '✏️ Sửa Tài Khoản' : '➕ Tạo Tài Khoản Mới'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tên đăng nhập</label>
                  <input 
                    type="text"
                    value={adminForm.username}
                    onChange={e => setAdminForm({...adminForm, username: e.target.value})}
                    placeholder="Nhập tên đăng nhập"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Mật khẩu {editingAdminId && <span className="text-sm text-gray-500">(Để trống nếu không đổi)</span>}
                  </label>
                  <input 
                    type="password"
                    value={adminForm.password}
                    onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                    placeholder={editingAdminId ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Vai trò</label>
                  <select
                    value={adminForm.role}
                    onChange={e => setAdminForm({...adminForm, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={saveAdmin}
                  disabled={!adminForm.username || (!editingAdminId && !adminForm.password)}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {editingAdminId ? '💾 Cập nhật' : '➕ Tạo tài khoản'}
                </button>
                {editingAdminId && (
                  <button 
                    onClick={cancelEditAdmin}
                    className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-medium"
                  >
                    ❌ Hủy
                  </button>
                )}
              </div>
            </div>

            {/* Admins List */}
            {admins.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded">
                <p className="text-gray-600">Chưa có tài khoản admin nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Tên đăng nhập</th>
                      <th className="px-4 py-2 text-left">Vai trò</th>
                      <th className="px-4 py-2 text-left">Ngày tạo</th>
                      <th className="px-4 py-2 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{admin.id}</td>
                        <td className="px-4 py-2 font-medium">{admin.username}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${admin.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {admin.role === 'admin' ? '👑 Admin' : '📋 Manager'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(admin.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-2 text-center space-x-2">
                          <button 
                            onClick={() => startEditAdmin(admin)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            ✏️ Sửa
                          </button>
                          <button 
                            onClick={() => showConfirm(`Xóa tài khoản "${admin.username}"?`, () => deleteAdmin(admin.id))}
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