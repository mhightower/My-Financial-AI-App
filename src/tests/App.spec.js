import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }]
  })
}

describe('App.vue', () => {
  it('mounts without crashing', () => {
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), createTestRouter()] }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders header element', () => {
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), createTestRouter()] }
    })
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('renders main element', () => {
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), createTestRouter()] }
    })
    expect(wrapper.find('main').exists()).toBe(true)
  })
})
