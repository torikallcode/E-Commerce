import client from './client'

export const adminApi = {
  summary: () => client.get('/admin/dashboard/summary'),
  users: (params) => client.get('/admin/users', { params }),

  products: (params) => client.get('/admin/products', { params }),
  createProduct: (payload) => client.post('/admin/products', payload),
  updateProduct: (id, payload) => client.put(`/admin/products/${id}`, payload),
  deleteProduct: (id) => client.delete(`/admin/products/${id}`),
  uploadProductImage: (id, file, sortOrder = 0) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sort_order', String(sortOrder))
    return client.post(`/admin/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  addProductImageUrl: (id, payload) => client.post(`/admin/products/${id}/images`, payload),
  deleteProductImage: (id, imageId) => client.delete(`/admin/products/${id}/images/${imageId}`),

  categories: () => client.get('/admin/categories'),
  createCategory: (payload) => client.post('/admin/categories', payload),
  updateCategory: (id, payload) => client.put(`/admin/categories/${id}`, payload),
  deleteCategory: (id) => client.delete(`/admin/categories/${id}`),

  orders: (params) => client.get('/admin/orders', { params }),
  order: (id) => client.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, payload) => client.patch(`/admin/orders/${id}/status`, payload),
}
