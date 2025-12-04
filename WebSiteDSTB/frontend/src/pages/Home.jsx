import React, { useEffect, useState, useRef } from 'react'
import Api from '../services/api'
import { Link } from 'react-router-dom'

export default function Home()
{
  const [items, setItems] = useState([])
  const [slide, setSlide] = useState(0)
  const slides = [
    { title: 'Cùng Đặc Sản Tây Bắc', subtitle: 'Khám phá hương vị núi rừng', image: '/images/bg-1.jpg' },
    { title: 'Sản phẩm chất lượng', subtitle: 'Rau rừng - Thịt gác bếp - Rượu vùng cao', image: '/images/bg-2.jpg' },
    { title: 'Ưu đãi mỗi ngày', subtitle: 'Giảm giá, combo & quà tặng', image: '/images/bg-3.jpg' }
  ]
  const timerRef = useRef(null)
  useEffect(()=>{ Api.products().then(setItems) },[])
  useEffect(()=>{
    timerRef.current = setInterval(()=>{
      setSlide(s => (s+1) % slides.length)
    }, 4000)
    return ()=> clearInterval(timerRef.current)
  }, [])
  return (
    <div>
      <section className="hero container mx-auto px-4 py-6 md:py-10">
        <div className="hero-slider relative overflow-hidden">
          {slides.map((s, i)=> (
            <div key={i} className={"hero-slide absolute inset-0 transition-opacity duration-1000 " + (i===slide ? 'opacity-100 z-10' : 'opacity-0 z-0')}>
              <img src={s.image} alt={s.title} className="hero-image absolute inset-0 w-full h-full object-cover" />
              <div className="hero-overlay absolute inset-0 flex items-center">
                <div className="max-w-2xl animate-fade-in">
                  <h1 className="drop-shadow-2xl text-white font-extrabold">{s.title}</h1>
                  <p className="mt-3 text-lg md:text-2xl text-white font-bold drop-shadow-lg">{s.subtitle}</p>
                  <button className="mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    Xem thêm →
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <button 
              onClick={()=>setSlide(s=> (s-1+slides.length)%slides.length)} 
              className="p-3 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
              aria-label="Previous slide"
            >
              <svg className="w-5 h-5 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={()=>setSlide(s=> (s+1)%slides.length)} 
              className="p-3 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
              aria-label="Next slide"
            >
              <svg className="w-5 h-5 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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

      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            Sản phẩm nổi bật
          </h2>
          <Link to="#" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1">
            Xem tất cả
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(p => {
            const oldPrice = Math.round(p.price * 1.18)
            return (
              <Link key={p.id} to={'/product/'+p.id} className="product-card group">
                <div className="relative overflow-hidden">
                  {
                    (()=>{
                      // If backend already gave an absolute URL or leading slash, use it directly.
                      // Provide client-side fallbacks when backend doesn't supply image filenames
                      const fallbackMap = {
                        'gác': '/images/products/trau_gac_bep.jpg',
                        'gac': '/images/products/trau_gac_bep.jpg',
                        'măng': '/images/products/mang_kho.jpg',
                        'mang': '/images/products/mang_kho.jpg'
                      }
                      if(!p.image){
                        const name = (p.name || '').toLowerCase()
                        for(const key of Object.keys(fallbackMap)){
                          if(name.includes(key)){
                            return <img src={fallbackMap[key]} alt={p.name} className="product-image w-full h-56 object-cover" />
                          }
                        }
                        // default empty placeholder box
                        return <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl">📦</span>
                        </div>
                      }
                      const img = (typeof p.image === 'string') ? p.image : ''
                      const src = img.startsWith('http') || img.startsWith('/') ? img : `/images/products/${img}`
                      return <img src={src} alt={p.name} className="product-image w-full h-56 object-cover" />
                    })()
                  }
                  <div className="absolute top-3 left-3 price-badge bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    -{Math.round((oldPrice - p.price)/oldPrice*100)}%
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">{p.category}</div>
                  <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">{p.name}</h3>
                  <div className="mt-auto">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xl font-bold text-orange-600">{p.price.toLocaleString()}₫</div>
                        <div className="text-xs text-gray-400 line-through">{oldPrice.toLocaleString()}₫</div>
                      </div>
                      <button 
                        onClick={(e) => { e.preventDefault(); window.location.href = '/product/'+p.id }} 
                        className="icon-circle bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                        aria-label="Add to cart"
                      >
                        🛒
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

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

      {/* Category Showcase */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-4xl">🏷️</span>
              Danh Mục Sản Phẩm
            </h2>
            <Link to="#" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1">
              Xem tất cả
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {name: 'Thịt Gác Bếp', icon: '🥓'},
              {name: 'Đồ Khô', icon: '🌰'},
              {name: 'Rau Rừng – Gia Vị', icon: '🌿'},
              {name: 'Rượu – Đồ Uống', icon: '🍷'},
              {name: 'Gạo', icon: '🌾'},
              {name: 'Combo', icon: '🎁'}
            ].map((cat, i)=> (
              <Link 
                key={i} 
                to={'/category/'+cat.name} 
                className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl shadow-md text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:from-orange-100 hover:to-red-100 group"
              >
                <div className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-300">{cat.icon}</div>
                <p className="font-bold text-gray-800 text-sm">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}