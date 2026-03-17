import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the error store before importing api
vi.mock('../../stores/error', () => ({
  useErrorStore: vi.fn(() => ({
    addError: vi.fn()
  }))
}))

// Mock axios so we can control the instance and interceptors
let capturedResponseInterceptor = null

vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn((fulfilled, rejected) => {
          capturedResponseInterceptor = { fulfilled, rejected }
        })
      }
    }
  }
  return {
    default: {
      create: vi.fn(() => mockInstance)
    }
  }
})

// Import api once — the interceptor is captured at module load time
import { beforeAll } from 'vitest'
beforeAll(async () => {
  await import('../../services/api')
})

describe('API Service — response interceptor', () => {
  it('registers a response interceptor on the axios instance', () => {
    // capturedResponseInterceptor is populated when api.js calls
    // api.interceptors.response.use(...) at module load time
    expect(capturedResponseInterceptor).not.toBeNull()
    expect(typeof capturedResponseInterceptor.fulfilled).toBe('function')
    expect(typeof capturedResponseInterceptor.rejected).toBe('function')
  })
})

describe('API Service — interceptor behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('passes through successful responses unchanged', () => {
    if (!capturedResponseInterceptor?.fulfilled) return
    const mockResponse = { data: { id: 1 }, status: 200 }
    const result = capturedResponseInterceptor.fulfilled(mockResponse)
    expect(result).toBe(mockResponse)
  })

  it('calls addError on 500 server error', async () => {
    if (!capturedResponseInterceptor?.rejected) return
    const { useErrorStore } = await import('../../stores/error')
    const mockAddError = vi.fn()
    useErrorStore.mockReturnValue({ addError: mockAddError })

    const error = { response: { status: 500, data: { detail: 'Internal Server Error' } } }
    try { await capturedResponseInterceptor.rejected(error) } catch { /* expected */ }
    expect(mockAddError).toHaveBeenCalledWith('Server error. Please try again later.', 'error', 8000)
  })

  it('calls addError on 404 not found error', async () => {
    if (!capturedResponseInterceptor?.rejected) return
    const { useErrorStore } = await import('../../stores/error')
    const mockAddError = vi.fn()
    useErrorStore.mockReturnValue({ addError: mockAddError })

    const error = { response: { status: 404, data: { detail: 'Not found' } } }
    try { await capturedResponseInterceptor.rejected(error) } catch { /* expected */ }
    expect(mockAddError).toHaveBeenCalledWith('Not found', 'error', 5000)
  })

  it('formats Pydantic array detail into a readable string for 422 errors', async () => {
    if (!capturedResponseInterceptor?.rejected) return
    const { useErrorStore } = await import('../../stores/error')
    const mockAddError = vi.fn()
    useErrorStore.mockReturnValue({ addError: mockAddError })

    const error = {
      response: {
        status: 422,
        data: {
          detail: [
            { type: 'missing', loc: ['body', 'user_id'], msg: 'Field required', input: {}, url: 'https://errors.pydantic.dev/2.5/v/missing' }
          ]
        }
      }
    }
    try { await capturedResponseInterceptor.rejected(error) } catch { /* expected */ }

    const [calledMessage] = mockAddError.mock.calls[0]
    expect(calledMessage).toContain('user_id')
    expect(calledMessage).toContain('Field required')
    expect(calledMessage).not.toContain('[object Object]')
    expect(calledMessage).not.toContain('errors.pydantic.dev')
  })

  it('formats multiple Pydantic field errors as a semicolon-separated list', async () => {
    if (!capturedResponseInterceptor?.rejected) return
    const { useErrorStore } = await import('../../stores/error')
    const mockAddError = vi.fn()
    useErrorStore.mockReturnValue({ addError: mockAddError })

    const error = {
      response: {
        status: 422,
        data: {
          detail: [
            { type: 'missing', loc: ['body', 'name'], msg: 'Field required', input: {} },
            { type: 'missing', loc: ['body', 'account_type'], msg: 'Field required', input: {} }
          ]
        }
      }
    }
    try { await capturedResponseInterceptor.rejected(error) } catch { /* expected */ }

    const [calledMessage] = mockAddError.mock.calls[0]
    expect(calledMessage).toContain('name: Field required')
    expect(calledMessage).toContain('account_type: Field required')
  })

  it('always re-throws errors after handling', async () => {
    if (!capturedResponseInterceptor?.rejected) return
    const { useErrorStore } = await import('../../stores/error')
    useErrorStore.mockReturnValue({ addError: vi.fn() })

    const error = { response: { status: 422, data: { detail: 'Validation error' } } }
    await expect(capturedResponseInterceptor.rejected(error)).rejects.toBe(error)
  })
})
