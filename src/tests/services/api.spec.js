import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { users, watchlists, accounts, holdings, stocks, sellTransactions } from '../../services/api'

vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
  return {
    default: {
      create: vi.fn(() => mockInstance),
      ...mockInstance
    }
  }
})

describe('API Service', () => {
  let mockApi

  beforeEach(() => {
    mockApi = axios.create()
    vi.clearAllMocks()
  })

  describe('users', () => {
    it('list calls GET /users', async () => {
      mockApi.get.mockResolvedValue({ data: [] })
      await users.list()
      expect(mockApi.get).toHaveBeenCalledWith('/users')
    })

    it('get calls GET /users/:id', async () => {
      mockApi.get.mockResolvedValue({ data: {} })
      await users.get(1)
      expect(mockApi.get).toHaveBeenCalledWith('/users/1')
    })

    it('create calls POST /users', async () => {
      mockApi.post.mockResolvedValue({ data: {} })
      await users.create({ name: 'Test' })
      expect(mockApi.post).toHaveBeenCalledWith('/users', { name: 'Test' })
    })

    it('update calls PUT /users/:id', async () => {
      mockApi.put.mockResolvedValue({ data: {} })
      await users.update(1, { name: 'Updated' })
      expect(mockApi.put).toHaveBeenCalledWith('/users/1', { name: 'Updated' })
    })

    it('delete calls DELETE /users/:id', async () => {
      mockApi.delete.mockResolvedValue({})
      await users.delete(1)
      expect(mockApi.delete).toHaveBeenCalledWith('/users/1')
    })
  })

  describe('watchlists', () => {
    it('list calls GET /users/:userId/watchlists', async () => {
      mockApi.get.mockResolvedValue({ data: [] })
      await watchlists.list(1)
      expect(mockApi.get).toHaveBeenCalledWith('/users/1/watchlists')
    })

    it('get calls GET /watchlists/:id', async () => {
      mockApi.get.mockResolvedValue({ data: {} })
      await watchlists.get(5)
      expect(mockApi.get).toHaveBeenCalledWith('/watchlists/5')
    })

    it('create passes user_id as query param', async () => {
      mockApi.post.mockResolvedValue({ data: {} })
      await watchlists.create(1, { name: 'Growth' })
      expect(mockApi.post).toHaveBeenCalledWith('/watchlists?user_id=1', { name: 'Growth' })
    })

    it('addStock calls POST on watchlist stocks', async () => {
      mockApi.post.mockResolvedValue({ data: {} })
      await watchlists.addStock(1, { ticker: 'AAPL' })
      expect(mockApi.post).toHaveBeenCalledWith('/watchlists/1/stocks', { ticker: 'AAPL' })
    })

    it('removeStock calls DELETE', async () => {
      mockApi.delete.mockResolvedValue({})
      await watchlists.removeStock(1, 10)
      expect(mockApi.delete).toHaveBeenCalledWith('/watchlists/1/stocks/10')
    })

    it('updateStock calls PUT', async () => {
      mockApi.put.mockResolvedValue({ data: {} })
      await watchlists.updateStock(1, 10, { buy_price: 150 })
      expect(mockApi.put).toHaveBeenCalledWith('/watchlists/1/stocks/10', { buy_price: 150 })
    })
  })

  describe('accounts', () => {
    it('list calls GET /users/:userId/accounts', async () => {
      mockApi.get.mockResolvedValue({ data: [] })
      await accounts.list(1)
      expect(mockApi.get).toHaveBeenCalledWith('/users/1/accounts')
    })

    it('create passes user_id as query param', async () => {
      mockApi.post.mockResolvedValue({ data: {} })
      await accounts.create(1, { name: 'Fidelity' })
      expect(mockApi.post).toHaveBeenCalledWith('/accounts?user_id=1', { name: 'Fidelity' })
    })
  })

  describe('holdings', () => {
    it('list calls GET /users/:userId/holdings', async () => {
      mockApi.get.mockResolvedValue({ data: [] })
      await holdings.list(1)
      expect(mockApi.get).toHaveBeenCalledWith('/users/1/holdings')
    })

    it('create passes user_id as query param', async () => {
      mockApi.post.mockResolvedValue({ data: {} })
      await holdings.create(1, { ticker: 'AAPL' })
      expect(mockApi.post).toHaveBeenCalledWith('/holdings?user_id=1', { ticker: 'AAPL' })
    })
  })

  describe('stocks', () => {
    it('search calls GET with query and limit', async () => {
      mockApi.get.mockResolvedValue({ data: [] })
      await stocks.search('AAPL', 5)
      expect(mockApi.get).toHaveBeenCalledWith('/stocks/search?q=AAPL&limit=5')
    })

    it('search uses default limit of 10', async () => {
      mockApi.get.mockResolvedValue({ data: [] })
      await stocks.search('MSFT')
      expect(mockApi.get).toHaveBeenCalledWith('/stocks/search?q=MSFT&limit=10')
    })

    it('getQuote calls GET /stocks/:ticker/quote', async () => {
      mockApi.get.mockResolvedValue({ data: {} })
      await stocks.getQuote('AAPL')
      expect(mockApi.get).toHaveBeenCalledWith('/stocks/AAPL/quote')
    })

    it('getDetail calls GET /stocks/:ticker/detail', async () => {
      mockApi.get.mockResolvedValue({ data: {} })
      await stocks.getDetail('AAPL')
      expect(mockApi.get).toHaveBeenCalledWith('/stocks/AAPL/detail')
    })

    it('getHistory uses default days', async () => {
      mockApi.get.mockResolvedValue({ data: {} })
      await stocks.getHistory('AAPL')
      expect(mockApi.get).toHaveBeenCalledWith('/stocks/AAPL/history?days=30')
    })

    it('getHistory accepts custom days', async () => {
      mockApi.get.mockResolvedValue({ data: {} })
      await stocks.getHistory('AAPL', 90)
      expect(mockApi.get).toHaveBeenCalledWith('/stocks/AAPL/history?days=90')
    })
  })

  describe('sellTransactions', () => {
    it('list calls correct endpoint', async () => {
      mockApi.get.mockResolvedValue({ data: [] })
      await sellTransactions.list(1)
      expect(mockApi.get).toHaveBeenCalledWith('/sell-transactions/users/1/transactions')
    })

    it('create passes user_id as query param', async () => {
      mockApi.post.mockResolvedValue({ data: {} })
      await sellTransactions.create(1, { ticker: 'AAPL' })
      expect(mockApi.post).toHaveBeenCalledWith('/sell-transactions?user_id=1', { ticker: 'AAPL' })
    })
  })
})
