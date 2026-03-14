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
  update: (id, data) => api.put(`/watchlists/${id}`, data),
  delete: (id) => api.delete(`/watchlists/${id}`),

  // Stocks in watchlist
  addStock: (watchlistId, data) => api.post(`/watchlists/${watchlistId}/stocks`, data),
  updateStock: (watchlistId, stockId, data) => api.put(`/watchlists/${watchlistId}/stocks/${stockId}`, data),
  removeStock: (watchlistId, stockId) => api.delete(`/watchlists/${watchlistId}/stocks/${stockId}`)
}

// Brokerage account endpoints
export const accounts = {
  list: (userId) => api.get(`/users/${userId}/accounts`),
  get: (id) => api.get(`/accounts/${id}`),
  create: (userId, data) => api.post(`/accounts?user_id=${userId}`, data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`)
}

// Holdings endpoints
export const holdings = {
  list: (userId) => api.get(`/users/${userId}/holdings`),
  getPerformance: (userId) => api.get(`/users/${userId}/holdings-performance`),
  get: (id) => api.get(`/holdings/${id}`),
  create: (userId, data) => api.post(`/holdings?user_id=${userId}`, data),
  update: (id, data) => api.put(`/holdings/${id}`, data),
  delete: (id) => api.delete(`/holdings/${id}`)
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
  update: (id, data) => api.put(`/sell-transactions/${id}`, data),
  delete: (id) => api.delete(`/sell-transactions/${id}`)
}

// AI endpoints
export const ai = {
  analyzeThesis: (data) => api.post('/ai/analyze-thesis', data, { timeout: 30000 }),
  draftThesis: (ticker) => api.post('/ai/draft-thesis', { ticker }, { timeout: 30000 })
}

export default api
