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
        <div class="stat-card stat-card-wide">
          <span class="stat-label">Portfolio Value</span>
          <span v-if="performance?.total_current_value != null" class="stat-value mono-amber">{{ formatMoney(performance.total_current_value) }}</span>
          <span v-else class="stat-value mono-muted">—</span>
        </div>
        <div class="stat-card stat-card-wide">
          <span class="stat-label">Total Return</span>
          <span
            v-if="performance?.total_unrealized_gain_loss != null"
            class="stat-value"
            :class="performance.total_unrealized_gain_loss >= 0 ? 'mono-green' : 'mono-red'"
          >{{ performance.total_unrealized_gain_loss >= 0 ? '+' : '-' }}{{ formatMoney(Math.abs(performance.total_unrealized_gain_loss)) }}</span>
          <span v-else class="stat-value mono-muted">—</span>
        </div>
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
            <span class="panel-title">Top Positions</span>
            <router-link to="/holdings" class="panel-action">View all →</router-link>
          </div>
          <div v-if="topPositions.length > 0">
            <router-link v-for="pos in topPositions" :key="pos.id" to="/holdings" class="pos-row">
              <span class="pos-ticker mono-amber">{{ pos.ticker }}</span>
              <span class="pos-value mono">{{ pos.current_value != null ? formatMoney(pos.current_value) : '—' }}</span>
              <span
                v-if="pos.return_pct != null"
                class="pos-return"
                :class="pos.return_pct >= 0 ? 'mono-green' : 'mono-red'"
              >{{ pos.return_pct >= 0 ? '+' : '' }}{{ pos.return_pct.toFixed(2) }}%</span>
              <span v-else class="pos-return mono-muted">—</span>
            </router-link>
          </div>
          <div v-else class="empty-state">
            <p>No positions yet.</p>
            <router-link to="/holdings" class="empty-cta">Add a holding →</router-link>
          </div>
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
const performance = computed(() => holdingsStore.performance)

const topPositions = computed(() => {
  const positions = performance.value?.holdings ?? []
  return [...positions]
    .sort((a, b) => (b.current_value ?? 0) - (a.current_value ?? 0))
    .slice(0, 5)
})

const formatMoney = (value) =>
  '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

onMounted(async () => {
  if (currentUser.value) {
    await watchlistsStore.fetchWatchlists(currentUser.value.id)
    await holdingsStore.fetchHoldings(currentUser.value.id)
    await holdingsStore.fetchAccounts(currentUser.value.id)
    // Non-blocking: live prices fill in after first paint
    holdingsStore.fetchPerformance(currentUser.value.id)
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
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-1);
  padding: 1.4rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
  white-space: nowrap;
}

.stat-value {
  font-size: 1.9rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap;
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

/* Top positions */
.pos-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  transition: background 0.12s;
}

.pos-row:last-child { border-bottom: none; }
.pos-row:hover { background: var(--bg-2); }

.pos-ticker {
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  flex: 1;
}

.pos-value {
  font-size: 0.8rem;
  color: var(--text-1);
}

.pos-return {
  font-size: 0.8rem;
  min-width: 64px;
  text-align: right;
}

.empty-cta {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--amber);
  text-decoration: none;
}
.empty-cta:hover { color: var(--amber-hi); }

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .dash-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr; }
}
</style>
