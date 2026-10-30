import client from './client'

export const addressApi = {
  list: () => client.get('/addresses'),
  create: (payload) => client.post('/addresses', payload),
  update: (id, payload) => client.put(`/addresses/${id}`, payload),
  remove: (id) => client.delete(`/addresses/${id}`),
  setDefault: (id) => client.post(`/addresses/${id}/set-default`),
}
