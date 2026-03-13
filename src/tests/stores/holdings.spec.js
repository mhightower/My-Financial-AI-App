import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHoldingsStore } from '../../stores/holdings'
import * as api from '../../services/api'

vi.mock('../../services/api', () => ({
  holdings: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  accounts: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  sellTransactions: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  }
}))

describe('useHoldingsStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useHoldingsStore()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty arrays', () => {
      expect(store.holdings).toEqual([])
      expect(store.accounts).toEqual([])
      expect(store.sellTransactions).toEqual([])
    })
  })

  describe('fetchHoldings', () => {
    it('fetches holdings for user', async () => {
      const mockData = [{ id: 1, ticker: 'AAPL', quantity: 10 }]
      api.holdings.list.mockResolvedValue({ data: mockData })

      const result = await store.fetchHoldings(1)

      expect(result).toEqual(mockData)
      expect(store.holdings).toEqual(mockData)
    })

    it('sets error on failure', async () => {
      api.holdings.list.mockRejectedValue(new Error('Fetch failed'))

      await store.fetchHoldings(1)

      expect(store.error).toBe('Fetch failed')
    })
  })

  describe('fetchAccounts', () => {
    it('fetches accounts for user', async () => {
      const mockAccounts = [{ id: 1, name: 'Fidelity', account_type: 'taxable' }]
      api.accounts.list.mockResolvedValue({ data: mockAccounts })

      const result = await store.fetchAccounts(1)

      expect(result).toEqual(mockAccounts)
      expect(store.accounts).toEqual(mockAccounts)
    })
  })

  describe('createHolding', () => {
    it('creates and appends holding', async () => {
      const newHolding = { id: 2, ticker: 'MSFT', quantity: 5 }
      api.holdings.create.mockResolvedValue({ data: newHolding })

      const result = await store.createHolding(1, { ticker: 'MSFT', quantity: 5 })

      expect(result).toEqual(newHolding)
      expect(store.holdings).toContainEqual(newHolding)
    })

    it('returns null on error', async () => {
      api.holdings.create.mockRejectedValue(new Error('Create failed'))

      const result = await store.createHolding(1, {})

      expect(result).toBeNull()
    })
  })

  describe('createAccount', () => {
    it('creates and appends account', async () => {
      const newAccount = { id: 1, name: 'Schwab', account_type: 'IRA' }
      api.accounts.create.mockResolvedValue({ data: newAccount })

      const result = await store.createAccount(1, { name: 'Schwab' })

      expect(result).toEqual(newAccount)
      expect(store.accounts).toContainEqual(newAccount)
    })
  })

  describe('deleteHolding', () => {
    it('removes holding from list', async () => {
      store.holdings = [{ id: 1, ticker: 'AAPL' }, { id: 2, ticker: 'MSFT' }]
      api.holdings.delete.mockResolvedValue({})

      await store.deleteHolding(1)

      expect(store.holdings).toEqual([{ id: 2, ticker: 'MSFT' }])
    })

    it('sets error on failure', async () => {
      api.holdings.delete.mockRejectedValue(new Error('Delete failed'))

      await store.deleteHolding(1)

      expect(store.error).toBe('Delete failed')
    })
  })

  describe('deleteAccount', () => {
    it('removes account from list', async () => {
      store.accounts = [{ id: 1, name: 'Fidelity' }, { id: 2, name: 'Schwab' }]
      api.accounts.delete.mockResolvedValue({})

      await store.deleteAccount(1)

      expect(store.accounts).toEqual([{ id: 2, name: 'Schwab' }])
    })
  })

  describe('updateAccount', () => {
    it('updates account in list', async () => {
      store.accounts = [{ id: 1, name: 'Fidelity' }]
      const updated = { id: 1, name: 'Fidelity Updated' }
      api.accounts.update.mockResolvedValue({ data: updated })

      const result = await store.updateAccount(1, { name: 'Fidelity Updated' })

      expect(result).toEqual(updated)
      expect(store.accounts[0]).toEqual(updated)
    })

    it('returns null on error', async () => {
      api.accounts.update.mockRejectedValue(new Error('Update failed'))

      const result = await store.updateAccount(1, {})

      expect(result).toBeNull()
    })
  })

  describe('updateHolding', () => {
    it('updates holding in list', async () => {
      store.holdings = [{ id: 1, ticker: 'AAPL', quantity: 10 }]
      const updated = { id: 1, ticker: 'AAPL', quantity: 20 }
      api.holdings.update.mockResolvedValue({ data: updated })

      const result = await store.updateHolding(1, { quantity: 20 })

      expect(result).toEqual(updated)
      expect(store.holdings[0].quantity).toBe(20)
    })
  })

  describe('fetchSellTransactions', () => {
    it('fetches sell transactions', async () => {
      const mockTxns = [{ id: 1, ticker: 'AAPL', shares_sold: 5 }]
      api.sellTransactions.list.mockResolvedValue({ data: mockTxns })

      const result = await store.fetchSellTransactions(1)

      expect(result).toEqual(mockTxns)
      expect(store.sellTransactions).toEqual(mockTxns)
    })
  })

  describe('createSellTransaction', () => {
    it('creates and appends sell transaction', async () => {
      const newTxn = { id: 2, ticker: 'MSFT', shares_sold: 3 }
      api.sellTransactions.create.mockResolvedValue({ data: newTxn })

      const result = await store.createSellTransaction(1, { ticker: 'MSFT' })

      expect(result).toEqual(newTxn)
      expect(store.sellTransactions).toContainEqual(newTxn)
    })
  })

  describe('deleteSellTransaction', () => {
    it('removes sell transaction from list', async () => {
      store.sellTransactions = [{ id: 1, ticker: 'AAPL' }, { id: 2, ticker: 'MSFT' }]
      api.sellTransactions.delete.mockResolvedValue({})

      await store.deleteSellTransaction(1)

      expect(store.sellTransactions).toEqual([{ id: 2, ticker: 'MSFT' }])
    })
  })
})
