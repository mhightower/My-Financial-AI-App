import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserSwitcherModal from '../../components/UserSwitcherModal.vue'
import { useUserStore } from '../../stores/user'

vi.mock('../../services/api', () => ({
  users: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
    delete: vi.fn()
  }
}))

function mountModal(options = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(UserSwitcherModal, {
    global: { plugins: [pinia] },
    ...options
  })
}

describe('UserSwitcherModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mounts without crashing', () => {
    const wrapper = mountModal()
    expect(wrapper.exists()).toBe(true)
  })

  it('exposes openModal and closeModal', () => {
    const wrapper = mountModal()
    expect(typeof wrapper.vm.openModal).toBe('function')
    expect(typeof wrapper.vm.closeModal).toBe('function')
  })

  it('opens modal when no current user on mount', async () => {
    const wrapper = mountModal()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isOpen).toBe(true)
  })

  it('does not auto-open when user exists', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useUserStore()
    store.currentUser = { id: 1, name: 'Alice' }

    const wrapper = mount(UserSwitcherModal, {
      global: { plugins: [pinia] }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isOpen).toBe(false)
  })

  it('renders create user form when open', async () => {
    const wrapper = mountModal()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#userName').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('renders color palette with 6 swatches', async () => {
    const wrapper = mountModal()
    await wrapper.vm.$nextTick()

    const swatches = wrapper.findAll('.color-swatch')
    expect(swatches.length).toBe(6)
  })

  it('renders user list when users exist', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useUserStore()
    store.users = [
      { id: 1, name: 'Alice', avatar_color: '#D99D38' },
      { id: 2, name: 'Bob', avatar_color: '#1DB87A' }
    ]

    const wrapper = mount(UserSwitcherModal, {
      global: { plugins: [pinia] }
    })
    wrapper.vm.isOpen = true
    wrapper.vm.users = store.users
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('.user-row')
    expect(rows.length).toBe(2)
  })

  it('shows active badge for current user', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useUserStore()
    const user = { id: 1, name: 'Alice', avatar_color: '#D99D38' }
    store.currentUser = user
    store.users = [user]

    const wrapper = mount(UserSwitcherModal, {
      global: { plugins: [pinia] }
    })
    wrapper.vm.isOpen = true
    wrapper.vm.users = [user]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.active-badge').exists()).toBe(true)
    expect(wrapper.find('.active-badge').text()).toBe('Active')
  })

  it('closes modal and resets form', async () => {
    const wrapper = mountModal()
    await wrapper.vm.$nextTick()

    wrapper.vm.newUserName = 'Test'
    wrapper.vm.closeModal()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isOpen).toBe(false)
    expect(wrapper.vm.newUserName).toBe('')
  })

  it('shows error when creating user with empty name', async () => {
    const wrapper = mountModal()
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.error).toBe('Name is required')
  })

  it('displays first letter of user name as avatar', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useUserStore()
    store.users = [{ id: 1, name: 'Alice', avatar_color: '#D99D38' }]

    const wrapper = mount(UserSwitcherModal, {
      global: { plugins: [pinia] }
    })
    wrapper.vm.isOpen = true
    wrapper.vm.users = store.users
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.user-avatar').text()).toBe('A')
  })
})
