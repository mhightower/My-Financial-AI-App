<template>
  <div class="watchlist-detail">
    <div class="container">
      <button @click="$router.back()" class="btn-back">← Back</button>
      <h1 v-if="watchlist">{{ watchlist.name }}</h1>
      <p v-if="watchlist && watchlist.description" class="description">{{ watchlist.description }}</p>

      <div v-if="watchlist && watchlist.stocks" class="stocks-list">
        <div class="list-header">
          <h2>Stocks ({{ watchlist.stocks.length }}/15)</h2>
          <button @click="openAddModal" class="btn-add" :disabled="watchlist.stocks.length >= 15">
            + Add Stock
          </button>
        </div>
        <div v-if="watchlist.stocks.length > 0" class="stocks-table">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Buy Reasons</th>
                <th>Sell Conditions</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Stop Loss</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in watchlist.stocks" :key="stock.id">
                <td><strong>{{ stock.ticker }}</strong></td>
                <td>{{ stock.buy_reasons || '-' }}</td>
                <td>{{ stock.sell_conditions || '-' }}</td>
                <td>{{ stock.buy_price ? `$${stock.buy_price}` : '-' }}</td>
                <td>{{ stock.sell_price ? `$${stock.sell_price}` : '-' }}</td>
                <td>{{ stock.stop_loss_pct ? `${(stock.stop_loss_pct * 100).toFixed(0)}%` : '-' }}</td>
                <td>
                  <button @click="removeStockConfirm(stock.id)" class="btn-remove">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">
          <p>No stocks in this watchlist yet. Click "Add Stock" to get started!</p>
        </div>
      </div>

      <div v-else class="loading">
        <p>Loading...</p>
      </div>
    </div>

    <!-- Add Stock Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Stock to Watchlist</h2>
          <button @click="closeAddModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="addStock" class="modal-body">
          <div class="form-group">
            <label for="ticker">Ticker *</label>
            <input
              id="ticker"
              v-model="addForm.ticker"
              type="text"
              placeholder="Search ticker..."
              @input="searchStocks"
              required
            />
            <div v-if="searchResults.length > 0" class="search-dropdown">
              <div v-for="result in searchResults" :key="result.ticker" class="search-result" @click="selectStock(result)">
                <strong>{{ result.ticker }}</strong> - {{ result.name }}
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="buy-reasons">Buy Reasons</label>
            <textarea id="buy-reasons" v-model="addForm.buy_reasons" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="sell-conditions">Sell Conditions</label>
            <textarea id="sell-conditions" v-model="addForm.sell_conditions" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="buy-price">Buy Price Target ($)</label>
              <input id="buy-price" v-model.number="addForm.buy_price" type="number" step="0.01" />
            </div>
            <div class="form-group">
              <label for="sell-price">Sell Price Target ($)</label>
              <input id="sell-price" v-model.number="addForm.sell_price" type="number" step="0.01" />
            </div>
            <div class="form-group">
              <label for="stop-loss">Stop Loss (%)</label>
              <input id="stop-loss" v-model.number="addForm.stop_loss_pct" type="number" step="0.1" min="0" max="100" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeAddModal" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="loading">{{ loading ? 'Adding...' : 'Add Stock' }}</button>
          </div>
        </form>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWatchlistsStore } from '../stores/watchlists'
import * as api from '../services/api'

const route = useRoute()
const watchlistsStore = useWatchlistsStore()
const watchlist = ref(null)

const showAddModal = ref(false)
const loading = ref(false)
const error = ref(null)
const searchResults = ref([])
const searchTimeout = ref(null)

const addForm = ref({
  ticker: '',
  buy_reasons: '',
  sell_conditions: '',
  buy_price: null,
  sell_price: null,
  stop_loss_pct: null
})

onMounted(async () => {
  const watchlistId = parseInt(route.params.id)
  watchlist.value = await watchlistsStore.fetchWatchlist(watchlistId)
})

const openAddModal = () => {
  addForm.value = {
    ticker: '',
    buy_reasons: '',
    sell_conditions: '',
    buy_price: null,
    sell_price: null,
    stop_loss_pct: null
  }
  searchResults.value = []
  showAddModal.value = true
  error.value = null
}

const closeAddModal = () => {
  showAddModal.value = false
  error.value = null
}

const searchStocks = async () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)

  if (addForm.value.ticker.length < 1) {
    searchResults.value = []
    return
  }

  searchTimeout.value = setTimeout(async () => {
    try {
      const response = await api.stocks.search(addForm.value.ticker, 5)
      searchResults.value = response.data
    } catch (err) {
      searchResults.value = []
    }
  }, 300)
}

const selectStock = (stock) => {
  addForm.value.ticker = stock.ticker
  searchResults.value = []
}

const addStock = async () => {
  if (!addForm.value.ticker.trim()) {
    error.value = 'Ticker is required'
    return
  }

  if (watchlist.value.stocks.length >= 15) {
    error.value = 'Watchlist is full (max 15 stocks)'
    return
  }

  loading.value = true
  error.value = null

  try {
    const stockData = {
      ticker: addForm.value.ticker.toUpperCase(),
      buy_reasons: addForm.value.buy_reasons || null,
      sell_conditions: addForm.value.sell_conditions || null,
      buy_price: addForm.value.buy_price,
      sell_price: addForm.value.sell_price,
      stop_loss_pct: addForm.value.stop_loss_pct ? addForm.value.stop_loss_pct / 100 : null
    }

    await watchlistsStore.addStockToWatchlist(watchlist.value.id, stockData)
    closeAddModal()
  } catch (err) {
    error.value = 'Failed to add stock: ' + (err.response?.data?.detail || err.message)
  } finally {
    loading.value = false
  }
}

const removeStockConfirm = (stockId) => {
  if (confirm('Remove this stock from the watchlist?')) {
    removeStock(stockId)
  }
}

const removeStock = async (stockId) => {
  try {
    await watchlistsStore.removeStockFromWatchlist(watchlist.value.id, stockId)
  } catch (err) {
    error.value = 'Failed to remove stock'
  }
}
</script>

<style scoped>
.watchlist-detail {
  min-height: 100vh;
  background: #f9f9f9;
  padding: 2rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.btn-back {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
}

.btn-back:hover {
  background: #5a6268;
}

.description {
  color: #666;
  font-size: 1.1rem;
  margin: 1rem 0 2rem 0;
}

.stocks-list {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stocks-table {
  margin-top: 1rem;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th {
  background: #f5f5f5;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #ddd;
  font-weight: bold;
}

table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

table tr:hover {
  background: #f9f9f9;
}

.empty {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.loading {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.list-header h2 {
  margin: 0;
}

.btn-add {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-add:hover:not(:disabled) {
  background: #218838;
}

.btn-add:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 3px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-remove:hover {
  background: #c82333;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
  position: relative;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-result {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.search-result:hover {
  background: #f5f5f5;
}

.search-result:last-child {
  border-bottom: none;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel {
  background: #e9ecef;
  color: #333;
}

.btn-cancel:hover {
  background: #dee2e6;
}

.btn-submit {
  background: #007bff;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #0056b3;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #dc3545;
  padding: 1rem;
  background: #f8d7da;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
