import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import DashboardView from '../views/DashboardView.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView
  },
  {
    path: '/watchlists',
    name: 'Watchlists',
    component: () => import('../views/WatchlistsView.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/watchlist/:id',
    name: 'WatchlistDetail',
    component: () => import('../views/WatchlistDetailView.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/holdings',
    name: 'Holdings',
    component: () => import('../views/HoldingsView.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('../views/AccountsView.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  if (to.meta.requiresUser) {
    const userStore = useUserStore()
    userStore.loadCurrentUser()
    if (!userStore.currentUser) {
      return { name: 'Dashboard' }
    }
  }
})

export default router
