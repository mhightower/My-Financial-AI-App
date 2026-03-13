<template>
  <div class="view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle" v-if="currentUser">Signed in as {{ currentUser.name }}</p>
        <p class="page-subtitle" v-else>No user selected</p>
      </div>
      <button v-if="currentUser" @click="logoutUser" class="btn btn-ghost btn-sm">Sign out</button>
    </div>

    <div v-if="!currentUser" class="panel empty-state">
      <p>No user selected. Click your profile in the sidebar to get started.</p>
    </div>

    <template v-else>
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Watchlists</span>
          <span class="stat-value mono-amber">{{ watchlists.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Holdings</span>
          <span class="stat-value mono-amber">{{ holdings.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Accounts</span>
          <span class="stat-value mono-amber">{{ accounts.length }}</span>
        </div>
      </div>

      <!-- Content grid -->
      <div class="dash-grid">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Recent Watchlists</span>
            <router-link to="/watchlists" class="panel-action">View all →</router-link>
          </div>
          <div v-if="watchlists.length > 0">
            <router-link
              v-for="wl in watchlists.slice(0, 6)"
              :key="wl.id"
              :to="`/watchlist/${wl.id}`"
              class="wl-row"
            >
              <span class="wl-name">{{ wl.name }}</span>
              <span class="wl-count mono-muted">{{ wl.stocks?.length || 0 }}/15</span>
            </router-link>
          </div>
          <div v-else class="empty-state">No watchlists yet. Create one to get started.</div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Navigate</span>
          </div>
          <router-link to="/watchlists" class="quick-link">
            <span class="quick-icon" aria-hidden="true">◉</span>
            <span>Watchlists</span>
            <span class="quick-arrow" aria-hidden="true">→</span>
          </router-link>
          <router-link to="/holdings" class="quick-link">
            <span class="quick-icon" aria-hidden="true">△</span>
            <span>Holdings</span>
            <span class="quick-arrow" aria-hidden="true">→</span>
          </router-link>
          <router-link to="/accounts" class="quick-link">
            <span class="quick-icon" aria-hidden="true">▣</span>
            <span>Accounts</span>
            <span class="quick-arrow" aria-hidden="true">→</span>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useWatchlistsStore } from '../stores/watchlists'
import { useHoldingsStore } from '../stores/holdings'

const router = useRouter()
const userStore = useUserStore()
const watchlistsStore = useWatchlistsStore()
const holdingsStore = useHoldingsStore()

const currentUser = computed(() => userStore.currentUser)
const watchlists = computed(() => watchlistsStore.watchlists)
const holdings = computed(() => holdingsStore.holdings)
const accounts = computed(() => holdingsStore.accounts)

onMounted(async () => {
  if (currentUser.value) {
    await watchlistsStore.fetchWatchlists(currentUser.value.id)
    await holdingsStore.fetchHoldings(currentUser.value.id)
    await holdingsStore.fetchAccounts(currentUser.value.id)
  }
})

const logoutUser = () => {
  userStore.logout()
  router.push('/')
}
</script>

<style scoped>
/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-1);
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
}

.stat-value {
  font-size: 2.75rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
}

/* Grid */
.dash-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
}

/* Watchlist rows */
.wl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  transition: background 0.12s;
}

.wl-row:last-child { border-bottom: none; }
.wl-row:hover { background: var(--bg-2); }

.wl-name {
  font-size: 0.875rem;
  color: var(--text-0);
  font-weight: 600;
}

.wl-count { font-size: 0.78rem; }

/* Quick links */
.quick-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  color: var(--text-1);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.12s;
}

.quick-link:last-child { border-bottom: none; }

.quick-link:hover {
  background: var(--bg-2);
  color: var(--text-0);
}

.quick-icon {
  font-size: 0.8rem;
  color: var(--amber);
  width: 14px;
  text-align: center;
}

.quick-arrow {
  margin-left: auto;
  color: var(--text-2);
  font-size: 0.8rem;
}

.quick-link:hover .quick-arrow { color: var(--amber); }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr; }
  .dash-grid { grid-template-columns: 1fr; }
}
</style>
