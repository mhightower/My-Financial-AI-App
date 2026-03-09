<template>
  <div class="watchlists-view">
    <div class="container">
      <h1>Watchlists</h1>
      <button @click="$router.back()" class="btn-back">← Back</button>

      <div class="no-user" v-if="!currentUser">
        <p>Please select a user to view watchlists.</p>
      </div>

      <div v-else>
        <button @click="openModal" class="btn-primary">+ Create Watchlist</button>

        <div class="watchlists-grid" v-if="watchlists.length > 0">
          <div v-for="wl in watchlists" :key="wl.id" class="watchlist-card">
            <div class="card-header">
              <h3>{{ wl.name }}</h3>
              <div class="card-actions">
                <button @click="editWatchlist(wl)" class="btn-icon" title="Edit">✏️</button>
                <button @click="deleteWatchlistConfirm(wl.id)" class="btn-icon delete" title="Delete">🗑️</button>
              </div>
            </div>
            <p v-if="wl.description" class="description">{{ wl.description }}</p>
            <p class="stock-count">{{ wl.stocks?.length || 0 }} stocks</p>
            <router-link :to="`/watchlist/${wl.id}`" class="link">View Details</router-link>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No watchlists yet. Create your first watchlist!</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingId ? 'Edit Watchlist' : 'Create Watchlist' }}</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="saveWatchlist" class="modal-body">
          <div class="form-group">
            <label for="name">Watchlist Name *</label>
            <input id="name" v-model="formData.name" type="text" required />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" v-model="formData.description" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="loading">
              {{ loading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '../stores/user'
import { useWatchlistsStore } from '../stores/watchlists'

const userStore = useUserStore()
const watchlistsStore = useWatchlistsStore()

const currentUser = computed(() => userStore.currentUser)
const watchlists = computed(() => watchlistsStore.watchlists)

const showModal = ref(false)
const loading = ref(false)
const error = ref(null)
const editingId = ref(null)
const formData = ref({ name: '', description: '' })

onMounted(async () => {
  userStore.loadCurrentUser()
  if (currentUser.value) {
    await watchlistsStore.fetchWatchlists(currentUser.value.id)
  }
})

const openModal = () => {
  editingId.value = null
  formData.value = { name: '', description: '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  error.value = null
}

const editWatchlist = (wl) => {
  editingId.value = wl.id
  formData.value = { name: wl.name, description: wl.description || '' }
  showModal.value = true
}

const saveWatchlist = async () => {
  if (!formData.value.name.trim()) {
    error.value = 'Watchlist name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    if (editingId.value) {
      await watchlistsStore.updateWatchlist(editingId.value, formData.value)
    } else {
      await watchlistsStore.createWatchlist(currentUser.value.id, formData.value)
    }
    closeModal()
  } catch (err) {
    error.value = 'Failed to save watchlist'
  } finally {
    loading.value = false
  }
}

const deleteWatchlistConfirm = (id) => {
  if (confirm('Delete this watchlist? This cannot be undone.')) {
    deleteWatchlist(id)
  }
}

const deleteWatchlist = async (id) => {
  try {
    await watchlistsStore.deleteWatchlist(id)
  } catch (err) {
    error.value = 'Failed to delete watchlist'
  }
}
</script>

<style scoped>
.watchlists-view {
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
  margin-bottom: 2rem;
}

.btn-back:hover {
  background: #5a6268;
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

.watchlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.watchlist-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.card-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 0.7;
}

.btn-icon.delete:hover {
  opacity: 0.5;
}

.watchlist-card h3 {
  margin-top: 0;
  color: #333;
}

.description {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.stock-count {
  color: #007bff;
  font-weight: bold;
  margin: 1rem 0;
}

.link {
  display: inline-block;
  color: #007bff;
  text-decoration: none;
  margin-top: 1rem;
}

.link:hover {
  text-decoration: underline;
}

.empty-state {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: #666;
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
