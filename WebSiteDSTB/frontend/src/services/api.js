import axios from 'axios';
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });

// Add response interceptor to handle 401 errors (token expired)
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it from localStorage
      localStorage.removeItem('admin_token')
      // Dispatch event to update UI
      window.dispatchEvent(new Event('storage'))
    }
    return Promise.reject(error)
  }
)

export default {
  // Products (public)
  products: (q, category) => API.get('/products', { params: { q, category } }).then(r => r.data),
  product: (id) => API.get(`/products/${id}`).then(r => r.data),
  categories: () => API.get('/products/categories').then(r => r.data),
  
  // Orders (public)
  createOrder: (payload) => API.post('/orders', payload).then(r => r.data),
  orders: () => API.get('/orders').then(r => r.data),
  order: (id) => API.get(`/orders/${id}`).then(r => r.data),
  
  // Admin - Auth
  adminLogin: (u,p) => API.post('/admin/login', { username: u, password: p }).then(r => r.data),
  adminMe: (token) => API.get('/admin/me', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.data),
  
  // Admin - Upload
  adminUploadImage: (token, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return API.post('/admin/upload-image', formData, { 
      headers: { 
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data'
      }
    }).then(r => r.data);
  },
  
  // Admin - Products
  adminGetProducts: (token) => API.get('/admin/products', { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminGetProduct: (token, id) => API.get(`/admin/products/${id}`, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminAddProduct: (token, payload) => API.post('/admin/products', payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminUpdateProduct: (token, id, payload) => API.put(`/admin/products/${id}`, payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminDeleteProduct: (token, id) => API.delete(`/admin/products/${id}`, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  
  // Admin - Orders
  adminGetOrders: (token) => API.get('/admin/orders', { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminGetOrder: (token, id) => API.get(`/admin/orders/${id}`, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminCreateOrder: (token, payload) => API.post('/admin/orders', payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminMarkOrderPaid: (token, id) => API.patch(`/admin/orders/${id}/mark-paid`, {}, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminMarkOrderUnpaid: (token, id) => API.patch(`/admin/orders/${id}/mark-unpaid`, {}, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminDeleteOrder: (token, id) => API.delete(`/admin/orders/${id}`, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data)
  ,
  adminUpdateOrder: (token, id, payload) => API.patch(`/admin/orders/${id}`, payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminGetStats: (token, period) => API.get('/admin/stats', { headers: { Authorization: 'Bearer ' + token }, params: { period } }).then(r => r.data),
  
  // Admin - Categories
  adminGetCategories: (token) => API.get('/admin/categories', { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminAddCategory: (token, category) => API.post('/admin/categories', { category }, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminUpdateCategory: (token, id, category) => API.put(`/admin/categories/${id}`, { category }, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminDeleteCategory: (token, id) => API.delete(`/admin/categories/${id}`, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminReorderCategories: (token, order) => API.post('/admin/categories/reorder', { order }, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),

  // Admin - Admins
  adminGetAdmins: (token) => API.get('/admin/admins', { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminCreateAdmin: (token, payload) => API.post('/admin/admins', payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminUpdateAdmin: (token, id, payload) => API.put(`/admin/admins/${id}`, payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminDeleteAdmin: (token, id) => API.delete(`/admin/admins/${id}`, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),

  // Admin - Customers
  adminGetCustomers: (token) => API.get('/admin/customers', { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminCreateCustomer: (token, payload) => API.post('/admin/customers', payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminUpdateCustomer: (token, id, payload) => API.put(`/admin/customers/${id}`, payload, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data),
  adminDeleteCustomer: (token, id) => API.delete(`/admin/customers/${id}`, { headers: { Authorization: 'Bearer ' + token }}).then(r => r.data)
}