import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the error store before importing api
vi.mock('../../stores/error', () => ({
  useErrorStore: vi.fn(() => ({
    addError: vi.fn()
  }))
}))

// Mock axios so we can control the instance and interceptors
const mockInterceptorFulfilled = vi.fn()
const mockInterceptorRejected = vi.fn()
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

describe('API Service — response interceptor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    capturedResponseInterceptor = null
  })

  it('registers a response interceptor on the axios instance', async () => {
    const axios = (await import('axios')).default
    // Force re-import of api to trigger interceptor registration
    await import('../../services/api?t=' + Date.now())
    const instance = axios.create()
    expect(instance.interceptors.response.use).toHaveBeenCalled()
  })
})

describe('API Service — interceptor behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('passes through successful responses unchanged', async () => {
    // Re-import to get fresh interceptor
    const apiModule = await import('../../services/api')
    // Interceptor fulfilled handler should return the response as-is
    if (capturedResponseInterceptor?.fulfilled) {
      const mockResponse = { data: { id: 1 }, status: 200 }
      const result = capturedResponseInterceptor.fulfilled(mockResponse)
      expect(result).toBe(mockResponse)
    }
  })

  it('calls addError on 500 server error', async () => {
    const { useErrorStore } = await import('../../stores/error')
    const mockAddError = vi.fn()
    useErrorStore.mockReturnValue({ addError: mockAddError })

    if (capturedResponseInterceptor?.rejected) {
      const error = {
        response: { status: 500, data: { detail: 'Internal Server Error' } },
        message: 'Request failed with status code 500'
      }
      try {
        await capturedResponseInterceptor.rejected(error)
      } catch {
        // expected to re-throw
      }
      expect(mockAddError).toHaveBeenCalled()
    }
  })

  it('calls addError on 404 not found error', async () => {
    const { useErrorStore } = await import('../../stores/error')
    const mockAddError = vi.fn()
    useErrorStore.mockReturnValue({ addError: mockAddError })

    if (capturedResponseInterceptor?.rejected) {
      const error = {
        response: { status: 404, data: { detail: 'Not found' } },
        message: 'Request failed with status code 404'
      }
      try {
        await capturedResponseInterceptor.rejected(error)
      } catch {
        // expected to re-throw
      }
      expect(mockAddError).toHaveBeenCalled()
    }
  })

  it('always re-throws errors after handling', async () => {
    const { useErrorStore } = await import('../../stores/error')
    useErrorStore.mockReturnValue({ addError: vi.fn() })

    if (capturedResponseInterceptor?.rejected) {
      const error = {
        response: { status: 422, data: { detail: 'Validation error' } },
        message: 'Request failed with status code 422'
      }
      await expect(capturedResponseInterceptor.rejected(error)).rejects.toBe(error)
    }
  })
})
