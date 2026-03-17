import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// User endpoints
export const users = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
}

// Watchlist endpoints
export const watchlists = {
  list: (userId) => api.get(`/users/${userId}/watchlists`),
  get: (id) => api.get(`/watchlists/${id}`),
  create: (userId, data) => api.post(`/watchlists?user_id=${userId}`, data),
  update: (id, data, userId) => api.put(`/watchlists/${id}`, data, { params: { user_id: userId } }),
  delete: (id, userId) => api.delete(`/watchlists/${id}`, { params: { user_id: userId } }),

  // Stocks in watchlist
  addStock: (watchlistId, data, userId) => api.post(`/watchlists/${watchlistId}/stocks`, data, { params: { user_id: userId } }),
  updateStock: (watchlistId, stockId, data, userId) => api.put(`/watchlists/${watchlistId}/stocks/${stockId}`, data, { params: { user_id: userId } }),
  removeStock: (watchlistId, stockId, userId) => api.delete(`/watchlists/${watchlistId}/stocks/${stockId}`, { params: { user_id: userId } })
}

// Brokerage account endpoints
export const accounts = {
  list: (userId) => api.get(`/users/${userId}/accounts`),
  get: (id) => api.get(`/accounts/${id}`),
  create: (userId, data) => api.post(`/accounts?user_id=${userId}`, data),
  update: (id, data, userId) => api.put(`/accounts/${id}`, data, { params: { user_id: userId } }),
  delete: (id, userId) => api.delete(`/accounts/${id}`, { params: { user_id: userId } })
}

// Holdings endpoints
export const holdings = {
  list: (userId) => api.get(`/users/${userId}/holdings`),
  getPerformance: (userId) => api.get(`/users/${userId}/holdings-performance`),
  get: (id) => api.get(`/holdings/${id}`),
  create: (userId, data) => api.post(`/holdings?user_id=${userId}`, data),
  update: (id, data, userId) => api.put(`/holdings/${id}`, data, { params: { user_id: userId } }),
  delete: (id, userId) => api.delete(`/holdings/${id}`, { params: { user_id: userId } })
}

// Stock endpoints
export const stocks = {
  search: (query, limit = 10) => api.get(`/stocks/search?q=${query}&limit=${limit}`),
  getQuote: (ticker) => api.get(`/stocks/${ticker}/quote`),
  getDetail: (ticker) => api.get(`/stocks/${ticker}/detail`),
  getHistory: (ticker, days = 30) => api.get(`/stocks/${ticker}/history?days=${days}`)
}

// Sell transactions endpoints
export const sellTransactions = {
  list: (userId) => api.get(`/sell-transactions/users/${userId}/transactions`),
  get: (id) => api.get(`/sell-transactions/${id}`),
  create: (userId, data) => api.post(`/sell-transactions?user_id=${userId}`, data),
  update: (id, data, userId) => api.put(`/sell-transactions/${id}`, data, { params: { user_id: userId } }),
  delete: (id, userId) => api.delete(`/sell-transactions/${id}`, { params: { user_id: userId } })
}

// AI endpoints
export const ai = {
  analyzeThesis: (data) => api.post('/ai/analyze-thesis', data, { timeout: 30000 }),
  draftThesis: (ticker) => api.post('/ai/draft-thesis', { ticker }, { timeout: 30000 })
}

export default api
