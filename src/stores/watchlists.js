import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../services/api'

export const useWatchlistsStore = defineStore('watchlists', () => {
  const watchlists = ref([])
  const currentWatchlist = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchWatchlists = async (userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.watchlists.list(userId)
      watchlists.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const fetchWatchlist = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.watchlists.get(id)
      currentWatchlist.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const createWatchlist = async (userId, data) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.watchlists.create(userId, data)
      watchlists.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteWatchlist = async (id, userId) => {
    loading.value = true
    error.value = null
    try {
      await api.watchlists.delete(id, userId)
      watchlists.value = watchlists.value.filter(w => w.id !== id)
      if (currentWatchlist.value?.id === id) {
        currentWatchlist.value = null
      }
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addStockToWatchlist = async (watchlistId, stockData, userId) => {
    try {
      const response = await api.watchlists.addStock(watchlistId, stockData, userId)
      if (currentWatchlist.value?.id === watchlistId) {
        currentWatchlist.value.stocks.push(response.data)
      }
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    }
  }

  const removeStockFromWatchlist = async (watchlistId, stockId, userId) => {
    try {
      await api.watchlists.removeStock(watchlistId, stockId, userId)
      if (currentWatchlist.value?.id === watchlistId) {
        currentWatchlist.value.stocks = currentWatchlist.value.stocks.filter(s => s.id !== stockId)
      }
    } catch (err) {
      error.value = err.message
    }
  }

  const updateWatchlist = async (id, data, userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.watchlists.update(id, data, userId)
      const index = watchlists.value.findIndex(w => w.id === id)
      if (index !== -1) {
        watchlists.value[index] = response.data
      }
      if (currentWatchlist.value?.id === id) {
        currentWatchlist.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const updateStockInWatchlist = async (watchlistId, stockId, data, userId) => {
    try {
      const response = await api.watchlists.updateStock(watchlistId, stockId, data, userId)
      if (currentWatchlist.value?.id === watchlistId) {
        const index = currentWatchlist.value.stocks.findIndex(s => s.id === stockId)
        if (index !== -1) {
          currentWatchlist.value.stocks[index] = response.data
        }
      }
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    }
  }

  return {
    watchlists,
    currentWatchlist,
    loading,
    error,
    fetchWatchlists,
    fetchWatchlist,
    createWatchlist,
    deleteWatchlist,
    updateWatchlist,
    addStockToWatchlist,
    removeStockFromWatchlist,
    updateStockInWatchlist
  }
})
