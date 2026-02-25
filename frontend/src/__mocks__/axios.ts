// Manual mock for axios
import { vi } from 'vitest'

// Create a mock axios instance
const mockAxiosInstance = {
  get: vi.fn().mockRejectedValue(new Error('Not mocked')),
  post: vi.fn().mockRejectedValue(new Error('Not mocked')),
  put: vi.fn().mockRejectedValue(new Error('Not mocked')),
  delete: vi.fn().mockRejectedValue(new Error('Not mocked')),
  defaults: {
    withCredentials: false,
    xsrfCookieName: '',
    xsrfHeaderName: '',
  },
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
}

// Mock default export (axios) - should be callable and have create method
const mockAxios = vi.fn(() => mockAxiosInstance) as any
mockAxios.create = vi.fn(() => mockAxiosInstance)
mockAxios.defaults = {
  withCredentials: false,
  xsrfCookieName: '',
  xsrfHeaderName: '',
}
mockAxios.interceptors = {
  request: { use: vi.fn(), eject: vi.fn() },
  response: { use: vi.fn(), eject: vi.fn() },
}
mockAxios.isAxiosError = vi.fn((error: unknown) => {
  return typeof error === 'object' && error !== null && 'response' in error
})

// Named export for isAxiosError (used as `import { isAxiosError } from 'axios'`)
export const isAxiosError = mockAxios.isAxiosError

// Export mock instance for test control
export { mockAxiosInstance }
export default mockAxios
