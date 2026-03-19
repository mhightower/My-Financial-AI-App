<template>
  <div
    v-if="modelValue"
    ref="trapRef"
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-stock-modal-title"
    @click.self="close"
    @keydown.escape="close"
  >
    <div class="modal modal-wide">
      <div class="modal-header">
        <h2 id="add-stock-modal-title">Add Stock to Watchlist</h2>
        <button @click="close" class="close-btn" aria-label="Close">✕</button>
      </div>
      <form @submit.prevent="addStock" class="modal-body">
        <div class="form-group" style="position: relative;">
          <label for="ticker">Ticker *</label>
          <input
            id="ticker"
            v-model="form.ticker"
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
            <textarea id="buy-reasons" v-model="form.buy_reasons" rows="3" placeholder="Why would you buy? What's the thesis?"></textarea>
          </div>
          <div class="form-group">
            <label for="sell-conditions">Sell Conditions</label>
            <textarea id="sell-conditions" v-model="form.sell_conditions" rows="3" placeholder="When would you sell? What invalidates the thesis?"></textarea>
          </div>
        </div>

        <div class="ai-draft-row">
          <button
            type="button"
            @click="generateThesisDraft(form.ticker, form)"
            class="btn btn-ghost btn-sm ai-btn"
            :disabled="!form.ticker || generatingDraft"
          >{{ generatingDraft ? 'Generating…' : '✦ Generate with AI' }}</button>
          <span v-if="draftError" class="draft-error">{{ draftError }}</span>
        </div>

        <div class="form-row-3">
          <div class="form-group">
            <label for="buy-price">Buy Target ($)</label>
            <input id="buy-price" v-model.number="form.buy_price" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label for="sell-price">Sell Target ($)</label>
            <input id="sell-price" v-model.number="form.sell_price" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label for="stop-loss">Stop Loss (%)</label>
            <input id="stop-loss" v-model.number="form.stop_loss_pct" type="number" step="0.1" min="0" max="100" placeholder="15" />
          </div>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>
        <div class="form-actions">
          <button type="button" @click="close" class="btn btn-ghost">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Adding…' : 'Add Stock' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, toRef, watch } from 'vue'
import { useWatchlistsStore } from '../stores/watchlists'
import { useFocusTrap } from '../composables/useFocusTrap'
import { useDebounce } from '../composables/useDebounce'
import { useAIThesis } from '../composables/useAIThesis'
import * as api from '../services/api'

const props = defineProps({
  modelValue: Boolean,
  watchlistId: Number,
  watchlistStockCount: { type: Number, default: 0 },
  userId: Number
})

const emit = defineEmits(['update:modelValue', 'added'])

const watchlistsStore = useWatchlistsStore()
const { trapRef } = useFocusTrap(toRef(props, 'modelValue'))
const { generatingDraft, draftError, generateThesisDraft } = useAIThesis()

const form = ref({ ticker: '', buy_reasons: '', sell_conditions: '', buy_price: null, sell_price: null, stop_loss_pct: null })
const loading = ref(false)
const error = ref(null)
const searchResults = ref([])
const searchError = ref(null)

watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = { ticker: '', buy_reasons: '', sell_conditions: '', buy_price: null, sell_price: null, stop_loss_pct: null }
    searchResults.value = []
    searchError.value = null
    error.value = null
  }
})

const close = () => emit('update:modelValue', false)

const { debounced: debouncedSearch } = useDebounce(async () => {
  try {
    const response = await api.stocks.search(form.value.ticker, 5)
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

const searchStocks = () => {
  if (form.value.ticker.length < 1) {
    searchResults.value = []
    searchError.value = null
    return
  }
  debouncedSearch()
}

const selectStock = (stock) => {
  form.value.ticker = stock.ticker
  searchResults.value = []
}

const addStock = async () => {
  if (!form.value.ticker.trim()) {
    error.value = 'Ticker is required'
    return
  }

  if (props.watchlistStockCount >= 15) {
    error.value = 'Watchlist is full (max 15 stocks)'
    return
  }

  loading.value = true
  error.value = null

  try {
    const stockData = {
      ticker: form.value.ticker.toUpperCase(),
      buy_reasons: form.value.buy_reasons || null,
      sell_conditions: form.value.sell_conditions || null,
      buy_price: form.value.buy_price,
      sell_price: form.value.sell_price,
      stop_loss_pct: form.value.stop_loss_pct ? form.value.stop_loss_pct / 100 : null
    }
    await watchlistsStore.addStockToWatchlist(props.watchlistId, stockData, props.userId)
    close()
    emit('added')
  } catch (err) {
    console.error('Failed to add stock:', err)
    error.value = 'Failed to add stock. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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

@media (max-width: 640px) {
  .thesis-inputs { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
}
</style>
