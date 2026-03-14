<template>
  <div class="view">
    <div v-if="watchlist" class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn" aria-label="Go back to watchlists">← Watchlists</button>
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
            <button
              v-if="stock.buy_reasons || stock.sell_conditions"
              @click="analyzeThesis(stock)"
              class="btn btn-ghost btn-sm ai-btn"
              :disabled="analyzingId === stock.id"
              title="Analyze thesis with AI"
            >{{ analyzingId === stock.id ? 'Analyzing…' : '✦ Analyze' }}</button>
            <button @click="removeStockConfirm(stock.id)" class="icon-btn danger" title="Remove" aria-label="Remove stock from watchlist">✕</button>
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

    <!-- AI Analysis Modal -->
    <div v-if="showAnalysisModal" ref="analysisModalTrapRef" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="analysis-modal-title" @click.self="showAnalysisModal = false" @keydown.escape="showAnalysisModal = false">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h2 id="analysis-modal-title">Thesis Analysis — <span class="mono-amber">{{ analysisStock?.ticker }}</span></h2>
          <button @click="showAnalysisModal = false" class="close-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body" v-if="analysisResult">
          <div class="analysis-score-row">
            <div class="score-badge" :class="scoreClass">{{ analysisResult.quality_score }}<span style="font-size:1rem; font-weight:400;">/10</span></div>
            <span class="conviction-badge">{{ analysisResult.conviction_level }} conviction</span>
          </div>
          <div class="analysis-grid">
            <div class="analysis-section">
              <span class="analysis-label strengths-label">Strengths</span>
              <ul>
                <li v-for="(s, i) in analysisResult.strengths" :key="i" class="strength-item">{{ s }}</li>
              </ul>
            </div>
            <div class="analysis-section">
              <span class="analysis-label blind-spots-label">Blind Spots</span>
              <ul>
                <li v-for="(b, i) in analysisResult.blind_spots" :key="i" class="blind-spot-item">{{ b }}</li>
              </ul>
            </div>
            <div class="analysis-section">
              <span class="analysis-label suggestions-label">Suggestions</span>
              <ul>
                <li v-for="(s, i) in analysisResult.suggestions" :key="i" class="suggestion-item">{{ s }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Stock Modal -->
    <div v-if="showAddModal" ref="addModalTrapRef" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-stock-modal-title" @click.self="closeAddModal" @keydown.escape="closeAddModal">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h2 id="add-stock-modal-title">Add Stock to Watchlist</h2>
          <button @click="closeAddModal" class="close-btn" aria-label="Close">✕</button>
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
            <div v-if="searchError" class="search-hint">{{ searchError }}</div>
            <div v-if="searchResults.length > 0" class="search-dropdown" role="listbox" aria-label="Stock search results">
              <div
                v-for="result in searchResults"
                :key="result.ticker"
                class="search-result"
                role="option"
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

          <div class="ai-draft-row">
            <button
              type="button"
              @click="generateThesisDraft"
              class="btn btn-ghost btn-sm ai-btn"
              :disabled="!addForm.ticker || generatingDraft"
            >{{ generatingDraft ? 'Generating…' : '✦ Generate with AI' }}</button>
            <span v-if="draftError" class="draft-error">{{ draftError }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWatchlistsStore } from '../stores/watchlists'
import { useFocusTrap } from '../composables/useFocusTrap'
import * as api from '../services/api'

const route = useRoute()
const watchlistsStore = useWatchlistsStore()
const watchlist = computed(() => watchlistsStore.currentWatchlist)

const showAddModal = ref(false)
const loading = ref(false)
const error = ref(null)
const searchResults = ref([])
const searchError = ref(null)
const searchTimeout = ref(null)

const { trapRef: addModalTrapRef } = useFocusTrap(showAddModal)

// AI Thesis Analyzer
const analyzingId = ref(null)
const showAnalysisModal = ref(false)
const analysisResult = ref(null)
const analysisStock = ref(null)
const analysisError = ref(null)
const { trapRef: analysisModalTrapRef } = useFocusTrap(showAnalysisModal)

const scoreClass = computed(() => {
  const s = analysisResult.value?.quality_score ?? 0
  if (s >= 7) return 'score-good'
  if (s >= 5) return 'score-neutral'
  return 'score-poor'
})

const analyzeThesis = async (stock) => {
  analyzingId.value = stock.id
  analysisError.value = null
  try {
    const response = await api.ai.analyzeThesis({
      ticker: stock.ticker,
      buy_reasons: stock.buy_reasons || '',
      sell_conditions: stock.sell_conditions || ''
    })
    analysisResult.value = response.data
    analysisStock.value = stock
    showAnalysisModal.value = true
  } catch (err) {
    analysisError.value = 'Analysis failed. Try again shortly.'
  } finally {
    analyzingId.value = null
  }
}

// AI Draft Thesis Generator
const generatingDraft = ref(false)
const draftError = ref(null)

const generateThesisDraft = async () => {
  if (!addForm.value.ticker) return
  generatingDraft.value = true
  draftError.value = null
  try {
    const response = await api.ai.draftThesis(addForm.value.ticker.toUpperCase())
    addForm.value.buy_reasons = response.data.buy_reasons
    addForm.value.sell_conditions = response.data.sell_conditions
  } catch (err) {
    draftError.value = 'Could not generate draft. Enter a valid ticker and try again.'
  } finally {
    generatingDraft.value = false
  }
}

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
  searchError.value = null
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
    searchError.value = null
    return
  }

  searchTimeout.value = setTimeout(async () => {
    try {
      const response = await api.stocks.search(addForm.value.ticker, 5)
      searchResults.value = response.data
      searchError.value = null
    } catch (err) {
      searchResults.value = []
      const status = err.response?.status
      const detail = err.response?.data?.detail || ''
      if (status === 429 || detail.toLowerCase().includes('rate limit')) {
        searchError.value = 'Search unavailable (API limit reached) — type ticker directly'
      } else if (status >= 500 || status === 502) {
        searchError.value = 'Search unavailable — type ticker directly'
      } else {
        searchError.value = null
      }
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

/* Search hint (rate limit message) */
.search-hint {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  font-size: 0.75rem;
  color: var(--amber);
  background: var(--bg-2);
  border: 1px solid var(--border-hi);
  border-top: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0 0 var(--radius) var(--radius);
  z-index: 10;
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

/* AI button */
.ai-btn {
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: var(--amber);
  border-color: var(--amber-dim);
}
.ai-btn:hover:not(:disabled) { background: rgba(217, 157, 56, 0.08); }

/* AI draft row */
.ai-draft-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: -0.25rem;
}
.draft-error { font-size: 0.78rem; color: var(--red); }

/* Analysis modal */
.analysis-score-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.25rem;
}
.score-badge {
  font-family: var(--font-mono);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}
.score-good { color: var(--green); }
.score-neutral { color: var(--amber); }
.score-poor { color: var(--red); }

.conviction-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
  border: 1px solid var(--border-hi);
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
}
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.analysis-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.analysis-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.strengths-label { color: var(--green); }
.blind-spots-label { color: var(--red); }
.suggestions-label { color: var(--amber); }

.analysis-section ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
}
.analysis-section li {
  font-size: 0.82rem;
  color: var(--text-0);
  line-height: 1.55;
  padding-left: 0.85rem;
  position: relative;
}
.analysis-section li::before {
  content: "·";
  position: absolute;
  left: 0;
  font-weight: 700;
}
.strength-item::before { color: var(--green); }
.blind-spot-item::before { color: var(--red); }
.suggestion-item::before { color: var(--amber); }

@media (max-width: 640px) {
  .thesis-row { grid-template-columns: 1fr; }
  .thesis-inputs { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
  .analysis-grid { grid-template-columns: 1fr; }
}
</style>
