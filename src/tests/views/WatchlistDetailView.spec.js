import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import WatchlistDetailView from '../../views/WatchlistDetailView.vue'
import { useWatchlistsStore } from '../../stores/watchlists'

const MOCK_WATCHLIST_EMPTY = { id: 1, name: 'Growth', description: 'Long-term picks', stocks: [] }

const MOCK_STOCK = {
  id: 10, ticker: 'AAPL', watchlist_id: 1,
  buy_reasons: 'Strong ecosystem and recurring revenue.',
  sell_conditions: 'Sell if iPhone market share drops below 40%.',
  buy_price: 150, sell_price: 220, stop_loss_pct: 0.1
}

const MOCK_STOCK_NO_THESIS = {
  id: 11, ticker: 'TSLA', watchlist_id: 1,
  buy_reasons: null, sell_conditions: null,
  buy_price: null, sell_price: null, stop_loss_pct: null
}

const MOCK_ANALYSIS = {
  quality_score: 8,
  conviction_level: 'High',
  strengths: ['Strong ecosystem moat'],
  blind_spots: ['Valuation risk'],
  suggestions: ['Add P/E ceiling trigger']
}

vi.mock('../../services/api', () => ({
  stocks: {
    search: vi.fn().mockResolvedValue({ data: [] })
  },
  watchlists: {
    get: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Growth', description: 'Long-term picks', stocks: [] } }),
    addStock: vi.fn().mockResolvedValue({ data: { id: 10, ticker: 'AAPL', watchlist_id: 1 } }),
    removeStock: vi.fn().mockResolvedValue({})
  },
  ai: {
    analyzeThesis: vi.fn().mockResolvedValue({ data: { quality_score: 8, conviction_level: 'High', strengths: ['Strong ecosystem moat'], blind_spots: ['Valuation risk'], suggestions: ['Add P/E ceiling trigger'] } }),
    draftThesis: vi.fn().mockResolvedValue({
      data: { buy_reasons: 'AI-generated buy reason.', sell_conditions: 'AI-generated sell condition.' }
    })
  }
}))

async function mountView(watchlist = null) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/watchlist/:id', component: WatchlistDetailView },
      { path: '/watchlists', component: { template: '<div/>' } }
    ]
  })
  await router.push('/watchlist/1')

  if (watchlist !== null) {
    useWatchlistsStore().currentWatchlist = watchlist
  }

  return mount(WatchlistDetailView, {
    global: { plugins: [pinia, router] }
  })
}

describe('WatchlistDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // --- Rendering ---

  it('shows loading state when watchlist is null', async () => {
    const wrapper = await mountView(null)
    expect(wrapper.text()).toContain('Loading watchlist')
  })

  it('shows empty state when watchlist has no stocks', async () => {
    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    expect(wrapper.text()).toContain('No stocks in this watchlist yet')
  })

  it('renders watchlist name and description', async () => {
    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    expect(wrapper.text()).toContain('Growth')
    expect(wrapper.text()).toContain('Long-term picks')
  })

  it('renders stock cards with ticker', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    expect(wrapper.text()).toContain('AAPL')
    expect(wrapper.findAll('.stock-card').length).toBe(1)
  })

  it('renders buy/sell/stop trigger badges when set', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    expect(wrapper.text()).toContain('150')
    expect(wrapper.text()).toContain('220')
    expect(wrapper.text()).toContain('10%')
  })

  it('shows thesis text blocks when buy_reasons and sell_conditions are present', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    expect(wrapper.text()).toContain('Strong ecosystem and recurring revenue')
    expect(wrapper.text()).toContain('Sell if iPhone market share')
  })

  it('shows stock count in panel header', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    expect(wrapper.find('.panel-title').text()).toContain('1/15')
  })

  it('disables Add Stock button when 15 stocks are present', async () => {
    const stocks = Array.from({ length: 15 }, (_, i) => ({ ...MOCK_STOCK, id: i + 1 }))
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Stock'))
    expect(addBtn.attributes('disabled')).toBeDefined()
  })

  // --- Add Stock Modal ---

  it('opens Add Stock modal on button click', async () => {
    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    expect(wrapper.find('.modal').exists()).toBe(false)
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.modal').exists()).toBe(true)
  })

  it('closes Add Stock modal on Cancel', async () => {
    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.modal').exists()).toBe(true)

    const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancel')
    await cancelBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  // --- Generate with AI ---

  it('Generate with AI button is disabled when ticker is empty', async () => {
    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    const genBtn = wrapper.findAll('button').find(b => b.text().includes('Generate with AI'))
    expect(genBtn.exists()).toBe(true)
    expect(genBtn.attributes('disabled')).toBeDefined()
  })

  it('Generate with AI fills textareas on success', async () => {
    const { ai } = await import('../../services/api')
    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    // Set ticker so button is enabled
    const tickerInput = wrapper.find('#ticker')
    await tickerInput.setValue('AAPL')

    const genBtn = wrapper.findAll('button').find(b => b.text().includes('Generate with AI'))
    await genBtn.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 0)) // flush microtasks

    expect(ai.draftThesis).toHaveBeenCalledWith('AAPL')
    expect(wrapper.find('#buy-reasons').element.value).toContain('AI-generated buy reason')
    expect(wrapper.find('#sell-conditions').element.value).toContain('AI-generated sell condition')
  })

  // --- Analyze Button ---

  it('Analyze button appears on cards with thesis text', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    const analyzeBtn = wrapper.findAll('button').find(b => b.text().includes('Analyze'))
    expect(analyzeBtn).toBeTruthy()
  })

  it('Analyze button does not appear on cards without thesis', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK_NO_THESIS] })
    const analyzeBtn = wrapper.findAll('button').find(b => b.text().includes('Analyze'))
    expect(analyzeBtn).toBeUndefined()
  })

  it('clicking Analyze opens analysis modal with score and sections', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    const analyzeBtn = wrapper.findAll('button').find(b => b.text().includes('Analyze'))
    await analyzeBtn.trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.score-badge').exists()).toBe(true)
    expect(wrapper.text()).toContain('High')
    expect(wrapper.text()).toContain('Strong ecosystem moat')
    expect(wrapper.text()).toContain('Valuation risk')
    expect(wrapper.text()).toContain('Add P/E ceiling trigger')
  })

  it('scoreClass is score-good for quality_score >= 7', async () => {
    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    const analyzeBtn = wrapper.findAll('button').find(b => b.text().includes('Analyze'))
    await analyzeBtn.trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.score-badge').classes()).toContain('score-good')
  })

  // --- Search dropdown ---

  it('shows search results dropdown when searchResults are set', async () => {
    vi.useFakeTimers()
    const { stocks } = await import('../../services/api')
    stocks.search.mockResolvedValueOnce({
      data: [{ ticker: 'ILF', name: 'iShares Latin America', type: 'ETF', region: 'US' }]
    })

    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    const tickerInput = wrapper.find('#ticker')
    await tickerInput.setValue('ILF')
    await tickerInput.trigger('input')
    await vi.runAllTimersAsync() // advance past 300ms debounce and flush async
    await wrapper.vm.$nextTick()

    vi.useRealTimers()
    expect(wrapper.find('.search-dropdown').exists()).toBe(true)
    expect(wrapper.text()).toContain('iShares Latin America')
  })

  it('selecting a search result sets ticker and clears dropdown', async () => {
    vi.useFakeTimers()
    const { stocks } = await import('../../services/api')
    stocks.search.mockResolvedValueOnce({
      data: [{ ticker: 'MSFT', name: 'Microsoft', type: 'Equity', region: 'US' }]
    })

    const wrapper = await mountView(MOCK_WATCHLIST_EMPTY)
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    const tickerInput = wrapper.find('#ticker')
    await tickerInput.setValue('MS')
    await tickerInput.trigger('input')
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    await wrapper.find('.search-result').trigger('click')
    await wrapper.vm.$nextTick()
    vi.useRealTimers()

    expect(wrapper.find('#ticker').element.value).toBe('MSFT')
    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
  })

  // --- Remove stock ---

  it('remove button calls removeStockFromWatchlist after confirm', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

    const wrapper = await mountView({ ...MOCK_WATCHLIST_EMPTY, stocks: [MOCK_STOCK] })
    const store = useWatchlistsStore()
    store.removeStockFromWatchlist = vi.fn().mockResolvedValue(undefined)

    const removeBtn = wrapper.find('.icon-btn.danger')
    await removeBtn.trigger('click')

    expect(store.removeStockFromWatchlist).toHaveBeenCalledWith(1, MOCK_STOCK.id)
    vi.unstubAllGlobals()
  })
})
