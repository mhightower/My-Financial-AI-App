import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import NotFoundView from '../../views/NotFoundView.vue'

function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/404', component: NotFoundView },
      { path: '/', component: { template: '<div/>' } }
    ]
  })
  return mount(NotFoundView, { global: { plugins: [router] } })
}

describe('NotFoundView', () => {
  it('renders 404 glitch text', () => {
    const wrapper = mountView()
    expect(wrapper.find('.glitch-ticker').text()).toBe('404')
  })

  it('renders Page Not Found heading', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toBe('Page Not Found')
  })

  it('renders back to dashboard link pointing to /', () => {
    const wrapper = mountView()
    const link = wrapper.find('a.home-btn')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Back to Dashboard')
    expect(link.attributes('href')).toBe('/')
  })

  it('renders 20 scrolling tape items', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('.tape-item').length).toBe(20)
  })
})
