import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001' })

export async function listAssets() {
  const r = await api.get('/api/assets')
  return r.data
}

export default api
