import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './styles/index.css'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Invoice from './pages/Invoice'
import Admin from './pages/Admin'
import Info from './pages/Info'
import Api from './services/api'

function App(){
  return (
    <BrowserRouter>
      <header className="header text-white fixed w-full z-20 top-0 shadow">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link to="/" className="font-bold text-lg">Đặc Sản Tây Bắc</Link>
          <nav className="hidden sm:flex gap-3">
            <Link to="/category/Thịt Gác Bếp" className="px-2 py-1 rounded hover:bg-white/10">Thịt Gác Bếp</Link>
            <Link to="/category/Đồ Khô" className="px-2 py-1 rounded hover:bg-white/10">Đồ Khô</Link>
            <Link to="/category/Rau Rừng – Gia Vị" className="px-2 py-1 rounded hover:bg-white/10">Rau Rừng – Gia Vị</Link>
            <Link to="/category/Rượu – Đồ Uống" className="px-2 py-1 rounded hover:bg-white/10">Rượu – Đồ Uống</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/admin" className="hidden sm:inline-block border px-2 py-1 rounded">Quản trị</Link>
          </div>
        </div>
      </header>

      <main className="pt-24 min-h-screen">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/category/:cat" element={<Category/>} />
          <Route path="/product/:id" element={<Product/>} />
          <Route path="/cart" element={<Cart/>} />
          <Route path="/checkout" element={<Checkout/>} />
          <Route path="/invoice/:id" element={<Invoice/>} />
          <Route path="/admin" element={<Admin/>} />
          <Route path="/info" element={<Info/>} />
        </Routes>
      </main>

      <footer className="p-6 text-center text-sm text-gray-600">© Đặc Sản Tây Bắc</footer>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)