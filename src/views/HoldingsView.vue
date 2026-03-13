<template>
  <div class="view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Holdings</h1>
        <p class="page-subtitle">Portfolio positions &amp; cost basis</p>
      </div>
      <button v-if="currentUser" @click="openAddModal" class="btn btn-primary">+ Add Holding</button>
    </div>

    <div v-if="!currentUser" class="panel empty-state">
      <p>Please select a user to view holdings.</p>
    </div>

    <template v-else>
      <!-- Summary metrics -->
      <div class="metrics-row">
        <div class="metric-card">
          <span class="metric-label">Total Positions</span>
          <span class="metric-value mono-amber">{{ holdings.length }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Total Cost Basis</span>
          <span class="metric-value mono-amber">${{ totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Accounts</span>
          <span class="metric-value mono-muted">{{ accounts.length }}</span>
        </div>
      </div>

      <!-- Holdings table -->
      <div class="panel" v-if="holdings.length > 0">
        <div class="panel-header">
          <span class="panel-title">Positions</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Date</th>
                <th>Cost Basis</th>
                <th>Account</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="holding in holdings" :key="holding.id">
                <td><span class="mono-amber" style="font-size:0.95rem; font-weight:600;">{{ holding.ticker }}</span></td>
                <td><span class="mono">{{ holding.quantity }}</span></td>
                <td><span class="mono">${{ holding.entry_price.toFixed(2) }}</span></td>
                <td><span class="mono-muted" style="font-size:0.8rem;">{{ formatDate(holding.entry_date) }}</span></td>
                <td><span class="mono-amber">${{ (holding.quantity * holding.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span></td>
                <td><span style="color:var(--text-1); font-size:0.82rem;">{{ getAccountName(holding.account_id) }}</span></td>
                <td>
                  <div class="row-actions">
                    <button @click="closePositionModal(holding)" class="btn btn-ghost btn-sm">Close</button>
                    <button @click="deleteHoldingConfirm(holding.id)" class="btn btn-danger btn-sm" aria-label="Delete holding">✕</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="panel empty-state">
        <p>No holdings yet.</p>
        <p style="margin-top:0.5rem; font-size:0.8rem;">Add a holding to track your portfolio positions.</p>
      </div>
    </template>

    <!-- Add Holding Modal -->
    <div v-if="showAddModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-holding-modal-title" @click.self="closeAddModal" @keydown.escape="closeAddModal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="add-holding-modal-title">Add Holding</h2>
          <button @click="closeAddModal" class="close-btn" aria-label="Close">✕</button>
        </div>
        <form @submit.prevent="addHolding" class="modal-body">
          <div class="form-group">
            <label for="ticker">Ticker *</label>
            <input id="ticker" v-model="addForm.ticker" type="text" placeholder="e.g. AAPL" required />
          </div>
          <div class="form-group">
            <label for="account">Account *</label>
            <select id="account" v-model.number="addForm.account_id" required>
              <option value="">Select Account</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="quantity">Quantity *</label>
              <input id="quantity" v-model.number="addForm.quantity" type="number" step="0.01" placeholder="0" required />
            </div>
            <div class="form-group">
              <label for="price">Entry Price *</label>
              <input id="price" v-model.number="addForm.entry_price" type="number" step="0.01" placeholder="0.00" required />
            </div>
          </div>
          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea id="notes" v-model="addForm.notes" rows="2" placeholder="Optional trade notes…"></textarea>
          </div>
          <div v-if="error" class="error-msg">{{ error }}</div>
          <div class="form-actions">
            <button type="button" @click="closeAddModal" class="btn btn-ghost">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Adding…' : 'Add' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Close Position (Sell) Modal -->
    <div v-if="showSellModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="close-position-modal-title" @click.self="closeSellModal" @keydown.escape="closeSellModal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="close-position-modal-title">Close Position — {{ sellForm.ticker }}</h2>
          <button @click="closeSellModal" class="close-btn" aria-label="Close">✕</button>
        </div>
        <form @submit.prevent="closePosition" class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label for="shares">Shares Sold *</label>
              <input id="shares" v-model.number="sellForm.shares_sold" type="number" step="0.01" required />
            </div>
            <div class="form-group">
              <label for="sell-price">Price Received *</label>
              <input id="sell-price" v-model.number="sellForm.price_received" type="number" step="0.01" placeholder="0.00" required />
            </div>
          </div>
          <div class="form-group">
            <label for="sell-notes">Notes</label>
            <textarea id="sell-notes" v-model="sellForm.notes" rows="2" placeholder="Why are you closing this position?"></textarea>
          </div>
          <div v-if="error" class="error-msg">{{ error }}</div>
          <div class="form-actions">
            <button type="button" @click="closeSellModal" class="btn btn-ghost">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Recording…' : 'Record Sale' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useHoldingsStore } from '../stores/holdings'

const userStore = useUserStore()
const holdingsStore = useHoldingsStore()

const currentUser = computed(() => userStore.currentUser)
const holdings = computed(() => holdingsStore.holdings)
const accounts = computed(() => holdingsStore.accounts)

const showAddModal = ref(false)
const showSellModal = ref(false)
const loading = ref(false)
const error = ref(null)

const addForm = ref({ ticker: '', account_id: '', quantity: 0, entry_price: 0, notes: '' })
const sellForm = ref({ ticker: '', holding_id: null, account_id: null, shares_sold: 0, price_received: 0, notes: '' })

const totalCostBasis = computed(() => {
  return holdings.value.reduce((total, h) => total + (h.quantity * h.entry_price), 0)
})

const getAccountName = (accountId) => {
  const account = accounts.value.find(a => a.id === accountId)
  return account ? account.name : '—'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

const openAddModal = () => {
  addForm.value = { ticker: '', account_id: '', quantity: 0, entry_price: 0, notes: '' }
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  error.value = null
}

const addHolding = async () => {
  if (!addForm.value.ticker || !addForm.value.account_id || addForm.value.quantity <= 0 || addForm.value.entry_price <= 0) {
    error.value = 'Please fill all required fields'
    return
  }

  loading.value = true
  error.value = null

  try {
    await holdingsStore.createHolding(currentUser.value.id, {
      ticker: addForm.value.ticker.toUpperCase(),
      account_id: addForm.value.account_id,
      quantity: addForm.value.quantity,
      entry_price: addForm.value.entry_price,
      notes: addForm.value.notes
    })
    closeAddModal()
  } catch (err) {
    error.value = 'Failed to add holding'
  } finally {
    loading.value = false
  }
}

const closePositionModal = (holding) => {
  sellForm.value = {
    ticker: holding.ticker,
    holding_id: holding.id,
    account_id: holding.account_id,
    shares_sold: holding.quantity,
    price_received: 0,
    notes: ''
  }
  showSellModal.value = true
}

const closeSellModal = () => {
  showSellModal.value = false
  error.value = null
}

const closePosition = async () => {
  if (sellForm.value.shares_sold <= 0 || sellForm.value.price_received <= 0) {
    error.value = 'Please enter valid share count and price'
    return
  }

  loading.value = true
  error.value = null

  try {
    await holdingsStore.createSellTransaction(currentUser.value.id, {
      account_id: sellForm.value.account_id,
      ticker: sellForm.value.ticker,
      shares_sold: sellForm.value.shares_sold,
      price_received: sellForm.value.price_received,
      notes: sellForm.value.notes
    })
    await holdingsStore.deleteHolding(sellForm.value.holding_id)
    closeSellModal()
  } catch (err) {
    error.value = 'Failed to record sale'
  } finally {
    loading.value = false
  }
}

const deleteHoldingConfirm = (id) => {
  if (confirm('Delete this holding?')) {
    holdingsStore.deleteHolding(id)
  }
}

onMounted(async () => {
  userStore.loadCurrentUser()
  if (currentUser.value) {
    await holdingsStore.fetchHoldings(currentUser.value.id)
    await holdingsStore.fetchAccounts(currentUser.value.id)
  }
})
</script>

<style scoped>
.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: var(--bg-1);
  padding: 1.25rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.01em;
}

.table-wrap {
  overflow-x: auto;
}

.row-actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .metrics-row { grid-template-columns: 1fr; }
}
</style>
