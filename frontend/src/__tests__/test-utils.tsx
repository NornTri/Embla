import React, { type ReactElement } from 'react'

import { BrowserRouter } from 'react-router-dom'

import { render, type RenderOptions } from '@testing-library/react'

import { AuthProvider } from '../contexts/AuthContext'

// Mock user data for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
}

// Mock API responses
export const mockApiResponses = {
  success: (data: unknown) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }),
  error: (status = 401, data = { detail: 'Unauthorized' }) => ({
    response: {
      data,
      status,
      statusText: 'Unauthorized',
      headers: {},
      config: {},
    },
  }),
}

// Custom render function that wraps components with necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Helper to wait for loading states
export const waitForLoading = async (timeout = 100) => {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

// Helper to mock axios instance
export const mockAxios = () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  const mockPut = vi.fn()
  const mockDelete = vi.fn()
  const mockCreate = vi.fn(() => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  }))

  return {
    mockGet,
    mockPost,
    mockPut,
    mockDelete,
    mockCreate,
    reset: () => {
      mockGet.mockReset()
      mockPost.mockReset()
      mockPut.mockReset()
      mockDelete.mockReset()
      mockCreate.mockReset()
    },
  }
}
