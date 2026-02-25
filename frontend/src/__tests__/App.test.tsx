import { render, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'

import { mockAxiosInstance } from '../__mocks__/axios'
import App from '../App'
import { initDevTools } from '../utils/devtools'
import { logHealthStatus, startHealthMonitoring } from '../utils/health'

// Mock devtools and health modules
vi.mock('../utils/devtools', () => ({
  initDevTools: vi.fn(() => vi.fn()),
}))

vi.mock('../utils/health', () => ({
  logHealthStatus: vi.fn(),
  startHealthMonitoring: vi.fn(() => vi.fn()),
  checkHealth: vi.fn().mockResolvedValue({
    timestamp: '2024-01-01T00:00:00.000Z',
    frontend: {
      status: 'healthy',
      version: '1.0.0',
      environment: 'test',
      userAgent: '',
      screenResolution: '',
      memory: {},
    },
    api: { status: 'healthy', endpoint: 'http://test-api.local' },
    browser: {
      name: 'Test',
      version: '1',
      platform: 'test',
      cookiesEnabled: true,
      localStorageEnabled: true,
      sessionStorageEnabled: true,
    },
  }),
}))

describe('App', () => {
  beforeEach(() => {
    mockAxiosInstance.get.mockReset()
    mockAxiosInstance.post.mockReset()
    // Default: not authenticated
    mockAxiosInstance.get.mockRejectedValue(new Error('Not authenticated'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders login page at /login route', async () => {
    window.history.pushState({}, '', '/login')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to embla/i })).toBeInTheDocument()
    })
  })

  it('redirects unauthenticated users to login from protected routes', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to embla/i })).toBeInTheDocument()
    })
  })

  it('renders home page for authenticated users', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: { id: 1, email: 'test@example.com', name: 'Test User' },
    })

    window.history.pushState({}, '', '/')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/welcome to embla/i)).toBeInTheDocument()
    })
  })

  it('renders dashboard for authenticated users', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: { id: 1, email: 'test@example.com', name: 'Test User' },
    })

    window.history.pushState({}, '', '/dashboard')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    })
  })

  it('redirects unknown routes to home', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Not authenticated'))

    window.history.pushState({}, '', '/nonexistent')
    render(<App />)

    // Should redirect to / which redirects to /login since not authenticated
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to embla/i })).toBeInTheDocument()
    })
  })

  it('initializes devtools in development environment', async () => {
    vi.stubEnv('VITE_APP_ENV', 'development')
    mockAxiosInstance.get.mockRejectedValue(new Error('Not authenticated'))

    window.history.pushState({}, '', '/login')
    const { unmount } = render(<App />)

    await waitFor(() => {
      expect(initDevTools).toHaveBeenCalled()
      expect(logHealthStatus).toHaveBeenCalled()
      expect(startHealthMonitoring).toHaveBeenCalledWith(30000)
    })

    // Unmount should trigger cleanup
    unmount()
    vi.unstubAllEnvs()
  })
})
