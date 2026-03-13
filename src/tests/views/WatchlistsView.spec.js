import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import WatchlistsView from '../../views/WatchlistsView.vue'
import { useUserStore } from '../../stores/user'
import { useWatchlistsStore } from '../../stores/watchlists'

vi.mock('../../services/api', () => ({
  users: { list: vi.fn().mockResolvedValue({ data: [] }) },
  watchlists: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/watchlists', component: WatchlistsView },
      { path: '/watchlist/:id', component: { template: '<div/>' } }
    ]
  })
}

function mountView(state = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createTestRouter()

  if (state.currentUser) {
    useUserStore().currentUser = state.currentUser
  }
  if (state.watchlists) {
    useWatchlistsStore().watchlists = state.watchlists
  }

  return mount(WatchlistsView, {
    global: { plugins: [pinia, router] }
  })
}

describe('WatchlistsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows prompt when no user selected', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Please select a user')
  })

  it('shows empty state when no watchlists', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: []
    })
    expect(wrapper.text()).toContain('No watchlists yet')
  })

  it('shows new watchlist button when user exists', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })
    expect(wrapper.find('.btn-primary').text()).toContain('New Watchlist')
  })

  it('hides new watchlist button when no user', () => {
    const wrapper = mountView()
    const primaryBtns = wrapper.findAll('.btn-primary')
    expect(primaryBtns.length).toBe(0)
  })

  it('renders watchlist cards', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: [
        { id: 1, name: 'Growth', description: 'High growth stocks', stocks: [{ id: 1 }] },
        { id: 2, name: 'Value', description: null, stocks: [] }
      ]
    })

    expect(wrapper.text()).toContain('Growth')
    expect(wrapper.text()).toContain('High growth stocks')
    expect(wrapper.text()).toContain('Value')
    expect(wrapper.findAll('.wl-card').length).toBe(2)
  })

  it('shows stock count on cards', () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: [{ id: 1, name: 'Growth', stocks: [{ id: 1 }, { id: 2 }] }]
    })

    expect(wrapper.find('.wl-stock-count').text()).toContain('2')
  })

  it('opens create modal on button click', async () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.text()).toContain('New Watchlist')
  })

  it('opens edit modal on edit button click', async () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' },
      watchlists: [{ id: 1, name: 'Growth', description: 'Test', stocks: [] }]
    })

    const editBtn = wrapper.findAll('.icon-btn').find(b => b.text() === '✎')
    await editBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.text()).toContain('Edit Watchlist')
  })

  it('closes modal on cancel', async () => {
    const wrapper = mountView({
      currentUser: { id: 1, name: 'Alice' }
    })

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.modal').exists()).toBe(true)

    await wrapper.find('.btn-ghost').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.modal').exists()).toBe(false)
  })
})
