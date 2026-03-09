<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <h1 @click="$router.push('/')" class="app-title">💰 MyFinancial</h1>
        <nav class="nav-menu">
          <router-link to="/" active-class="active">Dashboard</router-link>
          <router-link to="/watchlists" active-class="active">Watchlists</router-link>
          <router-link to="/holdings" active-class="active">Holdings</router-link>
          <router-link to="/accounts" active-class="active">Accounts</router-link>
        </nav>
        <div class="user-selector" @click="openUserModal">
          <div v-if="currentUser" class="user-badge">
            <div class="avatar" :style="{ backgroundColor: currentUser.avatar_color || '#667eea' }"></div>
            <span>{{ currentUser.name }}</span>
          </div>
          <div v-else class="user-badge no-user">
            <span>Select User</span>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <UserSwitcherModal ref="userModal" />

    <footer class="app-footer">
      <p>&copy; 2024 MyFinancial - Personal Stock & ETF Tracker</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from './stores/user'
import UserSwitcherModal from './components/UserSwitcherModal.vue'

const userStore = useUserStore()
const userModal = ref(null)

// Load current user from localStorage BEFORE any children mount (synchronously)
userStore.loadCurrentUser()

const currentUser = computed(() => userStore.currentUser)

const openUserModal = () => {
  userModal.value?.openModal()
}

onMounted(() => {
  // Auto-open modal if no user is selected
  if (!userStore.currentUser) {
    userModal.value?.openModal()
  }
})
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #333;
  background: #f9f9f9;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  sticky: top;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.app-title {
  margin: 0;
  font-size: 1.8rem;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.app-title:hover {
  opacity: 0.9;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  margin: 0;
  flex: 1;
}

.nav-menu a {
  color: white;
  text-decoration: none;
  padding: 1rem 0;
  border-bottom: 3px solid transparent;
  transition: border-color 0.2s;
  white-space: nowrap;
}

.nav-menu a:hover,
.nav-menu a.active {
  border-bottom-color: white;
}

.user-selector {
  cursor: pointer;
  flex-shrink: 0;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: background 0.2s;
}

.user-badge:hover {
  background: rgba(255, 255, 255, 0.3);
}

.user-badge.no-user {
  font-style: italic;
  opacity: 0.8;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid white;
}

.app-main {
  flex: 1;
}

.app-footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 2rem;
  margin-top: auto;
}

.app-footer p {
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-menu {
    gap: 1rem;
    justify-content: center;
    width: 100%;
    flex: unset;
  }

  .app-title {
    font-size: 1.4rem;
  }

  .user-selector {
    width: 100%;
  }

  .user-badge {
    justify-content: center;
  }
}
</style>
