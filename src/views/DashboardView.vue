<template>
  <div class="dashboard">
    <div class="dashboard-container">
      <div class="header-section">
        <h1>Dashboard</h1>
        <div class="user-info" v-if="currentUser">
          <span>Active User: {{ currentUser.name }}</span>
          <button @click="logoutUser" class="btn-logout">Logout</button>
        </div>
        <div class="no-user" v-else>
          <p>No user selected. Create or switch users.</p>
        </div>
      </div>

      <div class="portfolio-summary" v-if="currentUser">
        <h2>Portfolio Summary</h2>
        <div class="summary-cards">
          <div class="card">
            <h3>Watchlists</h3>
            <p class="number">{{ watchlists.length }}</p>
          </div>
          <div class="card">
            <h3>Holdings</h3>
            <p class="number">{{ holdings.length }}</p>
          </div>
          <div class="card">
            <h3>Accounts</h3>
            <p class="number">{{ accounts.length }}</p>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <button @click="() => $router.push('/watchlists')" class="btn">View Watchlists</button>
        <button @click="() => $router.push('/holdings')" class="btn">View Holdings</button>
        <button @click="() => $router.push('/accounts')" class="btn">Manage Accounts</button>
      </div>

      <div class="recent-watchlists" v-if="watchlists.length > 0">
        <h2>Recent Watchlists</h2>
        <ul>
          <li v-for="wl in watchlists.slice(0, 5)" :key="wl.id">
            <router-link :to="`/watchlist/${wl.id}`">
              {{ wl.name }} ({{ wl.stocks?.length || 0 }} stocks)
            </router-link>
          </li>
        </ul>
      </div>
    </div>
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
  // Note: currentUser is already loaded by App.vue
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
.dashboard {
  min-height: 100vh;
  background: #f9f9f9;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.header-section h1 {
  margin: 0;
  color: #333;
}

.user-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-info span {
  color: #666;
}

.no-user {
  color: #999;
  font-style: italic;
}

.btn, .btn-logout {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn {
  background: #007bff;
  color: white;
  margin-right: 0.5rem;
}

.btn:hover {
  background: #0056b3;
}

.btn-logout {
  background: #dc3545;
  color: white;
}

.btn-logout:hover {
  background: #c82333;
}

.portfolio-summary,
.quick-actions,
.recent-watchlists {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.card {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 4px;
  text-align: center;
}

.card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.95rem;
}

.card .number {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.recent-watchlists ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
}

.recent-watchlists li {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.recent-watchlists li:last-child {
  border-bottom: none;
}

.recent-watchlists a {
  color: #007bff;
  text-decoration: none;
}

.recent-watchlists a:hover {
  text-decoration: underline;
}
</style>
