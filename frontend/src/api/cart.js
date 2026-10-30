import client from './client'

export const cartApi = {
  get: () => client.get('/cart'),
  addItem: (payload) => client.post('/cart/items', payload),
  updateItem: (productId, quantity) => client.put(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId) => client.delete(`/cart/items/${productId}`),
}
