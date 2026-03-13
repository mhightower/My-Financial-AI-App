<template>
  <div class="view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Accounts</h1>
        <p class="page-subtitle">Brokerage account management</p>
      </div>
      <button v-if="currentUser" @click="openCreateForm" class="btn btn-primary">+ Add Account</button>
    </div>

    <div v-if="!currentUser" class="panel empty-state">
      <p>Please select a user to manage accounts.</p>
    </div>

    <template v-else>
      <!-- Inline create/edit form -->
      <div v-if="showCreateForm || showEditForm" class="panel" style="margin-bottom: 1.5rem;">
        <div class="panel-header">
          <span class="panel-title">{{ showEditForm ? 'Edit Account' : 'New Account' }}</span>
          <button @click="closeFormMode" class="close-btn" aria-label="Close form">✕</button>
        </div>
        <form @submit.prevent="saveAccount" class="form-body">
          <div class="form-row">
            <div class="form-group">
              <label>Account Name *</label>
              <input v-model="formData.name" type="text" placeholder="e.g. My Fidelity Taxable" required>
            </div>
            <div class="form-group">
              <label>Account Type *</label>
              <select v-model="formData.account_type" required>
                <option value="taxable">Taxable</option>
                <option value="IRA">IRA</option>
                <option value="Roth">Roth IRA</option>
                <option value="401k">401(k)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Broker</label>
              <input v-model="formData.broker_name" type="text" placeholder="e.g. Fidelity">
            </div>
          </div>
          <div v-if="error" class="error-msg">{{ error }}</div>
          <div class="form-actions">
            <button type="button" @click="closeFormMode" class="btn btn-ghost">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </div>

      <!-- Accounts grid -->
      <div v-if="accounts.length > 0" class="accounts-grid">
        <div v-for="account in accounts" :key="account.id" class="account-card">
          <div class="account-card-top">
            <div>
              <div class="account-name">{{ account.name }}</div>
              <div class="account-broker" v-if="account.broker_name">{{ account.broker_name }}</div>
            </div>
            <span class="account-type-badge">{{ account.account_type }}</span>
          </div>
          <div class="account-card-actions">
            <button @click="openEditForm(account)" class="btn btn-ghost btn-sm">Edit</button>
            <button @click="deleteAccountConfirm(account.id)" class="btn btn-danger btn-sm">Delete</button>
          </div>
        </div>
      </div>

      <div v-else class="panel empty-state">
        <p>No accounts yet.</p>
        <p style="margin-top:0.5rem; font-size:0.8rem;">Add a brokerage account to track holdings by account type.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useHoldingsStore } from '../stores/holdings'

const userStore = useUserStore()
const holdingsStore = useHoldingsStore()

const currentUser = computed(() => userStore.currentUser)
const accounts = computed(() => holdingsStore.accounts)

const showCreateForm = ref(false)
const showEditForm = ref(false)
const editingId = ref(null)
const loading = ref(false)
const error = ref(null)

const formData = ref({
  name: '',
  account_type: 'taxable',
  broker_name: ''
})

onMounted(async () => {
  userStore.loadCurrentUser()
  if (currentUser.value) {
    await holdingsStore.fetchAccounts(currentUser.value.id)
  }
})

const openCreateForm = () => {
  editingId.value = null
  formData.value = { name: '', account_type: 'taxable', broker_name: '' }
  showCreateForm.value = true
  error.value = null
}

const openEditForm = (account) => {
  editingId.value = account.id
  formData.value = { ...account }
  showEditForm.value = true
  error.value = null
}

const closeFormMode = () => {
  showCreateForm.value = false
  showEditForm.value = false
  error.value = null
}

const saveAccount = async () => {
  if (!formData.value.name) {
    error.value = 'Account name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    if (editingId.value) {
      await holdingsStore.updateAccount(editingId.value, formData.value)
    } else {
      await holdingsStore.createAccount(currentUser.value.id, formData.value)
    }
    closeFormMode()
  } catch (err) {
    error.value = 'Failed to save account'
  } finally {
    loading.value = false
  }
}

const deleteAccountConfirm = (id) => {
  if (confirm('Delete this account? This cannot be undone.')) {
    holdingsStore.deleteAccount(id)
  }
}
</script>

<style scoped>
.form-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.account-card {
  background: var(--bg-1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: background 0.12s;
}

.account-card:hover { background: var(--bg-2); }

.account-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.account-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-0);
}

.account-broker {
  font-size: 0.8rem;
  color: var(--text-1);
  margin-top: 0.25rem;
}

.account-type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--amber);
  background: var(--amber-dim);
  padding: 0.2rem 0.55rem;
  border-radius: 2rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.account-card-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .accounts-grid { grid-template-columns: 1fr; }
}
</style>
