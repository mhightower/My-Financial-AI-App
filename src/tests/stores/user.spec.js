import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../../stores/user'
import * as api from '../../services/api'

vi.mock('../../services/api', () => ({
  users: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

describe('useUserStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useUserStore()
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('has null currentUser', () => {
      expect(store.currentUser).toBeNull()
    })

    it('has empty users array', () => {
      expect(store.users).toEqual([])
    })

    it('is not authenticated', () => {
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('fetchUsers', () => {
    it('fetches and sets users', async () => {
      const mockUsers = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
      api.users.list.mockResolvedValue({ data: mockUsers })

      await store.fetchUsers()

      expect(store.users).toEqual(mockUsers)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets error on failure', async () => {
      api.users.list.mockRejectedValue(new Error('Network error'))

      await store.fetchUsers()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })

    it('sets loading during fetch', async () => {
      let resolvePromise
      api.users.list.mockReturnValue(new Promise(r => { resolvePromise = r }))

      const promise = store.fetchUsers()
      expect(store.loading).toBe(true)

      resolvePromise({ data: [] })
      await promise
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchUser', () => {
    it('returns user data', async () => {
      const mockUser = { id: 1, name: 'Alice' }
      api.users.get.mockResolvedValue({ data: mockUser })

      const result = await store.fetchUser(1)

      expect(result).toEqual(mockUser)
      expect(api.users.get).toHaveBeenCalledWith(1)
    })

    it('returns null on error', async () => {
      api.users.get.mockRejectedValue(new Error('Not found'))

      const result = await store.fetchUser(999)

      expect(result).toBeNull()
      expect(store.error).toBe('Not found')
    })
  })

  describe('createUser', () => {
    it('creates user and adds to list', async () => {
      const newUser = { id: 3, name: 'Charlie' }
      api.users.create.mockResolvedValue({ data: newUser })

      const result = await store.createUser({ name: 'Charlie' })

      expect(result).toEqual(newUser)
      expect(store.users).toContainEqual(newUser)
    })

    it('returns null on failure', async () => {
      api.users.create.mockRejectedValue(new Error('Validation error'))

      const result = await store.createUser({ name: '' })

      expect(result).toBeNull()
      expect(store.error).toBe('Validation error')
    })
  })

  describe('setCurrentUser', () => {
    it('sets user and persists to localStorage', () => {
      const user = { id: 1, name: 'Alice' }
      store.setCurrentUser(user)

      expect(store.currentUser).toEqual(user)
      expect(store.isAuthenticated).toBe(true)
      expect(JSON.parse(localStorage.getItem('currentUser'))).toEqual(user)
    })
  })

  describe('loadCurrentUser', () => {
    it('loads user from localStorage', () => {
      const user = { id: 1, name: 'Alice' }
      localStorage.setItem('currentUser', JSON.stringify(user))

      store.loadCurrentUser()

      expect(store.currentUser).toEqual(user)
    })

    it('does nothing when localStorage is empty', () => {
      store.loadCurrentUser()
      expect(store.currentUser).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears user and localStorage', () => {
      store.setCurrentUser({ id: 1, name: 'Alice' })
      store.logout()

      expect(store.currentUser).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('currentUser')).toBeNull()
    })
  })

  describe('deleteUser', () => {
    it('deletes user and removes from list', async () => {
      store.users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
      api.users.delete.mockResolvedValue({})

      await store.deleteUser(1)

      expect(store.users).toEqual([{ id: 2, name: 'Bob' }])
    })

    it('throws and sets error on failure', async () => {
      api.users.delete.mockRejectedValue(new Error('Server error'))

      await expect(store.deleteUser(1)).rejects.toThrow('Server error')
      expect(store.error).toBe('Server error')
    })
  })

  describe('updateUser', () => {
    it('updates user in list', async () => {
      store.users = [{ id: 1, name: 'Alice' }]
      const updated = { id: 1, name: 'Alice Updated' }
      api.users.update.mockResolvedValue({ data: updated })

      const result = await store.updateUser(1, { name: 'Alice Updated' })

      expect(result).toEqual(updated)
      expect(store.users[0]).toEqual(updated)
    })

    it('updates currentUser if same id', async () => {
      const user = { id: 1, name: 'Alice' }
      store.setCurrentUser(user)
      store.users = [user]
      const updated = { id: 1, name: 'Alice Updated' }
      api.users.update.mockResolvedValue({ data: updated })

      await store.updateUser(1, { name: 'Alice Updated' })

      expect(store.currentUser).toEqual(updated)
    })

    it('returns null on failure', async () => {
      api.users.update.mockRejectedValue(new Error('Update failed'))

      const result = await store.updateUser(1, {})

      expect(result).toBeNull()
      expect(store.error).toBe('Update failed')
    })
  })
})
