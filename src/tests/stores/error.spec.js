import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErrorStore } from '../../stores/error'

describe('useErrorStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useErrorStore()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('has empty errors array', () => {
      expect(store.errors).toEqual([])
    })

    it('hasErrors returns false when empty', () => {
      expect(store.hasErrors).toBe(false)
    })

    it('latestError returns null when empty', () => {
      expect(store.latestError).toBeNull()
    })
  })

  describe('addError', () => {
    it('adds an error with message, type, and id', () => {
      store.addError('Something went wrong')
      expect(store.errors).toHaveLength(1)
      expect(store.errors[0].message).toBe('Something went wrong')
      expect(store.errors[0].id).toBeDefined()
      expect(store.errors[0].type).toBe('error')
    })

    it('accepts a custom type', () => {
      store.addError('A warning occurred', 'warning')
      expect(store.errors[0].type).toBe('warning')
    })

    it('auto-dismisses the error after 5 seconds', () => {
      store.addError('Auto dismiss me')
      expect(store.errors).toHaveLength(1)

      vi.advanceTimersByTime(5000)
      expect(store.errors).toHaveLength(0)
    })

    it('does not dismiss before 5 seconds', () => {
      store.addError('Not dismissed yet')
      vi.advanceTimersByTime(4999)
      expect(store.errors).toHaveLength(1)
    })

    it('supports longer timeout for network errors', () => {
      store.addError('Network error', 'error', 8000)
      vi.advanceTimersByTime(5000)
      expect(store.errors).toHaveLength(1)

      vi.advanceTimersByTime(3000)
      expect(store.errors).toHaveLength(0)
    })

    it('multiple errors accumulate', () => {
      store.addError('First error')
      store.addError('Second error')
      expect(store.errors).toHaveLength(2)
    })

    it('hasErrors returns true when there are errors', () => {
      store.addError('An error')
      expect(store.hasErrors).toBe(true)
    })

    it('latestError returns the most recent error', () => {
      store.addError('First')
      store.addError('Second')
      expect(store.latestError.message).toBe('Second')
    })
  })

  describe('dismissError', () => {
    it('removes error by id', () => {
      store.addError('Dismiss me')
      const id = store.errors[0].id
      store.dismissError(id)
      expect(store.errors).toHaveLength(0)
    })

    it('only removes the matching error', () => {
      store.addError('Keep me')
      store.addError('Remove me')
      const idToRemove = store.errors[1].id
      store.dismissError(idToRemove)
      expect(store.errors).toHaveLength(1)
      expect(store.errors[0].message).toBe('Keep me')
    })

    it('does nothing when id not found', () => {
      store.addError('An error')
      store.dismissError('nonexistent-id')
      expect(store.errors).toHaveLength(1)
    })
  })

  describe('clearAll', () => {
    it('removes all errors', () => {
      store.addError('Error 1')
      store.addError('Error 2')
      store.clearAll()
      expect(store.errors).toHaveLength(0)
    })
  })
})
