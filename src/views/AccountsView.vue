<template>
  <div class="accounts-view">
    <div class="container">
      <button @click="$router.back()" class="btn-back">← Back</button>
      <h1>Brokerage Accounts</h1>

      <div v-if="!currentUser" class="no-user">
        <p>Please select a user to manage accounts.</p>
      </div>

      <div v-else>
        <button @click="openCreateForm" class="btn-primary">+ Add Account</button>

        <div v-if="showCreateForm || showEditForm" class="create-form">
          <h2>{{ showEditForm ? 'Edit Account' : 'Create New Account' }}</h2>
          <form @submit.prevent="saveAccount">
            <div class="form-group">
              <label>Account Name *</label>
              <input v-model="formData.name" type="text" required>
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
              <input v-model="formData.broker_name" type="text">
            </div>
            <button type="submit" class="btn-submit" :disabled="loading">{{ loading ? 'Saving...' : 'Save' }}</button>
            <button type="button" @click="closeFormMode" class="btn-cancel">Cancel</button>
          </form>
          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>

        <div class="accounts-grid" v-if="accounts.length > 0">
          <div v-for="account in accounts" :key="account.id" class="account-card">
            <h3>{{ account.name }}</h3>
            <p class="type">{{ account.account_type }}</p>
            <p v-if="account.broker_name" class="broker">{{ account.broker_name }}</p>
            <div class="card-actions">
              <button @click="openEditForm(account)" class="btn-edit">Edit</button>
              <button @click="deleteAccountConfirm(account.id)" class="btn-delete">Delete</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No accounts yet. Create your first brokerage account!</p>
        </div>
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
.accounts-view {
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

.btn-primary {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 2rem;
}

.btn-primary:hover {
  background: #218838;
}

.create-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-submit {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.btn-submit:hover {
  background: #0056b3;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #5a6268;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.account-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.account-card h3 {
  margin-top: 0;
  color: #333;
}

.type {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.broker {
  color: #007bff;
  margin: 0.5rem 0;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-edit,
.btn-delete {
  flex: 1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-edit {
  background: #007bff;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-delete {
  background: #dc3545;
}

.btn-delete:hover {
  background: #c82333;
}

.error-msg {
  color: #dc3545;
  padding: 1rem;
  background: #f8d7da;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.empty-state {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: #666;
}
</style>
