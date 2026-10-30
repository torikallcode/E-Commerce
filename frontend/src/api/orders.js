import client from './client'

export const orderApi = {
  checkout: (payload) => client.post('/orders', payload),
  list: (params) => client.get('/orders', { params }),
  get: (orderNumber) => client.get(`/orders/${orderNumber}`),
  cancel: (orderNumber) => client.post(`/orders/${orderNumber}/cancel`),
  paymentStatus: (orderNumber) => client.get(`/orders/${orderNumber}/payment-status`),
}

export const paymentApi = {
  devSettle: (orderNumber) => client.post(`/dev/payments/${orderNumber}/settle`),
}
