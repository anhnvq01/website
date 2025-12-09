import React, { useEffect, useState, useRef } from 'react'
import Api from '../services/api'
import { Link } from 'react-router-dom'

const normalizeText = (str) => (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Helper component for product card
export function ProductCard({ product, showSoldCount = true }) {
  // Calculate discount: price is original price, promo_price is discounted price
  const oldPrice = product.price
  const salePrice = product.promo_price || product.price
  const discountPercent = product.promo_price && product.promo_price < product.price ? Math.round((product.price - product.promo_price) / product.price * 100) : 0
  
  const navigate = (path) => {
    window.location.href = path
  }

  return (
    <div 
      className="product-card group cursor-pointer"
      onClick={() => navigate('/product/' + product.id)}
    >
      <div className="relative overflow-hidden rounded-lg">
        {(()=>{
          const fallbackMap = {'gác': '/images/products/trau_gac_bep.jpg','gac': '/images/products/trau_gac_bep.jpg','măng': '/images/products/mang_kho.jpg','mang': '/images/products/mang_kho.jpg'}
          if(!product.image){
            const name = (product.name || '').toLowerCase()
            for(const key of Object.keys(fallbackMap)){
              if(name.includes(key)){return <img src={fallbackMap[key]} alt={product.name} className="product-image w-full aspect-square object-cover" />}
            }
            return <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><span className="text-gray-400 text-4xl">📦</span></div>
          }
          const img = (typeof product.image === 'string') ? product.image : ''
          const src = img.startsWith('http') || img.startsWith('/') ? img : `/images/products/${img}`
          return <img src={src} alt={product.name} className="product-image w-full aspect-square object-cover" />
        })()}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 price-badge bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            -{discountPercent}%
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span 
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/category/${product.category}`)
          }}
          className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1 hover:text-orange-700 transition-colors w-fit cursor-pointer"
        >
          {product.category}
        </span>
        <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">{product.name}</h3>
        {showSoldCount && (
          <div className="text-xs text-gray-500 mb-1">Đã bán: <span className="font-semibold text-orange-600">{product.sold_count || 0}</span></div>
        )}
        <div className="mt-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xl font-bold text-orange-600">{salePrice.toLocaleString()}₫</div>
              {discountPercent > 0 && (
                <div className="text-xs text-gray-400 line-through">{oldPrice.toLocaleString()}₫</div>
              )}
            </div>
            <button 
              onClick={(e) => { 
                e.preventDefault()
                e.stopPropagation()
                // Add to cart with quantity 1
                const cart = JSON.parse(localStorage.getItem('tb_cart')||'[]')
                const found = cart.find(x=>x.id===product.id)
                if(found) found.qty += 1; else cart.push({id: product.id, qty: 1})
                localStorage.setItem('tb_cart', JSON.stringify(cart))
                
                // Trigger cart update event with animation
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { animate: true } }))
              }} 
              className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105 transition-transform px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap flex-shrink-0 min-h-[44px]"
              aria-label="Add to cart"
              title="Thêm sản phẩm vào giỏ"
            >
              <span className="text-lg">🛒</span>
              <span className="hidden sm:inline">Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home()
{
  const [items, setItems] = useState([])
  const [topSelling, setTopSelling] = useState([])
  const [hotPromo, setHotPromo] = useState([])
  const [tetProducts, setTetProducts] = useState([])
  const [categoryProducts, setCategoryProducts] = useState({})
  const [categoryList, setCategoryList] = useState([])
  const [slide, setSlide] = useState(0)
  const slides = [
    { title: 'Cùng Đặc Sản Sạch Tây Bắc', subtitle: 'Khám phá hương vị núi rừng', image: 'https://res.cloudinary.com/drjxzsryz/image/upload/v1765267677/taybac/i23j5dgeyktidv9tbvup.jpg', showText: true },
    { title: 'Sản phẩm chất lượng cao', subtitle: 'Rau rừng - Thịt gác bếp - Rượu vùng cao', image: 'https://res.cloudinary.com/drjxzsryz/image/upload/v1765267679/taybac/ilork8jhjfafjzxr0w27.jpg', showText: true },
    { title: 'Ưu đãi mỗi ngày', subtitle: 'Giảm giá, combo & quà tặng', image: 'https://res.cloudinary.com/drjxzsryz/image/upload/v1765267680/taybac/yna9syfiwfrcu8yn0bqz.jpg', showText: true },
    { title: '', subtitle: '', image: '/images/bg-4.png', showText: false }
  ]
  const tetCategoryName = 'Tết Nguyên Đán'
  const MAX_TOP = 10
  const MAX_TET = 12
  const MAX_PROMO = 8
  const timerRef = useRef(null)
  const defaultCategories = ['Thịt Gác Bếp', 'Thịt Nướng', 'Đồ Khô', 'Rau Rừng – Gia Vị', 'Rượu – Đồ Uống', 'Gạo']
  
  useEffect(()=>{ 
    const load = async () => {
      try {
        const [cats, allProducts] = await Promise.all([Api.categories(), Api.products()])
        const orderedCats = (cats || []).map(c => c.category).filter(Boolean)
        const catList = orderedCats.length ? orderedCats : defaultCategories
        setCategoryList(catList)
        setItems(allProducts)
        
        // Top Selling - sorted by sold_count DESC
        const sorted = [...allProducts].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
        setTopSelling(sorted.slice(0, MAX_TOP))

        // Hot Promo - promo_price is discounted price
        const promoSorted = [...allProducts]
          .filter(p => p.promo_price && p.promo_price < p.price)
          .map(p => ({
            ...p,
            _discount: Math.round((p.price - p.promo_price) / p.price * 100)
          }))
          .sort((a, b) => b._discount - a._discount)
        setHotPromo(promoSorted.slice(0, MAX_PROMO))

        // Tet products (is_tet flag is true)
        const tetList = allProducts.filter(p => p.is_tet === 1 || p.is_tet === true)
        setTetProducts(tetList.slice(0, MAX_TET))
        
        // Group by categories
        const grouped = {}
        catList.forEach(cat => {
          grouped[cat] = allProducts.filter(p => p.category === cat).slice(0, 12)
        })
        setCategoryProducts(grouped)
      } catch (err) {
        console.error('Load home data error:', err)
        setCategoryList(defaultCategories)
      }
    }
    load()
  },[])
  
  useEffect(()=>{
    timerRef.current = setInterval(()=>{
      setSlide(s => (s+1) % slides.length)
    }, 8000)
    return ()=> clearInterval(timerRef.current)
  }, [])
  
  return (
    <div>
      <section className="hero w-full h-72 md:h-96 lg:h-[38rem] mb-2">
        <div className="hero-slider relative w-full h-full overflow-hidden rounded-b-2xl">
          {slides.map((s, i)=> (
            <div key={i} className={"hero-slide absolute inset-0 transition-opacity duration-1000 " + (i===slide ? 'opacity-100 z-10' : 'opacity-0 z-0')}>
              <img 
                src={s.image} 
                alt={s.title} 
                className="hero-image absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              {s.showText && (
                <div className="absolute inset-0 flex items-center justify-start pl-8 md:pl-16 lg:pl-24">
                  <div className="max-w-3xl animate-fade-in">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-3 text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.7)] whitespace-nowrap">{s.title}</h1>
                    <p className="text-lg md:text-2xl lg:text-3xl font-bold leading-relaxed text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">{s.subtitle}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Navigation buttons */}
          <button 
            onClick={()=>setSlide(s=> (s-1+slides.length)%slides.length)} 
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={()=>setSlide(s=> (s+1)%slides.length)} 
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Slide indicators */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === slide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category Showcase - removed from top, will be at bottom */}

      {/* Hot Promotions */}
      {hotPromo.length > 0 && (
        <section className="container mx-auto px-4 pt-4 pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">💥</span>
              <span className="leading-tight">Danh mục sản phẩm khuyến mãi HOT</span>
            </h2>
            <Link to="/promo" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1 text-sm md:text-base whitespace-nowrap">
              Xem tất cả
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotPromo.map(p => <ProductCard key={p.id} product={p} showSoldCount={false} />)}
          </div>
        </section>
      )}

      {/* Tet Products Section */}
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
              <span className="text-3xl md:text-4xl">🎉</span>
              <span>Sản phẩm phục vụ Tết</span>
            </h2>
            <Link to={`/category/${tetCategoryName}`} className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1 text-sm md:text-base">
              Xem tất cả
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {tetProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-600">Chưa có sản phẩm Tết được gắn nhãn.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tetProducts.map(p => <ProductCard key={p.id} product={p} showSoldCount={true} />)}
            </div>
          )}
        </div>
      </section>

      {/* Top Selling Products */}
      <div className="container mx-auto p-4 pt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            Sản phẩm bán chạy nhất
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {topSelling.map(p => <ProductCard key={p.id} product={p} showSoldCount={true} />)}
        </div>
      </div>

      {/* Category Sections */}
      {categoryList.map((cat, idx) => (
        categoryProducts[cat] && categoryProducts[cat].length > 0 && (
          <section key={cat} className={`py-16 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-4xl">{['🥓','🔥','🌰','🌿','🍷','🌾'][idx]}</span>
                  {cat}
                </h2>
                <Link to={`/category/${cat}`} className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1 text-sm md:text-base">
                  Xem tất cả
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryProducts[cat].map(p => <ProductCard key={p.id} product={p} showSoldCount={true} />)}
              </div>
            </div>
          </section>
        )
      ))}

      {/* About Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
            Tại sao chọn chúng tôi?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-6xl mb-4 animate-bounce">🌾</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">Đa dạng sản phẩm</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Cung cấp nhiều loại đặc sản Tây Bắc chất lượng cao từ các vùng núi.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-6xl mb-4 animate-bounce" style={{animationDelay: '0.1s'}}>✅</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">Chất lượng đảm bảo</h3>
              <p className="text-gray-600 text-sm leading-relaxed">100% sản phẩm tự nhiên, không chất bảo quản, an toàn cho sức khỏe.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-6xl mb-4 animate-bounce" style={{animationDelay: '0.2s'}}>🎉</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">Khuyến mãi hấp dẫn</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Thường xuyên có ưu đãi, giảm giá và quà tặng cho khách hàng thân thiết.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-6xl mb-4 animate-bounce" style={{animationDelay: '0.3s'}}>🚚</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">Giao hàng nhanh</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Giao hàng toàn quốc, đóng gói cẩn thận, đảm bảo sản phẩm nguyên vẹn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase - at bottom */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-4xl">🏷️</span>
              Danh mục sản phẩm
            </h2>
            <Link to="#" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1">
              Xem tất cả
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(categoryList.length ? categoryList : defaultCategories).map((name, i)=> (
              <Link 
                key={i} 
                to={'/category/'+name} 
                className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl shadow-md text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:from-orange-100 hover:to-red-100 group"
              >
                <div className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-300">🏷️</div>
                <p className="font-bold text-gray-800 text-sm">{name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
