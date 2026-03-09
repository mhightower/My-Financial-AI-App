import { createRouter, createWebHistory } from 'vue-router'
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
    component: () => import('../views/WatchlistsView.vue')
  },
  {
    path: '/watchlist/:id',
    name: 'WatchlistDetail',
    component: () => import('../views/WatchlistDetailView.vue')
  },
  {
    path: '/holdings',
    name: 'Holdings',
    component: () => import('../views/HoldingsView.vue')
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('../views/AccountsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
