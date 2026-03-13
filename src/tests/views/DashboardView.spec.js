import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import DashboardView from '../../views/DashboardView.vue'
import { useUserStore } from '../../stores/user'
import { useWatchlistsStore } from '../../stores/watchlists'
import { useHoldingsStore } from '../../stores/holdings'

vi.mock('../../services/api', () => ({
  watchlists: { list: vi.fn().mockResolvedValue({ data: [] }) },
  holdings: { list: vi.fn().mockResolvedValue({ data: [] }) },
  accounts: { list: vi.fn().mockResolvedValue({ data: [] }) }
}))

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: DashboardView },
      { path: '/watchlists', component: { template: '<div/>' } },
      { path: '/watchlist/:id', component: { template: '<div/>' } },
      { path: '/holdings', component: { template: '<div/>' } },
      { path: '/accounts', component: { template: '<div/>' } }
    ]
  })
}

function mountDashboard(userState = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createTestRouter()

  if (userState.currentUser) {
    const userStore = useUserStore()
    userStore.currentUser = userState.currentUser
  }
  if (userState.watchlists) {
    const wlStore = useWatchlistsStore()
    wlStore.watchlists = userState.watchlists
  }
  if (userState.holdings) {
    const hStore = useHoldingsStore()
    hStore.holdings = userState.holdings
  }
  if (userState.accounts) {
    const hStore = useHoldingsStore()
    hStore.accounts = userState.accounts
  }

  return mount(DashboardView, {
    global: { plugins: [pinia, router] }
  })
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no user selected', () => {
    const wrapper = mountDashboard()
    expect(wrapper.text()).toContain('No user selected')
  })

  it('shows user name when signed in', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' }
    })
    expect(wrapper.text()).toContain('Signed in as Alice')
  })

  it('shows sign out button when user exists', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' }
    })
    expect(wrapper.find('.btn-ghost').text()).toContain('Sign out')
  })

  it('hides sign out button when no user', () => {
    const wrapper = mountDashboard()
    const buttons = wrapper.findAll('.btn-ghost')
    const signOut = buttons.filter(b => b.text().includes('Sign out'))
    expect(signOut.length).toBe(0)
  })

  it('displays stat cards with correct counts', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: [{ id: 1, name: 'WL1' }, { id: 2, name: 'WL2' }],
      holdings: [{ id: 1, ticker: 'AAPL' }],
      accounts: [{ id: 1, name: 'Fidelity' }]
    })

    const statValues = wrapper.findAll('.stat-value')
    expect(statValues[0].text()).toBe('2')
    expect(statValues[1].text()).toBe('1')
    expect(statValues[2].text()).toBe('1')
  })

  it('shows empty watchlists message', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: []
    })
    expect(wrapper.text()).toContain('No watchlists yet')
  })

  it('renders recent watchlists with stock counts', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: [
        { id: 1, name: 'Growth', stocks: [{ id: 1 }] },
        { id: 2, name: 'Value', stocks: [] }
      ]
    })

    expect(wrapper.text()).toContain('Growth')
    expect(wrapper.text()).toContain('Value')
    expect(wrapper.text()).toContain('1/15')
    expect(wrapper.text()).toContain('0/15')
  })

  it('renders navigation quick links', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' }
    })

    const links = wrapper.findAll('.quick-link')
    expect(links.length).toBe(3)
    expect(links[0].text()).toContain('Watchlists')
    expect(links[1].text()).toContain('Holdings')
    expect(links[2].text()).toContain('Accounts')
  })

  it('limits displayed watchlists to 6', () => {
    const watchlists = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1, name: `WL ${i + 1}`, stocks: []
    }))

    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' },
      watchlists
    })

    const wlRows = wrapper.findAll('.wl-row')
    expect(wlRows.length).toBe(6)
  })
})
