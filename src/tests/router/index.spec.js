import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import router from '../../router/index.js'

describe('router', () => {
  beforeEach(async () => {
    // jsdom doesn't implement scrollTo; router's scrollBehavior calls it on every navigation
    window.scrollTo = vi.fn()
    setActivePinia(createPinia())
    localStorage.clear()
    await router.push('/')
  })

  describe('route definitions', () => {
    it.each([
      ['/', 'Dashboard'],
      ['/watchlists', 'Watchlists'],
      ['/watchlist/1', 'WatchlistDetail'],
      ['/holdings', 'Holdings'],
      ['/accounts', 'Accounts']
    ])('resolves %s to the %s route', (path, name) => {
      const match = router.resolve(path)
      expect(match.name).toBe(name)
    })

    it('marks Watchlists, WatchlistDetail, Holdings, and Accounts as requiring a user', () => {
      for (const path of ['/watchlists', '/watchlist/1', '/holdings', '/accounts']) {
        expect(router.resolve(path).meta.requiresUser).toBe(true)
      }
    })

    it('does not require a user for the Dashboard route', () => {
      expect(router.resolve('/').meta.requiresUser).toBeUndefined()
    })

    it('resolves unknown paths to NotFound', () => {
      expect(router.resolve('/does-not-exist').name).toBe('NotFound')
    })
  })

  describe('navigation guard', () => {
    it('redirects to Dashboard when visiting a protected route with no current user', async () => {
      await router.push('/watchlists')
      expect(router.currentRoute.value.name).toBe('Dashboard')
    })

    it('allows navigation to a protected route when a current user is stored', async () => {
      localStorage.setItem('currentUser', JSON.stringify({ id: 1, name: 'Test User' }))
      await router.push('/holdings')
      expect(router.currentRoute.value.name).toBe('Holdings')
    })

    it('allows navigation to the Dashboard with no current user', async () => {
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('Dashboard')
    })

    it('allows navigation to NotFound with no current user', async () => {
      await router.push('/does-not-exist')
      expect(router.currentRoute.value.name).toBe('NotFound')
    })
  })
})
