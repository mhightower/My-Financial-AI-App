import axios from 'axios'
import { useErrorStore } from '../stores/error'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorStore = useErrorStore()

    let message = 'An unexpected error occurred.'

    if (error.response) {
      const { status, data } = error.response
      const detail = data?.detail || data?.message

      if (status === 400) {
        message = detail || 'Bad request. Please check your input.'
      } else if (status === 401) {
        message = 'Unauthorized. Please log in again.'
      } else if (status === 403) {
        message = 'You do not have permission to perform this action.'
      } else if (status === 404) {
        message = detail || 'The requested resource was not found.'
      } else if (status === 422) {
        message = detail || 'Validation failed. Please check your input.'
      } else if (status >= 500) {
        message = 'Server error. Please try again later.'
      } else {
        message = detail || `Request failed (${status}).`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Please check your connection and try again.'
    } else if (!error.response) {
      message = 'Network error. Please check your connection.'
    }

    errorStore.addError(message, 'error', error.response?.status >= 500 ? 8000 : 5000)

    return Promise.reject(error)
  }
)

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
  get: (id, userId) => api.get(`/watchlists/${id}`, { params: { user_id: userId } }),
  create: (userId, data) => api.post('/watchlists', data, { params: { user_id: userId } }),
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
  get: (id, userId) => api.get(`/accounts/${id}`, { params: { user_id: userId } }),
  create: (userId, data) => api.post('/accounts', data, { params: { user_id: userId } }),
  update: (id, data, userId) => api.put(`/accounts/${id}`, data, { params: { user_id: userId } }),
  delete: (id, userId) => api.delete(`/accounts/${id}`, { params: { user_id: userId } })
}

// Holdings endpoints
export const holdings = {
  list: (userId) => api.get(`/users/${userId}/holdings`),
  getPerformance: (userId) => api.get(`/users/${userId}/holdings-performance`),
  get: (id, userId) => api.get(`/holdings/${id}`, { params: { user_id: userId } }),
  create: (userId, data) => api.post('/holdings', data, { params: { user_id: userId } }),
  update: (id, data, userId) => api.put(`/holdings/${id}`, data, { params: { user_id: userId } }),
  delete: (id, userId) => api.delete(`/holdings/${id}`, { params: { user_id: userId } })
}

// Stock endpoints
export const stocks = {
  search: (query, limit = 10) => api.get('/stocks/search', { params: { q: query, limit } }),
  getQuote: (ticker) => api.get(`/stocks/${ticker}/quote`),
  getDetail: (ticker) => api.get(`/stocks/${ticker}/detail`),
  getHistory: (ticker, days = 30) => api.get(`/stocks/${ticker}/history?days=${days}`)
}

// Sell transactions endpoints
export const sellTransactions = {
  list: (userId) => api.get(`/sell-transactions/users/${userId}/transactions`),
  get: (id, userId) => api.get(`/sell-transactions/${id}`, { params: { user_id: userId } }),
  create: (userId, data) => api.post('/sell-transactions', data, { params: { user_id: userId } }),
  update: (id, data, userId) => api.put(`/sell-transactions/${id}`, data, { params: { user_id: userId } }),
  delete: (id, userId) => api.delete(`/sell-transactions/${id}`, { params: { user_id: userId } })
}

// AI endpoints
export const ai = {
  analyzeThesis: (data) => api.post('/ai/analyze-thesis', data, { timeout: 30000 }),
  draftThesis: (ticker) => api.post('/ai/draft-thesis', { ticker }, { timeout: 30000 })
}

export default api
