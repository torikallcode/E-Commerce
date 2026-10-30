import client from './client'

export const productApi = {
  list: (params) => client.get('/products', { params }),
  get: (slug) => client.get(`/products/${slug}`),
  categories: () => client.get('/categories'),
}
