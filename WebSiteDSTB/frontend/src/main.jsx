import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import './styles/index.css'
import Api from './services/api'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'

// Lazy load heavy components
const Invoice = lazy(() => import('./pages/Invoice'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminCustomers = lazy(() => import('./pages/AdminCustomers'))
const AdminImportCustomers = lazy(() => import('./pages/AdminImportCustomers'))
const Info = lazy(() => import('./pages/Info'))
const Search = lazy(() => import('./pages/Search'))
const Promo = lazy(() => import('./pages/Promo'))
const OrderGuide = lazy(() => import('./pages/OrderGuide'))
const OrderLookup = lazy(() => import('./pages/OrderLookup'))
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'))
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'))

// Helper to add cache-busting timestamp to image URLs
function addTimestampToUrl(url) {
  if (!url) return url
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
}

function SearchBox() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Clear search when navigating to home
  useEffect(() => {
    if (location.pathname === '/') {
      setQuery('')
    }
  }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch}>
      <div className="relative">
        <input 
          className="search-pill w-full px-4 py-2 rounded-full text-sm" 
          placeholder="Tìm sản phẩm..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-green-800 hover:scale-110 transition-transform" 
          type="submit"
        >
          🔍
        </button>
      </div>
    </form>
  )
}

function CartIcon() {
  const [count, setCount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [products, setProducts] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [animate, setAnimate] = useState(false)
  
  useEffect(() => {
    const updateCart = async (event) => {
      const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]')
      const totalItems = cart.filter(item => item.qty > 0).length
      setCount(totalItems)
      setCartItems(cart)
      
      // Trigger animation if event has animate flag
      if (event?.detail?.animate) {
        setAnimate(true)
        setTimeout(() => setAnimate(false), 600)
      }
      
      // Load product details for preview - with caching
      const cachedProducts = JSON.parse(localStorage.getItem('tb_product_cache') || '{}')
      const productData = {}
      const productsToFetch = []
      
      // Check cache first
      for (const item of cart) {
        if (cachedProducts[item.id]) {
          productData[item.id] = cachedProducts[item.id]
        } else {
          productsToFetch.push(item.id)
        }
      }
      
      // Fetch missing products from API
      if (productsToFetch.length > 0) {
        for (const productId of productsToFetch) {
          try {
            const product = await Api.product(productId)
            productData[productId] = product
            // Update cache
            cachedProducts[productId] = product
          } catch(err) {
            console.error('Failed to load product', productId, err)
          }
        }
        // Save updated cache
        localStorage.setItem('tb_product_cache', JSON.stringify(cachedProducts))
      }
      
      if (Object.keys(productData).length > 0) {
        setProducts(prev => ({ ...prev, ...productData }))
      }
    }
    
    // Handle product updates from admin
    const handleProductUpdate = async (event) => {
      const updatedProductId = event.detail?.productId
      if (updatedProductId) {
        try {
          const updatedProduct = await Api.product(updatedProductId)
          setProducts(prev => ({ ...prev, [updatedProductId]: updatedProduct }))
          // Update cache
          const cachedProducts = JSON.parse(localStorage.getItem('tb_product_cache') || '{}')
          cachedProducts[updatedProductId] = updatedProduct
          localStorage.setItem('tb_product_cache', JSON.stringify(cachedProducts))
        } catch(err) {
          console.error('Failed to reload product', updatedProductId, err)
        }
      }
    }
    
    updateCart()
    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCart)
    // Listen for product updates (when admin updates a product)
    window.addEventListener('productUpdated', handleProductUpdate)
    // Reduced polling from 1s to 3s for better performance
    const interval = setInterval(updateCart, 3000)
    
    return () => {
      window.removeEventListener('cartUpdated', updateCart)
      window.removeEventListener('productUpdated', handleProductUpdate)
      clearInterval(interval)
    }
  }, [])
  
  const subtotal = cartItems.reduce((s, item) => {
    if (item.qty <= 0) return s
    const product = products[item.id]
    const price = product ? (product.promo_price || product.price) : 0
    return s + price * item.qty
  }, 0)

  const totalQty = cartItems.filter(item => item.qty > 0).reduce((sum, item) => sum + item.qty, 0)
  
  return (
    <div className="relative group">
      <Link to="/cart" className={`icon-btn relative flex items-center justify-center ${animate ? 'animate-bounce-scale' : ''}`} title="Giỏ hàng">
        <span className="text-base sm:text-lg lg:text-xl flex-shrink-0">🛒</span>
        {totalQty > 0 && <span className="count">{totalQty}</span>}
      </Link>
      
      {/* Cart Preview Dropdown */}
      {count > 0 && (
        <div className="absolute right-0 top-full pt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-white">
              <h3 className="font-bold text-lg">Giỏ Hàng ({totalQty} sản phẩm)</h3>
            </div>
            
            {/* Cart Items */}
            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y">
                {cartItems.filter(item => item.qty > 0).map(item => {
                  const product = products[item.id]
                  const price = product ? (product.promo_price || product.price) : 0
                  // Prefer main image, fallback gallery[0]
                  let image = product?.image || product?.images?.[0] || 'https://via.placeholder.com/60'
                  // Add timestamp to bypass cache when displaying
                  image = addTimestampToUrl(image)
                  
                  return (
                    <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-3">
                        <img src={image} alt={product?.name || ''} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{product?.name || 'Đang tải...'}</p>
                          <p className="text-green-600 font-bold text-sm mt-1">{price.toLocaleString()}₫</p>
                          <p className="text-gray-500 text-xs mt-1">Số lượng: <span className="font-bold text-gray-700">{item.qty}</span></p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t bg-gray-50 p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-semibold">Tạm tính:</span>
                <span className="text-green-600 font-bold text-lg">{subtotal.toLocaleString()}₫</span>
              </div>
              <Link to="/cart" className="block w-full bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-2 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-md">
                Xem Giỏ Hàng →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PageWrapper({ children }) {
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  
  // Track previous location for cart referrer
  useEffect(() => {
    const previousLocation = sessionStorage.getItem('previousLocation')
    if (previousLocation && previousLocation !== location.pathname) {
      sessionStorage.setItem('cartReferrer', previousLocation)
    }
    sessionStorage.setItem('previousLocation', location.pathname)
  }, [location.pathname])
  
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  )
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    const toggleVisible = () => {
      const scrolled = document.documentElement.scrollTop
      setVisible(scrolled > 300)
    }
    
    window.addEventListener('scroll', toggleVisible)
    return () => window.removeEventListener('scroll', toggleVisible)
  }, [])
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  return (
    <>
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
      
      <a
        href="https://m.me/banlangdstb"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-40 right-8 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-bounce flex items-center justify-center text-white"
        aria-label="Chat Messenger"
        title="Chat với chúng tôi qua Messenger"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.912 1.446 5.51 3.707 7.197V22l3.475-1.908c.928.256 1.907.393 2.918.393 5.523 0 10-4.145 10-9.242C22 6.145 17.523 2 12 2zm.993 12.492l-2.548-2.718-4.973 2.718 5.467-5.799 2.61 2.718 4.911-2.718-5.467 5.799z"/>
        </svg>
      </a>
      <a
        href="https://zalo.me/0989948583"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-8 z-50 w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-bounce flex items-center justify-center"
        aria-label="Chat Zalo"
        title="Chat với chúng tôi qua Zalo"
      >
        <img src="https://res.cloudinary.com/drjxzsryz/image/upload/v1765269710/taybac/xuq5f34uoemmmxj2xh06.png" alt="Zalo" className="w-10 h-10 object-contain" />
      </a>
    </>
  )
}

function App(){
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const topbarRef = useRef(null)
  const headerRef = useRef(null)
  const [topbarHeight, setTopbarHeight] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [categories, setCategories] = useState([])
  const [productOpen, setProductOpen] = useState(false)

  // Track if token exists (don't auto-logout, let Admin page handle auth)
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('admin_token')
      setIsLoggedIn(!!token)
    }
    checkToken()
    const onStorage = () => checkToken()
    window.addEventListener('storage', onStorage)
    
    // Check token every 5 seconds to detect expiration
    const interval = setInterval(checkToken, 5000)
    
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }, [])

  // Load categories from API
  useEffect(() => {
    Api.categories().then(cats => {
      const categoryList = cats.map(c => c.category)
      setCategories(categoryList)
    }).catch(err => console.error('Failed to load categories:', err))
  }, [])

  function handleLogout() {
    localStorage.removeItem('admin_token')
    setIsLoggedIn(false)
    window.dispatchEvent(new Event('storage'))
    window.location.href = '/'
  }

  useEffect(()=>{
    const updateHeights = ()=>{
      const tb = topbarRef.current ? topbarRef.current.clientHeight : 0
      const hh = headerRef.current ? headerRef.current.clientHeight : 0
      setTopbarHeight(tb)
      setHeaderHeight(hh)
    }
    updateHeights()
    // Re-calculate when isLoggedIn changes
    const timer = setTimeout(updateHeights, 100)
    window.addEventListener('resize', updateHeights)
    return ()=> {
      clearTimeout(timer)
      window.removeEventListener('resize', updateHeights)
    }
  }, [isLoggedIn])

  useEffect(()=>{
    const onScroll = ()=>{
      const scrollY = window.scrollY || window.pageYOffset
      setIsSticky(scrollY > 10)
    }
    window.addEventListener('scroll', onScroll)
    return ()=> window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
      <header className="w-full z-40 top-0">
        {/* Topbar (fixed) */}
        <div ref={topbarRef} className="topbar" style={{position: 'fixed', top:0, left:0, right:0, zIndex:50}}>
          <div className="container mx-auto flex items-center justify-between px-4 py-2.5 text-sm">
            <div className="flex items-center gap-3 text-white flex-1 min-w-0">
              <span className="text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                Chào mừng bạn đến với Đặc Sản Sạch Tây Bắc!
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-white flex-shrink-0">
              <a href="tel:0989948583" className="hidden sm:inline font-semibold whitespace-nowrap text-xs sm:text-sm hover:scale-105 transition-transform">
                📞 098.994.8583
              </a>
              <a href="https://www.facebook.com/banlangdstb" target="_blank" rel="noopener noreferrer" className="hidden md:inline hover:scale-105 transition-transform">Facebook</a>
              {!isLoggedIn && (
                <Link to="/admin" className="inline bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap">🔑 Đăng nhập</Link>
              )}
              {isLoggedIn && (
                <button onClick={handleLogout} className="inline hover:underline hover:scale-105 transition-transform font-semibold">Đăng xuất</button>
              )}
            </div>
          </div>
        </div>
        {/* Main header (fixed below topbar) */}
        <div ref={headerRef} className="main-header" style={{ position: 'fixed', top: `${topbarHeight}px`, left:0, right:0, zIndex: 45 }}>
            <div className="container mx-auto px-4 py-3 lg:py-4">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-6 flex-1">
                  <button className="xl:hidden p-2 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0" onClick={()=>setMobileOpen(v=>!v)} aria-label="Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-green-800">
                      <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                    </svg>
                  </button>
                  <Link to="/" className="logo flex-shrink-0">Đặc Sản Sạch Tây Bắc</Link>
                  
                  {/* Main navigation next to logo - desktop only */}
                  <nav className="hidden xl:flex gap-1 xl:gap-2 items-center">
                    <Link to="/" className="nav-link whitespace-nowrap">Trang Chủ</Link>
                    <Link to="/info" className="nav-link whitespace-nowrap">Giới Thiệu</Link>
                  </nav>
                  
                  {/* Products dropdown - only on xl screens */}
                  <div 
                    className="hidden xl:block relative"
                    onMouseEnter={() => setProductOpen(true)}
                    onMouseLeave={() => setProductOpen(false)}
                  >
                    <button className="nav-link flex items-center gap-1 whitespace-nowrap">
                      Sản Phẩm
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`absolute left-0 top-full mt-2 min-w-[240px] max-w-xs transition-all duration-200 z-[9999] ${productOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                      <div className="bg-white rounded-md shadow-2xl py-1 border border-gray-100">
                        {categories.map(cat => (
                          <Link key={cat} to={`/category/${cat}`} className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700">{cat}</Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tra Cứu Đơn Hàng after Products dropdown */} 
                  <Link to="/order-lookup" className="hidden xl:block nav-link whitespace-nowrap">Tra Cứu Đơn Hàng</Link>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
                  <div className="hidden xl:block w-56 2xl:w-64 flex-shrink-0">
                    <SearchBox />
                  </div>
                  {isLoggedIn && (
                    <Link to="/admin" className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all text-xs sm:text-sm font-semibold whitespace-nowrap" title="Quản trị">
                      ⚙️ <span className="hidden sm:inline">Admin</span>
                    </Link>
                  )}
                  <CartIcon />
                </div>
              </div>
            </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="xl:hidden bg-white border-t shadow-md">
              <div className="px-4 py-3">
                <Link to="/" className="block py-2 border-b" onClick={()=>setMobileOpen(false)}>Trang chủ</Link>
                <Link to="/info" className="block py-2 border-b" onClick={()=>setMobileOpen(false)}>Giới thiệu</Link>
                <div className="py-2 border-b">
                  <button 
                    className="w-full text-left font-semibold text-gray-700 flex items-center justify-between"
                    onClick={(e) => {
                      e.currentTarget.nextElementSibling.classList.toggle('hidden')
                    }}
                  >
                    Sản phẩm
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="hidden">
                    {categories.map((cat, idx) => (
                      <Link key={cat} to={`/category/${cat}`} className={`block py-1 pl-4 text-gray-600 ${idx === 0 ? 'mt-2' : ''}`} onClick={()=>setMobileOpen(false)}>{cat}</Link>
                    ))}
                  </div>
                </div>
                <Link to="/order-lookup" className="block py-2 border-b" onClick={()=>setMobileOpen(false)}>Tra Cứu Đơn Hàng</Link>
                {isLoggedIn && (
                  <Link to="/admin" className="block py-2 border-b text-green-700 font-semibold" onClick={()=>setMobileOpen(false)}>
                    ⚙️ Trang quản trị
                  </Link>
                )}
                {!isLoggedIn && (
                  <Link 
                    to="/admin" 
                    className="block py-2 text-left text-blue-600 font-semibold border-b" 
                    onClick={()=>setMobileOpen(false)}
                  >
                    🔑 Đăng nhập
                  </Link>
                )}
                {isLoggedIn && (
                  <div className="pt-2">
                    <button 
                      onClick={() => { handleLogout(); setMobileOpen(false); }} 
                      className="w-full text-left px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow hover:from-red-600 hover:to-red-700"
                    >
                      ↩️ Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Search box below header on mobile */}
          <div className="xl:hidden bg-white border-t px-4 py-2">
            <SearchBox />
          </div>
        </div>
      </header>        <main className="min-h-screen" style={{ paddingTop: `${topbarHeight + headerHeight}px` }}>
          <PageWrapper>
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route path="/category/:cat" element={<Category/>} />
              <Route path="/product/:id" element={<Product/>} />
              <Route path="/cart" element={<Cart/>} />
              <Route path="/checkout" element={<Checkout/>} />
              <Route path="/invoice/:id" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><Invoice/></Suspense>} />
              <Route path="/order-lookup" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><OrderLookup/></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><Admin/></Suspense>} />
              <Route path="/admin/customers" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><AdminCustomers/></Suspense>} />
              <Route path="/admin/import-customers" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><AdminImportCustomers/></Suspense>} />
              <Route path="/info" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><Info/></Suspense>} />
              <Route path="/order-guide" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><OrderGuide/></Suspense>} />
              <Route path="/promo" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><Promo/></Suspense>} />
              <Route path="/search" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><Search/></Suspense>} />
              <Route path="/return-policy" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><ReturnPolicy/></Suspense>} />
              <Route path="/shipping-policy" element={<Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}><ShippingPolicy/></Suspense>} />
            </Routes>
          </PageWrapper>
        </main>

        <ScrollToTop />

        <footer className="bg-white pt-4 pb-6 border-t">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Brand info */}
              <div>
                <h3 className="text-xl font-bold text-orange-600 mb-3">Đặc Sản Sạch Tây Bắc</h3>
                <p className="text-gray-600 text-sm mb-3">Nơi cung cấp đặc sản Tây Bắc sạch, chất lượng cao.</p>
                <p className="text-gray-600 text-sm mb-1">📍  Tây Bắc, Việt Nam</p>
                <p className="text-gray-600 text-sm mb-1">📞 098.994.8583</p>
                <p className="text-gray-600 text-sm">✉️ contactdsstb@gmail.com</p>
              </div>
              {/* Links */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Danh mục</h4>
                <ul className="space-y-2 text-sm">
                  {categories.map(cat => (
                    <li key={cat}><Link to={`/category/${cat}`} className="text-gray-600 hover:text-orange-600">{cat}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Chính sách</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/return-policy" className="text-gray-600 hover:text-orange-600">Chính sách đổi trả</Link></li>
                  <li><Link to="/shipping-policy" className="text-gray-600 hover:text-orange-600">Chính sách vận chuyển</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Liên hệ hỗ trợ</h4>
                <p className="text-sm text-gray-600 mb-3">Hotline: <a href="tel:098.994.8583" className="text-orange-600 font-semibold">098.994.8583</a></p>
                <p className="text-sm text-gray-600 mb-3">Hoặc liên hệ qua Messenger và Zalo</p>
                <div className="flex gap-3">
                  <a href="https://www.facebook.com/banlangdstb" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors" title="Facebook">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://zalo.me/0989948583" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-all" title="Zalo">
                    <img src="https://res.cloudinary.com/drjxzsryz/image/upload/v1765269710/taybac/xuq5f34uoemmmxj2xh06.png" alt="Zalo" className="w-8 h-8 object-contain" />
                  </a>
                  <a href="https://m.me/banlangdstb" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all" title="Messenger">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.912 1.446 5.51 3.707 7.197V22l3.475-1.908c.928.256 1.907.393 2.918.393 5.523 0 10-4.145 10-9.242C22 6.145 17.523 2 12 2zm.993 12.492l-2.548-2.718-4.973 2.718 5.467-5.799 2.61 2.718 4.911-2.718-5.467 5.799z"/></svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t pt-6 text-center text-sm text-gray-500">
              <p>&copy; 2025 Đặc Sản Sạch Tây Bắc. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement._reactRoot) {
  rootElement._reactRoot = createRoot(rootElement)
}
rootElement._reactRoot.render(<App />)
