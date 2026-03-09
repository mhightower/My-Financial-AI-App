<template>
  <div class="holdings-view">
    <div class="container">
      <button @click="$router.back()" class="btn-back">← Back</button>
      <h1>Holdings & Portfolio</h1>

      <div v-if="!currentUser" class="no-user">
        <p>Please select a user to view holdings.</p>
      </div>

      <div v-else>
        <div class="portfolio-summary">
          <h2>Portfolio Summary</h2>
          <div class="metrics">
            <div class="metric">
              <span class="label">Total Holdings</span>
              <span class="value">{{ holdings.length }}</span>
            </div>
            <div class="metric">
              <span class="label">Total Cost Basis</span>
              <span class="value">${{ totalCostBasis.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="holdings-list">
          <div class="list-header">
            <h2>Your Holdings</h2>
            <button @click="openAddModal" class="btn-add">+ Add Holding</button>
          </div>
          <div v-if="holdings.length > 0" class="holdings-table">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Quantity</th>
                  <th>Entry Price</th>
                  <th>Date</th>
                  <th>Cost Basis</th>
                  <th>Account</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="holding in holdings" :key="holding.id">
                  <td><strong>{{ holding.ticker }}</strong></td>
                  <td>{{ holding.quantity }}</td>
                  <td>${{ holding.entry_price.toFixed(2) }}</td>
                  <td>{{ formatDate(holding.entry_date) }}</td>
                  <td>${{ (holding.quantity * holding.entry_price).toFixed(2) }}</td>
                  <td>{{ getAccountName(holding.account_id) }}</td>
                  <td>
                    <button @click="closePositionModal(holding)" class="btn-action">Close</button>
                    <button @click="deleteHoldingConfirm(holding.id)" class="btn-action delete">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty">
            <p>No holdings yet. Start building your portfolio!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Holding Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Holding</h2>
          <button @click="closeAddModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="addHolding" class="modal-body">
          <div class="form-group">
            <label for="ticker">Ticker *</label>
            <input id="ticker" v-model="addForm.ticker" type="text" placeholder="e.g., AAPL" required />
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
              <input id="quantity" v-model.number="addForm.quantity" type="number" step="0.01" required />
            </div>
            <div class="form-group">
              <label for="price">Entry Price *</label>
              <input id="price" v-model.number="addForm.entry_price" type="number" step="0.01" required />
            </div>
          </div>
          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea id="notes" v-model="addForm.notes" rows="2"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeAddModal" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="loading">{{ loading ? 'Adding...' : 'Add' }}</button>
          </div>
        </form>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>
    </div>

    <!-- Close Position (Sell) Modal -->
    <div v-if="showSellModal" class="modal-overlay" @click.self="closeSellModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Close Position: {{ sellForm.ticker }}</h2>
          <button @click="closeSellModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="closePosion" class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label for="shares">Shares Sold *</label>
              <input id="shares" v-model.number="sellForm.shares_sold" type="number" step="0.01" required />
            </div>
            <div class="form-group">
              <label for="sell-price">Price Received *</label>
              <input id="sell-price" v-model.number="sellForm.price_received" type="number" step="0.01" required />
            </div>
          </div>
          <div class="form-group">
            <label for="sell-notes">Notes</label>
            <textarea id="sell-notes" v-model="sellForm.notes" rows="2"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeSellModal" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="loading">{{ loading ? 'Recording...' : 'Record Sale' }}</button>
          </div>
        </form>
        <div v-if="error" class="error-msg">{{ error }}</div>
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
  return account ? account.name : 'Unknown'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
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

const closePosion = async () => {
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
.holdings-view {
  min-height: 100vh;
  background: #f9f9f9;
  padding: 2rem;
}

.container {
  max-width: 1200px;
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

.portfolio-summary {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric .label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.metric .value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.holdings-list {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.holdings-table {
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
}

.btn-add:hover {
  background: #218838;
}

.btn-action {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 3px;
  font-size: 0.85rem;
  cursor: pointer;
  margin-right: 0.25rem;
}

.btn-action:hover {
  background: #0056b3;
}

.btn-action.delete {
  background: #dc3545;
}

.btn-action.delete:hover {
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
  max-width: 500px;
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
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
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
