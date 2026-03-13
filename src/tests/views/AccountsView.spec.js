import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AccountsView from '../../views/AccountsView.vue'
import { useUserStore } from '../../stores/user'
import { useHoldingsStore } from '../../stores/holdings'

vi.mock('../../services/api', () => ({
  users: { list: vi.fn().mockResolvedValue({ data: [] }) },
  accounts: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

function mountView(state = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  if (state.currentUser) {
    useUserStore().currentUser = state.currentUser
  }
  if (state.accounts) {
    useHoldingsStore().accounts = state.accounts
  }

  return mount(AccountsView, {
    global: { plugins: [pinia] }
  })
}

describe('AccountsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows prompt when no user', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Please select a user to manage accounts')
  })

  it('shows empty state when no accounts', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      accounts: []
    })
    expect(wrapper.text()).toContain('No accounts yet')
  })

  it('renders account cards', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      accounts: [
        { id: 1, name: 'Fidelity Taxable', account_type: 'taxable', broker_name: 'Fidelity' },
        { id: 2, name: 'Vanguard Roth', account_type: 'Roth', broker_name: 'Vanguard' }
      ]
    })

    expect(wrapper.text()).toContain('Fidelity Taxable')
    expect(wrapper.text()).toContain('Vanguard Roth')
    expect(wrapper.findAll('.account-card').length).toBe(2)
  })

  it('shows account type badge', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      accounts: [{ id: 1, name: 'Fidelity', account_type: 'IRA', broker_name: 'Fidelity' }]
    })

    expect(wrapper.find('.account-type-badge').text()).toBe('IRA')
  })

  it('shows broker name', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      accounts: [{ id: 1, name: 'My Account', account_type: 'taxable', broker_name: 'Schwab' }]
    })

    expect(wrapper.text()).toContain('Schwab')
  })

  it('shows add account button when user exists', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })
    expect(wrapper.find('.btn-primary').text()).toContain('Add Account')
  })

  it('opens create form on button click', async () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('New Account')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('opens edit form on edit button click', async () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      accounts: [{ id: 1, name: 'Fidelity', account_type: 'taxable', broker_name: 'Fidelity' }]
    })

    const editBtn = wrapper.findAll('.btn-ghost').find(b => b.text() === 'Edit')
    await editBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Edit Account')
  })

  it('has account type select with options', async () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    const options = wrapper.findAll('select option')
    expect(options.length).toBe(4)
  })
})
