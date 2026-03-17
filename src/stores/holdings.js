import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../services/api'

export const useHoldingsStore = defineStore('holdings', () => {
  const holdings = ref([])
  const accounts = ref([])
  const sellTransactions = ref([])
  const performance = ref(null)
  const performanceLoading = ref(false)
  const loading = ref(false)
  const error = ref(null)

  const fetchPerformance = async (userId) => {
    performanceLoading.value = true
    try {
      const response = await api.holdings.getPerformance(userId)
      performance.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      performanceLoading.value = false
    }
  }

  const fetchHoldings = async (userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.holdings.list(userId)
      holdings.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const fetchAccounts = async (userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.accounts.list(userId)
      accounts.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const createHolding = async (userId, holdingData) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.holdings.create(userId, holdingData)
      holdings.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const createAccount = async (userId, accountData) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.accounts.create(userId, accountData)
      accounts.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteHolding = async (id, userId) => {
    try {
      await api.holdings.delete(id, userId)
      holdings.value = holdings.value.filter(h => h.id !== id)
    } catch (err) {
      error.value = err.message
    }
  }

  const deleteAccount = async (id, userId) => {
    try {
      await api.accounts.delete(id, userId)
      accounts.value = accounts.value.filter(a => a.id !== id)
    } catch (err) {
      error.value = err.message
    }
  }

  const updateAccount = async (id, accountData, userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.accounts.update(id, accountData, userId)
      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        accounts.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const updateHolding = async (id, holdingData, userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.holdings.update(id, holdingData, userId)
      const index = holdings.value.findIndex(h => h.id === id)
      if (index !== -1) {
        holdings.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchSellTransactions = async (userId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.sellTransactions.list(userId)
      sellTransactions.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const createSellTransaction = async (userId, transactionData) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.sellTransactions.create(userId, transactionData)
      sellTransactions.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteSellTransaction = async (id, userId) => {
    try {
      await api.sellTransactions.delete(id, userId)
      sellTransactions.value = sellTransactions.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = err.message
    }
  }

  return {
    holdings,
    accounts,
    sellTransactions,
    performance,
    performanceLoading,
    loading,
    error,
    fetchHoldings,
    fetchPerformance,
    fetchAccounts,
    createHolding,
    createAccount,
    deleteHolding,
    deleteAccount,
    updateAccount,
    updateHolding,
    fetchSellTransactions,
    createSellTransaction,
    deleteSellTransaction
  }
})
