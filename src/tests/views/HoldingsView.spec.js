import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HoldingsView from '../../views/HoldingsView.vue'
import { useUserStore } from '../../stores/user'
import { useHoldingsStore } from '../../stores/holdings'

vi.mock('../../services/api', () => ({
  users: { list: vi.fn().mockResolvedValue({ data: [] }) },
  holdings: { list: vi.fn().mockResolvedValue({ data: [] }) },
  accounts: { list: vi.fn().mockResolvedValue({ data: [] }) },
  sellTransactions: { create: vi.fn() }
}))

function mountView(state = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  if (state.currentUser) {
    useUserStore().currentUser = state.currentUser
  }
  if (state.holdings) {
    useHoldingsStore().holdings = state.holdings
  }
  if (state.accounts) {
    useHoldingsStore().accounts = state.accounts
  }

  return mount(HoldingsView, {
    global: { plugins: [pinia] }
  })
}

describe('HoldingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows prompt when no user', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Please select a user to view holdings')
  })

  it('shows empty state when no holdings', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      holdings: []
    })
    expect(wrapper.text()).toContain('No holdings yet')
  })

  it('renders metrics row with correct values', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      holdings: [
        { id: 1, ticker: 'AAPL', quantity: 10, entry_price: 150, entry_date: '2024-01-01', account_id: 1 },
        { id: 2, ticker: 'MSFT', quantity: 5, entry_price: 300, entry_date: '2024-02-01', account_id: 1 }
      ],
      accounts: [{ id: 1, name: 'Fidelity' }]
    })

    const metricValues = wrapper.findAll('.metric-value')
    expect(metricValues[0].text()).toBe('2')
    expect(metricValues[1].text()).toContain('3,000.00')
    expect(metricValues[2].text()).toBe('1')
  })

  it('renders holdings table with ticker and quantity', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      holdings: [
        { id: 1, ticker: 'AAPL', quantity: 10, entry_price: 150.50, entry_date: '2024-01-15', account_id: 1 }
      ],
      accounts: [{ id: 1, name: 'Fidelity' }]
    })

    expect(wrapper.text()).toContain('AAPL')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('150.50')
    expect(wrapper.text()).toContain('Fidelity')
  })

  it('shows dash for unknown account', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      holdings: [
        { id: 1, ticker: 'AAPL', quantity: 10, entry_price: 150, entry_date: '2024-01-15', account_id: 999 }
      ],
      accounts: []
    })

    expect(wrapper.text()).toContain('—')
  })

  it('shows add holding button when user exists', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })
    expect(wrapper.find('.btn-primary').text()).toContain('Add Holding')
  })

  it('opens add holding modal', async () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.text()).toContain('Add Holding')
  })

  it('displays close position button per holding', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      holdings: [
        { id: 1, ticker: 'AAPL', quantity: 10, entry_price: 150, entry_date: '2024-01-15', account_id: 1 }
      ],
      accounts: [{ id: 1, name: 'Fidelity' }]
    })

    const closeBtn = wrapper.findAll('.btn-ghost').find(b => b.text() === 'Close')
    expect(closeBtn).toBeTruthy()
  })
})
