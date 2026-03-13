<template>
  <div class="view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Watchlists</h1>
        <p class="page-subtitle">Track stocks with documented thesis</p>
      </div>
      <button v-if="currentUser" @click="openModal" class="btn btn-primary">+ New Watchlist</button>
    </div>

    <div v-if="!currentUser" class="panel empty-state">
      <p>Please select a user to view watchlists.</p>
    </div>

    <div v-else-if="watchlists.length === 0" class="panel empty-state">
      <p>No watchlists yet.</p>
      <p style="margin-top: 0.5rem; font-size: 0.8rem;">Create a watchlist to start tracking stocks with investment theses.</p>
    </div>

    <div v-else class="watchlists-grid">
      <div v-for="wl in watchlists" :key="wl.id" class="wl-card">
        <div class="wl-card-header">
          <span class="wl-card-name">{{ wl.name }}</span>
          <div class="wl-card-actions">
            <button @click.stop="editWatchlist(wl)" class="icon-btn" title="Edit" aria-label="Edit watchlist">✎</button>
            <button @click.stop="deleteWatchlistConfirm(wl.id)" class="icon-btn danger" title="Delete" aria-label="Delete watchlist">✕</button>
          </div>
        </div>
        <p v-if="wl.description" class="wl-card-desc">{{ wl.description }}</p>
        <div class="wl-card-footer">
          <span class="wl-stock-count mono-amber">{{ wl.stocks?.length || 0 }}<span class="wl-stock-max">/15</span></span>
          <router-link :to="`/watchlist/${wl.id}`" class="wl-view-link">Open →</router-link>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wl-modal-title" @click.self="closeModal" @keydown.escape="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="wl-modal-title">{{ editingId ? 'Edit Watchlist' : 'New Watchlist' }}</h2>
          <button @click="closeModal" class="close-btn" aria-label="Close">✕</button>
        </div>
        <form @submit.prevent="saveWatchlist" class="modal-body">
          <div class="form-group">
            <label for="name">Watchlist Name *</label>
            <input id="name" v-model="formData.name" type="text" placeholder="e.g. Growth Stocks, Dividend Portfolio" required />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" v-model="formData.description" rows="3" placeholder="Strategy or focus of this watchlist…"></textarea>
          </div>
          <div v-if="error" class="error-msg">{{ error }}</div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-ghost">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
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
.watchlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.wl-card {
  background: var(--bg-1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: background 0.12s;
  cursor: default;
}

.wl-card:hover { background: var(--bg-2); }

.wl-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.wl-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-0);
  line-height: 1.3;
}

.wl-card-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-1);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem 0.35rem;
  border-radius: var(--radius-sm);
  transition: all 0.12s;
  line-height: 1;
}

.icon-btn:hover { color: var(--text-0); background: var(--bg-3); }
.icon-btn.danger:hover { color: var(--red); background: var(--red-dim); }

.wl-card-desc {
  font-size: 0.82rem;
  color: var(--text-1);
  line-height: 1.5;
  flex: 1;
}

.wl-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.wl-stock-count {
  font-size: 1.4rem;
  font-weight: 500;
}

.wl-stock-max {
  font-size: 0.8rem;
  color: var(--text-1);
}

.wl-view-link {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--amber);
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: color 0.12s;
}

.wl-view-link:hover { color: var(--amber-hi); }

@media (max-width: 768px) {
  .watchlists-grid { grid-template-columns: 1fr; }
}
</style>
