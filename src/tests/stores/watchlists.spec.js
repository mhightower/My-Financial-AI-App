import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWatchlistsStore } from '../../stores/watchlists'
import * as api from '../../services/api'

vi.mock('../../services/api', () => ({
  watchlists: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addStock: vi.fn(),
    updateStock: vi.fn(),
    removeStock: vi.fn()
  }
}))

describe('useWatchlistsStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useWatchlistsStore()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty watchlists', () => {
      expect(store.watchlists).toEqual([])
    })

    it('has null currentWatchlist', () => {
      expect(store.currentWatchlist).toBeNull()
    })
  })

  describe('fetchWatchlists', () => {
    it('fetches watchlists for a user', async () => {
      const mockData = [{ id: 1, name: 'Growth' }, { id: 2, name: 'Value' }]
      api.watchlists.list.mockResolvedValue({ data: mockData })

      const result = await store.fetchWatchlists(1)

      expect(result).toEqual(mockData)
      expect(store.watchlists).toEqual(mockData)
      expect(api.watchlists.list).toHaveBeenCalledWith(1)
    })

    it('sets error on failure', async () => {
      api.watchlists.list.mockRejectedValue(new Error('Failed'))

      await store.fetchWatchlists(1)

      expect(store.error).toBe('Failed')
    })
  })

  describe('fetchWatchlist', () => {
    it('fetches single watchlist and sets currentWatchlist', async () => {
      const mockWl = { id: 1, name: 'Growth', stocks: [] }
      api.watchlists.get.mockResolvedValue({ data: mockWl })

      const result = await store.fetchWatchlist(1)

      expect(result).toEqual(mockWl)
      expect(store.currentWatchlist).toEqual(mockWl)
    })

    it('returns null on error', async () => {
      api.watchlists.get.mockRejectedValue(new Error('Not found'))

      const result = await store.fetchWatchlist(999)

      expect(result).toBeNull()
    })
  })

  describe('createWatchlist', () => {
    it('creates and appends watchlist', async () => {
      const newWl = { id: 3, name: 'Dividend' }
      api.watchlists.create.mockResolvedValue({ data: newWl })

      const result = await store.createWatchlist(1, { name: 'Dividend' })

      expect(result).toEqual(newWl)
      expect(store.watchlists).toContainEqual(newWl)
    })
  })

  describe('deleteWatchlist', () => {
    it('removes watchlist from list', async () => {
      store.watchlists = [{ id: 1, name: 'Growth' }, { id: 2, name: 'Value' }]
      api.watchlists.delete.mockResolvedValue({})

      await store.deleteWatchlist(1)

      expect(store.watchlists).toEqual([{ id: 2, name: 'Value' }])
    })

    it('clears currentWatchlist if deleted', async () => {
      store.currentWatchlist = { id: 1, name: 'Growth' }
      store.watchlists = [{ id: 1, name: 'Growth' }]
      api.watchlists.delete.mockResolvedValue({})

      await store.deleteWatchlist(1)

      expect(store.currentWatchlist).toBeNull()
    })
  })

  describe('updateWatchlist', () => {
    it('updates watchlist in list and currentWatchlist', async () => {
      store.watchlists = [{ id: 1, name: 'Growth' }]
      store.currentWatchlist = { id: 1, name: 'Growth' }
      const updated = { id: 1, name: 'Growth v2' }
      api.watchlists.update.mockResolvedValue({ data: updated })

      const result = await store.updateWatchlist(1, { name: 'Growth v2' })

      expect(result).toEqual(updated)
      expect(store.watchlists[0]).toEqual(updated)
      expect(store.currentWatchlist).toEqual(updated)
    })
  })

  describe('addStockToWatchlist', () => {
    it('adds stock to current watchlist stocks', async () => {
      store.currentWatchlist = { id: 1, name: 'Growth', stocks: [] }
      const newStock = { id: 10, ticker: 'AAPL' }
      api.watchlists.addStock.mockResolvedValue({ data: newStock })

      const result = await store.addStockToWatchlist(1, { ticker: 'AAPL' })

      expect(result).toEqual(newStock)
      expect(store.currentWatchlist.stocks).toContainEqual(newStock)
    })

    it('does not modify stocks if different watchlist', async () => {
      store.currentWatchlist = { id: 2, name: 'Value', stocks: [] }
      api.watchlists.addStock.mockResolvedValue({ data: { id: 10, ticker: 'AAPL' } })

      await store.addStockToWatchlist(1, { ticker: 'AAPL' })

      expect(store.currentWatchlist.stocks).toEqual([])
    })
  })

  describe('removeStockFromWatchlist', () => {
    it('removes stock from current watchlist', async () => {
      store.currentWatchlist = { id: 1, stocks: [{ id: 10, ticker: 'AAPL' }, { id: 11, ticker: 'MSFT' }] }
      api.watchlists.removeStock.mockResolvedValue({})

      await store.removeStockFromWatchlist(1, 10)

      expect(store.currentWatchlist.stocks).toEqual([{ id: 11, ticker: 'MSFT' }])
    })
  })

  describe('updateStockInWatchlist', () => {
    it('updates stock in current watchlist', async () => {
      store.currentWatchlist = { id: 1, stocks: [{ id: 10, ticker: 'AAPL', buy_price: 100 }] }
      const updated = { id: 10, ticker: 'AAPL', buy_price: 150 }
      api.watchlists.updateStock.mockResolvedValue({ data: updated })

      const result = await store.updateStockInWatchlist(1, 10, { buy_price: 150 })

      expect(result).toEqual(updated)
      expect(store.currentWatchlist.stocks[0].buy_price).toBe(150)
    })

    it('returns null on error', async () => {
      api.watchlists.updateStock.mockRejectedValue(new Error('Fail'))

      const result = await store.updateStockInWatchlist(1, 10, {})

      expect(result).toBeNull()
      expect(store.error).toBe('Fail')
    })
  })
})
