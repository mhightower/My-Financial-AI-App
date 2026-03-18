<template>
  <div class="view">
    <div v-if="watchlist" class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn" aria-label="Go back to watchlists">← Watchlists</button>
        <h1 class="page-title">{{ watchlist.name }}</h1>
        <p v-if="watchlist.description" class="page-subtitle">{{ watchlist.description }}</p>
      </div>
      <button
        @click="showAddModal = true"
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

    <ThesisAnalysisModal
      v-model="showAnalysisModal"
      :stock="analysisStock"
      :result="analysisResult"
      :score-class="scoreClass"
    />

    <AddStockModal
      v-model="showAddModal"
      :watchlist-id="watchlist?.id"
      :watchlist-stock-count="watchlist?.stocks?.length ?? 0"
      :user-id="currentUser?.id"
    />

    <ConfirmModal
      v-model="showRemoveConfirm"
      title="Remove Stock"
      message="Remove this stock from the watchlist?"
      confirmLabel="Remove"
      @confirm="removeStock(pendingRemoveStockId)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWatchlistsStore } from '../stores/watchlists'
import { useUserStore } from '../stores/user'
import { useAIThesis } from '../composables/useAIThesis'
import ConfirmModal from '../components/ConfirmModal.vue'
import ThesisAnalysisModal from '../components/ThesisAnalysisModal.vue'
import AddStockModal from '../components/AddStockModal.vue'

const route = useRoute()
const watchlistsStore = useWatchlistsStore()
const userStore = useUserStore()
const watchlist = computed(() => watchlistsStore.currentWatchlist)
const currentUser = computed(() => userStore.currentUser)

const showAddModal = ref(false)

const {
  analyzingId,
  showAnalysisModal,
  analysisResult,
  analysisStock,
  scoreClass,
  analyzeThesis,
} = useAIThesis()

onMounted(async () => {
  const watchlistId = parseInt(route.params.id)
  await watchlistsStore.fetchWatchlist(watchlistId, currentUser.value?.id)
})

const showRemoveConfirm = ref(false)
const pendingRemoveStockId = ref(null)

const removeStockConfirm = (stockId) => {
  pendingRemoveStockId.value = stockId
  showRemoveConfirm.value = true
}

const removeStock = async (stockId) => {
  try {
    await watchlistsStore.removeStockFromWatchlist(watchlist.value.id, stockId, currentUser.value?.id)
  } catch {
    // error handled by store
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

/* AI button */
.ai-btn {
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: var(--amber);
  border-color: var(--amber-dim);
}
.ai-btn:hover:not(:disabled) { background: rgba(217, 157, 56, 0.08); }

@media (max-width: 640px) {
  .thesis-row { grid-template-columns: 1fr; }
}
</style>
