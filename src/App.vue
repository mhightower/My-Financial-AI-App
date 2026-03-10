<template>
  <div id="app">
    <aside class="sidebar">
      <div class="brand" @click="$router.push('/')">
        <span class="brand-mark">MF</span>
        <span class="brand-text">MyFinancial</span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" active-class="" exact-active-class="nav-active">
          <span class="nav-icon">◈</span>
          <span class="nav-label">Dashboard</span>
        </router-link>
        <router-link to="/watchlists" active-class="nav-active">
          <span class="nav-icon">◉</span>
          <span class="nav-label">Watchlists</span>
        </router-link>
        <router-link to="/holdings" active-class="nav-active">
          <span class="nav-icon">△</span>
          <span class="nav-label">Holdings</span>
        </router-link>
        <router-link to="/accounts" active-class="nav-active">
          <span class="nav-icon">▣</span>
          <span class="nav-label">Accounts</span>
        </router-link>
      </nav>

      <div class="sidebar-user" @click="openUserModal">
        <div v-if="currentUser" class="avatar-circle" :style="{ backgroundColor: currentUser.avatar_color || '#D99D38' }">
          {{ currentUser.name.charAt(0).toUpperCase() }}
        </div>
        <div v-else class="avatar-circle ghost">?</div>
        <span class="user-display-name">{{ currentUser?.name || 'Select User' }}</span>
      </div>
    </aside>

    <main class="app-main">
      <router-view />
    </main>

    <UserSwitcherModal ref="userModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from './stores/user'
import UserSwitcherModal from './components/UserSwitcherModal.vue'

const userStore = useUserStore()
const userModal = ref(null)

userStore.loadCurrentUser()

const currentUser = computed(() => userStore.currentUser)

const openUserModal = () => {
  userModal.value?.openModal()
}

onMounted(() => {
  if (!userStore.currentUser) {
    userModal.value?.openModal()
  }
})
</script>

<style>
/* ── Global Design Tokens ── */
:root {
  --bg-0: #080B10;
  --bg-1: #0E1420;
  --bg-2: #161E2E;
  --bg-3: #1D2638;
  --border: #1E2A3B;
  --border-hi: #2A3A52;
  --text-0: #E2E8F2;
  --text-1: #6D7E94;
  --text-2: #3A4A5C;
  --amber: #D99D38;
  --amber-hi: #F0B84A;
  --amber-dim: rgba(217, 157, 56, 0.12);
  --amber-glow: rgba(217, 157, 56, 0.05);
  --green: #1DB87A;
  --green-dim: rgba(29, 184, 122, 0.1);
  --red: #E04545;
  --red-dim: rgba(224, 69, 69, 0.1);
  --sidebar-w: 220px;
  --radius: 6px;
  --radius-sm: 3px;
  --font-ui: 'Syne', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  background: var(--bg-0);
  color: var(--text-0);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--bg-1); }
::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-2); }

/* ── Shared Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
  line-height: 1;
}

.btn-primary {
  background: var(--amber);
  color: var(--bg-0);
  border-color: var(--amber);
}
.btn-primary:hover:not(:disabled) { background: var(--amber-hi); border-color: var(--amber-hi); }

.btn-ghost {
  background: transparent;
  color: var(--text-1);
  border-color: var(--border-hi);
}
.btn-ghost:hover:not(:disabled) { color: var(--text-0); border-color: var(--text-2); background: var(--bg-2); }

.btn-danger {
  background: transparent;
  color: var(--red);
  border-color: transparent;
}
.btn-danger:hover:not(:disabled) { background: var(--red-dim); border-color: rgba(224, 69, 69, 0.3); }

.btn-sm {
  padding: 0.35rem 0.7rem;
  font-size: 0.75rem;
}

.btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Shared Forms ── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-1);
}

.form-group input,
.form-group textarea,
.form-group select {
  background: var(--bg-3);
  border: 1px solid var(--border-hi);
  border-radius: var(--radius);
  color: var(--text-0);
  font-family: var(--font-ui);
  font-size: 0.875rem;
  padding: 0.6rem 0.75rem;
  width: 100%;
  transition: border-color 0.15s;
  outline: none;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--amber);
}

.form-group select option { background: var(--bg-2); }
.form-group textarea { resize: vertical; min-height: 80px; }

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 1rem;
}

.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

/* ── Shared Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 10, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.modal {
  background: var(--bg-1);
  border: 1px solid var(--border-hi);
  border-radius: var(--radius);
  width: 90%;
  max-width: 540px;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.modal-wide { max-width: 640px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-0);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-1);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  line-height: 1;
  transition: color 0.15s;
  border-radius: var(--radius-sm);
}
.close-btn:hover { color: var(--text-0); background: var(--bg-2); }

.error-msg {
  color: var(--red);
  background: var(--red-dim);
  border: 1px solid rgba(224, 69, 69, 0.25);
  border-radius: var(--radius);
  padding: 0.65rem 1rem;
  font-size: 0.82rem;
}

/* ── Shared Table ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text-0);
  vertical-align: top;
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-2); }

/* ── Mono Utilities ── */
.mono { font-family: var(--font-mono); }
.mono-amber { font-family: var(--font-mono); color: var(--amber); }
.mono-green { font-family: var(--font-mono); color: var(--green); }
.mono-red { font-family: var(--font-mono); color: var(--red); }
.mono-muted { font-family: var(--font-mono); color: var(--text-1); }

/* ── View Shell ── */
.view {
  padding: 2.5rem;
  max-width: 1140px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-0);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.82rem;
  color: var(--text-1);
  margin-top: 0.3rem;
}

/* ── Panel ── */
.panel {
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
}

.panel-action {
  font-size: 0.78rem;
  color: var(--amber);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s;
}
.panel-action:hover { color: var(--amber-hi); }

/* ── Empty States ── */
.empty-state {
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-1);
  font-size: 0.875rem;
}
</style>

<style scoped>
#app {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--bg-1);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1.25rem 1.1rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.brand-mark {
  font-family: var(--font-ui);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--bg-0);
  background: var(--amber);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  letter-spacing: -0.5px;
  flex-shrink: 0;
}

.brand-text {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-0);
  letter-spacing: 0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 0.85rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow-y: auto;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius);
  color: var(--text-1);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: color 0.15s, background 0.15s;
}

.sidebar-nav a:hover {
  color: var(--text-0);
  background: var(--bg-2);
}

.sidebar-nav a.nav-active {
  color: var(--amber);
  background: var(--amber-dim);
}

.nav-icon {
  font-size: 0.8rem;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.sidebar-user {
  padding: 0.85rem 1.1rem;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.sidebar-user:hover { background: var(--bg-2); }

.avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--bg-0);
  flex-shrink: 0;
}

.avatar-circle.ghost {
  background: var(--bg-3);
  color: var(--text-1);
  border: 1px solid var(--border-hi);
}

.user-display-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Main ── */
.app-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  #app { flex-direction: column; }

  .sidebar {
    width: 100%;
    height: auto;
    position: sticky;
    top: 0;
    flex-direction: row;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid var(--border);
    padding: 0.6rem 0.75rem;
    gap: 0.5rem;
    z-index: 50;
  }

  .brand {
    padding: 0;
    border-bottom: none;
    flex-shrink: 0;
  }

  .brand-text { display: none; }

  .sidebar-nav {
    flex-direction: row;
    padding: 0;
    gap: 0;
    flex: 1;
    overflow-y: unset;
  }

  .sidebar-nav a { padding: 0.5rem 0.6rem; }
  .nav-label { display: none; }

  .sidebar-user { padding: 0; border-top: none; }
  .user-display-name { display: none; }

  .app-main { overflow-y: unset; }

  .view { padding: 1.25rem; }
}
</style>
