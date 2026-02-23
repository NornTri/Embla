// Manual mock for axios
import { vi } from 'vitest'

// Create a mock axios instance
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
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
mockAxios.isAxiosError = vi.fn(() => false)

// Export mock instance for test control
export { mockAxiosInstance }
export default mockAxios
