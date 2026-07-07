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
  holdings: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    getPerformance: vi.fn().mockResolvedValue({ data: null })
  },
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
  if (userState.performance) {
    const hStore = useHoldingsStore()
    hStore.performance = userState.performance
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

  it('displays stat cards with portfolio value, return, and counts', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: [{ id: 1, name: 'WL1' }, { id: 2, name: 'WL2' }],
      holdings: [{ id: 1, ticker: 'AAPL' }],
      accounts: [{ id: 1, name: 'Fidelity' }],
      performance: {
        holdings: [],
        total_cost_basis: 4000,
        total_current_value: 4650,
        total_unrealized_gain_loss: 650
      }
    })

    const statValues = wrapper.findAll('.stat-value')
    expect(statValues[0].text()).toContain('$4,650.00')
    expect(statValues[1].text()).toContain('+$650.00')
    expect(statValues[2].text()).toBe('2')
    expect(statValues[3].text()).toBe('1')
    expect(statValues[4].text()).toBe('1')
  })

  it('shows placeholder for portfolio value when performance is unavailable', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' }
    })

    const statValues = wrapper.findAll('.stat-value')
    expect(statValues[0].text()).toContain('—')
    expect(statValues[1].text()).toContain('—')
  })

  it('colors negative total return as loss', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' },
      performance: {
        holdings: [],
        total_cost_basis: 4000,
        total_current_value: 3200,
        total_unrealized_gain_loss: -800
      }
    })

    const statValues = wrapper.findAll('.stat-value')
    expect(statValues[1].text()).toContain('-$800.00')
    expect(statValues[1].classes()).toContain('mono-red')
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

  it('renders top positions sorted by current value', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' },
      performance: {
        holdings: [
          { id: 1, ticker: 'AAPL', current_value: 2000, return_pct: 5.5 },
          { id: 2, ticker: 'MSFT', current_value: 6200, return_pct: -1.2 }
        ],
        total_cost_basis: 8000,
        total_current_value: 8200,
        total_unrealized_gain_loss: 200
      }
    })

    const rows = wrapper.findAll('.pos-row')
    expect(rows.length).toBe(2)
    expect(rows[0].text()).toContain('MSFT')
    expect(rows[0].text()).toContain('-1.20%')
    expect(rows[1].text()).toContain('AAPL')
    expect(rows[1].text()).toContain('+5.50%')
  })

  it('shows empty positions message when there are no holdings', () => {
    const wrapper = mountDashboard({
      currentUser: { id: 1, name: 'Alice' }
    })
    expect(wrapper.text()).toContain('No positions yet')
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
