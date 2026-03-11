<template>
  <div class="view">
    <div v-if="watchlist" class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn">← Watchlists</button>
        <h1 class="page-title">{{ watchlist.name }}</h1>
        <p v-if="watchlist.description" class="page-subtitle">{{ watchlist.description }}</p>
      </div>
      <button
        @click="openAddModal"
        class="btn btn-primary"
        :disabled="watchlist.stocks?.length >= 15"
        :title="watchlist.stocks?.length >= 15 ? 'Watchlist full (15 max)' : ''"
      >
        + Add Stock
      </button>
    </div>

    <div v-if="!watchlist" class="panel empty-state">
      <p>Loading watchlist…</p>
    </div>

    <div v-else-if="!watchlist.stocks || watchlist.stocks.length === 0" class="panel empty-state">
      <p>No stocks in this watchlist yet.</p>
      <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-2);">
        Add a stock with your investment thesis — why you'd buy, when you'd sell.
      </p>
    </div>

    <div v-else class="panel">
      <div class="panel-header">
        <span class="panel-title">Stocks {{ watchlist.stocks.length }}/15</span>
      </div>
      <div class="stocks-list">
        <div v-for="stock in watchlist.stocks" :key="stock.id" class="stock-card">
          <div class="stock-top">
            <span class="stock-ticker mono-amber">{{ stock.ticker }}</span>
            <div class="stock-triggers">
              <div class="trigger-group" v-if="stock.buy_price">
                <span class="trigger-label">BUY</span>
                <span class="trigger-val mono-green">${{ stock.buy_price }}</span>
              </div>
              <div class="trigger-group" v-if="stock.sell_price">
                <span class="trigger-label">SELL</span>
                <span class="trigger-val mono-red">${{ stock.sell_price }}</span>
              </div>
              <div class="trigger-group" v-if="stock.stop_loss_pct">
                <span class="trigger-label">STOP</span>
                <span class="trigger-val mono-muted">{{ (stock.stop_loss_pct * 100).toFixed(0) }}%</span>
              </div>
            </div>
            <button @click="removeStockConfirm(stock.id)" class="icon-btn danger" title="Remove">✕</button>
          </div>
          <div class="thesis-row" v-if="stock.buy_reasons || stock.sell_conditions">
            <div class="thesis-block" v-if="stock.buy_reasons">
              <span class="thesis-label buy-label">▲ Buy reasons</span>
              <p class="thesis-text">{{ stock.buy_reasons }}</p>
            </div>
            <div class="thesis-block" v-if="stock.sell_conditions">
              <span class="thesis-label sell-label">▼ Sell conditions</span>
              <p class="thesis-text">{{ stock.sell_conditions }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Stock Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h2>Add Stock to Watchlist</h2>
          <button @click="closeAddModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="addStock" class="modal-body">
          <div class="form-group" style="position: relative;">
            <label for="ticker">Ticker *</label>
            <input
              id="ticker"
              v-model="addForm.ticker"
              type="text"
              placeholder="Search ticker…"
              @input="searchStocks"
              required
            />
            <div v-if="searchResults.length > 0" class="search-dropdown">
              <div
                v-for="result in searchResults"
                :key="result.ticker"
                class="search-result"
                @click="selectStock(result)"
              >
                <span class="mono-amber" style="font-size:0.82rem; font-weight:600;">{{ result.ticker }}</span>
                <span style="color:var(--text-1); font-size:0.8rem; margin-left:0.5rem;">{{ result.name }}</span>
              </div>
            </div>
          </div>

          <div class="thesis-inputs">
            <div class="form-group">
              <label for="buy-reasons">Buy Reasons</label>
              <textarea id="buy-reasons" v-model="addForm.buy_reasons" rows="3" placeholder="Why would you buy? What's the thesis?"></textarea>
            </div>
            <div class="form-group">
              <label for="sell-conditions">Sell Conditions</label>
              <textarea id="sell-conditions" v-model="addForm.sell_conditions" rows="3" placeholder="When would you sell? What invalidates the thesis?"></textarea>
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label for="buy-price">Buy Target ($)</label>
              <input id="buy-price" v-model.number="addForm.buy_price" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label for="sell-price">Sell Target ($)</label>
              <input id="sell-price" v-model.number="addForm.sell_price" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label for="stop-loss">Stop Loss (%)</label>
              <input id="stop-loss" v-model.number="addForm.stop_loss_pct" type="number" step="0.1" min="0" max="100" placeholder="15" />
            </div>
          </div>

          <div v-if="error" class="error-msg">{{ error }}</div>
          <div class="form-actions">
            <button type="button" @click="closeAddModal" class="btn btn-ghost">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Adding…' : 'Add Stock' }}
            </button>
          </div>
        </form>
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
.back-btn {
  background: none;
  border: none;
  color: var(--text-1);
  font-family: var(--font-ui);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  letter-spacing: 0.03em;
  transition: color 0.12s;
}
.back-btn:hover { color: var(--amber); }

/* Stock cards */
.stocks-list {
  display: flex;
  flex-direction: column;
}

.stock-card {
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}

.stock-card:last-child { border-bottom: none; }
.stock-card:hover { background: var(--bg-2); }

.stock-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.stock-ticker {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  min-width: 60px;
}

.stock-triggers {
  display: flex;
  gap: 1.25rem;
  flex: 1;
  flex-wrap: wrap;
}

.trigger-group {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.trigger-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-2);
}

.trigger-val {
  font-size: 0.85rem;
  font-weight: 500;
}

/* Thesis */
.thesis-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.thesis-block {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.thesis-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.buy-label { color: var(--green); }
.sell-label { color: var(--red); }

.thesis-text {
  font-size: 0.82rem;
  color: var(--text-1);
  line-height: 1.5;
}

/* Search dropdown */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-2);
  border: 1px solid var(--border-hi);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.search-result {
  padding: 0.65rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}

.search-result:last-child { border-bottom: none; }
.search-result:hover { background: var(--bg-3); }

/* Thesis inputs grid */
.thesis-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .thesis-row { grid-template-columns: 1fr; }
  .thesis-inputs { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
}
</style>
