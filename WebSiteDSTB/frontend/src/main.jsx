import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import './styles/index.css'
import Api from './services/api'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Invoice from './pages/Invoice'
import Admin from './pages/Admin'
import Info from './pages/Info'
import Search from './pages/Search'

function SearchBox() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

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
  
  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]')
      const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0)
      setCount(totalItems)
    }
    
    updateCount()
    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCount)
    const interval = setInterval(updateCount, 1000)
    
    return () => {
      window.removeEventListener('cartUpdated', updateCount)
      clearInterval(interval)
    }
  }, [])
  
  return (
    <Link to="/cart" className="icon-btn relative" title="Giỏ hàng">
      🛒
      {count > 0 && <span className="count">{count}</span>}
    </Link>
  )
}

function PageWrapper({ children }) {
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token')
      setIsLoggedIn(!!token)
    }
    checkAuth()
    // Listen for storage changes to update login state
    window.addEventListener('storage', checkAuth)
    // Check periodically for login state changes
    const interval = setInterval(checkAuth, 1000)
    return () => {
      window.removeEventListener('storage', checkAuth)
      clearInterval(interval)
    }
  }, [])

  // Load categories from API
  useEffect(() => {
    Api.categories().then(cats => {
      const categoryList = cats.map(c => c.category)
      // Custom sort order
      const order = ['Thịt Gác Bếp', 'Thịt nướng', 'Đồ Khô', 'Gạo', 'Rau Rừng – Gia Vị', 'Rượu – Đồ Uống']
      categoryList.sort((a, b) => {
        const indexA = order.indexOf(a)
        const indexB = order.indexOf(b)
        if (indexA === -1 && indexB === -1) return a.localeCompare(b)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
      setCategories(categoryList)
    }).catch(err => console.error('Failed to load categories:', err))
  }, [])

  function handleLogout() {
    localStorage.removeItem('admin_token')
    setIsLoggedIn(false)
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
    window.addEventListener('resize', updateHeights)
    return ()=> window.removeEventListener('resize', updateHeights)
  }, [])

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
              <a href="#" className="hidden md:inline hover:scale-105 transition-transform">Facebook</a>
              {isLoggedIn ? (
                <button onClick={handleLogout} className="hidden md:inline hover:underline hover:scale-105 transition-transform">Đăng xuất</button>
              ) : (
                <Link to="/admin" className="hidden md:inline hover:scale-105 transition-transform">Đăng nhập</Link>
              )}
            </div>
          </div>
        </div>          {/* Main header (fixed below topbar) */}
          <div ref={headerRef} className="main-header" style={{ position: 'fixed', top: `${topbarHeight}px`, left:0, right:0, zIndex: 45 }}>
            <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:py-4">
              <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
                <button className="lg:hidden p-2 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0" onClick={()=>setMobileOpen(v=>!v)} aria-label="Menu">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-green-800">
                    <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                  </svg>
                </button>
                <Link to="/" className="logo">Đặc Sản Sạch Tây Bắc</Link>
                
                {/* Main navigation next to logo - desktop only */}
                <nav className="hidden lg:flex gap-4 xl:gap-6 items-center">
                  <Link to="/" className="nav-link whitespace-nowrap">Trang Chủ</Link>
                  <Link to="/info" className="nav-link whitespace-nowrap">Giới Thiệu</Link>
                  <Link to="#" className="nav-link whitespace-nowrap">Khuyến mãi HOT</Link>
                  <div className="relative group">
                    <button className="nav-link flex items-center gap-1 whitespace-nowrap">
                      Sản phẩm
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute left-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white rounded-md shadow-lg py-1">
                        {categories.map(cat => (
                          <Link key={cat} to={`/category/${cat}`} className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700">{cat}</Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </nav>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
                <div className="hidden md:block w-40 lg:w-64">
                  <SearchBox />
                </div>
                {isLoggedIn && (
                  <Link to="/admin" className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all text-sm" title="Quản trị">
                    ⚙️ <span className="font-semibold hidden sm:inline">Admin</span>
                  </Link>
                )}
                <CartIcon />
              </div>
            </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="lg:hidden bg-white border-t shadow-md">
              <div className="px-4 py-3">
                <Link to="/" className="block py-2 border-b" onClick={()=>setMobileOpen(false)}>Trang Chủ</Link>
                <Link to="/info" className="block py-2 border-b" onClick={()=>setMobileOpen(false)}>Giới Thiệu</Link>
                <Link to="#" className="block py-2 border-b" onClick={()=>setMobileOpen(false)}>Khuyến mãi HOT</Link>
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
                {isLoggedIn ? (
                  <>
                    <Link to="/admin" className="block py-2 border-b text-green-700 font-semibold" onClick={()=>setMobileOpen(false)}>
                      ⚙️ Trang quản trị
                    </Link>
                    <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left py-2 border-b text-gray-700">Đăng xuất</button>
                  </>
                ) : (
                  <Link to="/admin" className="block py-2 border-b" onClick={()=>setMobileOpen(false)}>Đăng nhập</Link>
                )}
              </div>
            </div>
          )}
          
          {/* Search box below header on mobile */}
          <div className="lg:hidden bg-white border-t px-4 py-2">
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
              <Route path="/invoice/:id" element={<Invoice/>} />
              <Route path="/admin" element={<Admin/>} />
              <Route path="/info" element={<Info/>} />
              <Route path="/search" element={<Search/>} />
            </Routes>
          </PageWrapper>
        </main>

        <ScrollToTop />

        <footer className="bg-white pt-12 pb-6 border-t">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand info */}
              <div>
                <h3 className="text-xl font-bold text-orange-600 mb-3">🦕 Đặc Sản Sạch Tây Bắc</h3>
                <p className="text-gray-600 text-sm mb-3">Nơi cung cấp đặc sản Tây Bắc sạch, chất lượng cao.</p>
                <p className="text-gray-600 text-sm mb-1">📍 Tây Bắc, Việt Nam</p>
                <p className="text-gray-600 text-sm mb-1">📞 098.994.8583</p>
                <p className="text-gray-600 text-sm">✉️ contact@taybac.vn</p>
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
                  <li><a href="#" className="text-gray-600 hover:text-orange-600">Chính sách đổi trả</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-orange-600">Chính sách vận chuyển</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-orange-600">Chính sách bảo mật</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-orange-600">Điều khoản sử dụng</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Kết nối</h4>
                <p className="text-sm text-gray-600 mb-3">Theo dõi chúng tôi trên mạng xã hội</p>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">f</a>
                  <a href="#" className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors">Y</a>
                  <a href="#" className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition-colors">📷</a>
                </div>
              </div>
            </div>
            <div className="border-t pt-6 text-center text-sm text-gray-500">
              <p>&copy; 2024 Đặc Sản Sạch Tây Bắc. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
