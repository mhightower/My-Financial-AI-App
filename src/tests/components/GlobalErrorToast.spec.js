import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GlobalErrorToast from '../../components/GlobalErrorToast.vue'
import { useErrorStore } from '../../stores/error'

// Stub Teleport so rendered output stays in the wrapper tree
const mountOptions = {
  global: {
    stubs: { Teleport: true }
  }
}

describe('GlobalErrorToast.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders nothing when there are no errors', () => {
    const wrapper = mount(GlobalErrorToast, {
      global: { plugins: [createPinia()], stubs: { Teleport: true } }
    })
    expect(wrapper.find('.error-toast-container').exists()).toBe(false)
  })

  it('renders toast container when there are errors', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(GlobalErrorToast, {
      global: { plugins: [pinia], stubs: { Teleport: true } }
    })
    const store = useErrorStore()
    store.addError('Test error')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.error-toast-container').exists()).toBe(true)
  })

  it('renders an error toast for each error', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(GlobalErrorToast, {
      global: { plugins: [pinia], stubs: { Teleport: true } }
    })
    const store = useErrorStore()
    store.addError('First error')
    store.addError('Second error')
    await wrapper.vm.$nextTick()
    const toasts = wrapper.findAll('.error-toast')
    expect(toasts).toHaveLength(2)
  })

  it('displays the error message', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(GlobalErrorToast, {
      global: { plugins: [pinia], stubs: { Teleport: true } }
    })
    const store = useErrorStore()
    store.addError('Something broke!')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Something broke!')
  })

  it('calls dismissError when dismiss button is clicked', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(GlobalErrorToast, {
      global: { plugins: [pinia], stubs: { Teleport: true } }
    })
    const store = useErrorStore()
    store.addError('Dismiss me')
    const errorId = store.errors[0].id
    await wrapper.vm.$nextTick()

    const closeBtn = wrapper.find('.toast-close')
    await closeBtn.trigger('click')
    expect(store.errors.find(e => e.id === errorId)).toBeUndefined()
  })

  it('applies error-type styling for error type', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(GlobalErrorToast, {
      global: { plugins: [pinia], stubs: { Teleport: true } }
    })
    const store = useErrorStore()
    store.addError('An error', 'error')
    await wrapper.vm.$nextTick()
    const toast = wrapper.find('.error-toast')
    expect(toast.classes()).toContain('toast-error')
  })

  it('applies warning-type styling for warning type', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(GlobalErrorToast, {
      global: { plugins: [pinia], stubs: { Teleport: true } }
    })
    const store = useErrorStore()
    store.addError('A warning', 'warning')
    await wrapper.vm.$nextTick()
    const toast = wrapper.find('.error-toast')
    expect(toast.classes()).toContain('toast-warning')
  })
})

