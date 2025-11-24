import axios from 'axios';
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });

export default {
  products: (q, category) => API.get('/products', { params: { q, category } }).then(r => r.data),
  product: (id) => API.get(`/products/${id}`).then(r => r.data),
  createOrder: (payload) => API.post('/orders', payload).then(r => r.data),
  orders: () => API.get('/orders').then(r => r.data),
  order: (id) => API.get(`/orders/${id}`).then(r => r.data),
  adminLogin: (u,p) => API.post('/admin/login', { username: u, password: p }).then(r => r.data),
  adminAddProduct: (token, payload) => API.post('/admin/products', payload, { headers: { Authorization: 'Bearer ' + token }}).then(r=>r.data)
}