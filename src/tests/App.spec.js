import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App.vue', () => {
  it('mounts without crashing', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders header element', () => {
    const wrapper = mount(App)
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('renders main element', () => {
    const wrapper = mount(App)
    expect(wrapper.find('main').exists()).toBe(true)
  })
})
