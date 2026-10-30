import axios from 'axios'

export function getErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (!error) return fallback
  if (error.code === 'ECONNABORTED') return 'Permintaan memakan waktu terlalu lama. Coba lagi.'
  if (!error.response) return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
  const message = error.response.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (error.response.status === 401) return 'Sesi Anda berakhir. Silakan masuk kembali.'
  if (error.response.status === 403) return 'Anda tidak memiliki akses ke tindakan ini.'
  if (error.response.status === 404) return 'Data tidak ditemukan.'
  if (error.response.status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar.'
  return fallback
}

export function isAxiosError(error) {
  return axios.isAxiosError(error)
}
