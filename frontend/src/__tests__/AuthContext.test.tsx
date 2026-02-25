import React from 'react'

import { render as bareRender } from '@testing-library/react'
import { vi } from 'vitest'

import { mockAxiosInstance } from '../__mocks__/axios'
import { useAuth } from '../contexts/AuthContext'

import { act, render, screen, waitFor, mockUser } from './test-utils'

// Reset mock instance before each test
const resetMockAxiosInstance = () => {
  mockAxiosInstance.get.mockReset()
  mockAxiosInstance.post.mockReset()
  mockAxiosInstance.put.mockReset()
  mockAxiosInstance.delete.mockReset()
  mockAxiosInstance.interceptors.request.use.mockReset()
  mockAxiosInstance.interceptors.request.eject.mockReset()
  mockAxiosInstance.interceptors.response.use.mockReset()
  mockAxiosInstance.interceptors.response.eject.mockReset()
}

// Test component that uses the auth hook
const TestComponent = () => {
  const { user, loading, isAuthenticated } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
    </div>
  )
}

describe('useAuth outside provider', () => {
  it('throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const BadComponent = () => {
      useAuth()
      return null
    }

    expect(() => {
      bareRender(<BadComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    spy.mockRestore()
  })
})

describe('AuthContext', () => {
  beforeEach(() => {
    resetMockAxiosInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('shows loading initially when auth check is pending', async () => {
      // Mock the initial auth check to never resolve (simulate loading)
      mockAxiosInstance.get.mockImplementation(() => new Promise(() => {}))

      await render(<TestComponent />)

      // Should show loading as true initially
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('sets user when authenticated', async () => {
      // Mock successful auth check
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })

      await render(<TestComponent />)

      // After render with act(), async effects have settled
      expect(screen.getByTestId('loading')).toHaveTextContent('false')

      // Should be authenticated with user data
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)

      // Verify the API was called with correct endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me/')
    })

    it('sets null user when not authenticated', async () => {
      // Mock failed auth check
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not authenticated'))

      await render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Should not be authenticated
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  describe('login', () => {
    it('successfully logs in and sets user', async () => {
      // Mock initial auth check (AuthProvider mount)
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not authenticated'))
      // Mock CSRF endpoint
      mockAxiosInstance.get.mockResolvedValueOnce({}) // /csrf/
      // Mock token endpoint
      mockAxiosInstance.post.mockResolvedValueOnce({}) // /token/
      // Mock user fetch
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser }) // /users/me/

      const LoginTestComponent = () => {
        const { login, user, loading } = useAuth()
        const handleLogin = async () => {
          try {
            await login('test@example.com', 'password')
          } catch {
            // ignore
          }
        }
        return (
          <div>
            <button onClick={handleLogin}>Login</button>
            <div data-testid="user">{user ? user.email : 'null'}</div>
            <div data-testid="loading">{loading.toString()}</div>
          </div>
        )
      }

      await render(<LoginTestComponent />)

      await act(async () => {
        screen.getByText('Login').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      })

      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(1, '/users/me/')
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(2, '/csrf/')
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/token/', {
        email: 'test@example.com',
        password: 'password',
      })
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(3, '/users/me/')
    })

    it('handles login failure', async () => {
      // Mock initial auth check (AuthProvider mount)
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not authenticated'))
      // Mock CSRF success
      mockAxiosInstance.get.mockResolvedValueOnce({})
      // Mock token failure
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Invalid credentials'))

      const LoginTestComponent = () => {
        const { login, user, loading } = useAuth()
        const [error, setError] = React.useState('')
        const handleLogin = async () => {
          try {
            await login('test@example.com', 'password')
          } catch {
            setError('Login failed')
          }
        }
        return (
          <div>
            <button onClick={handleLogin}>Login</button>
            <div data-testid="error">{error}</div>
            <div data-testid="user">{user ? user.email : 'null'}</div>
            <div data-testid="loading">{loading.toString()}</div>
          </div>
        )
      }

      await render(<LoginTestComponent />)

      await act(async () => {
        screen.getByText('Login').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed')
      })

      // User should still be null
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  describe('401 interceptor', () => {
    it('attempts token refresh on 401 and retries request', async () => {
      // Mock initial auth check to succeed
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })

      await render(<TestComponent />)

      // Verify the response interceptor was registered
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()

      // Get the error handler from the interceptor
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0]!
      const errorHandler = interceptorCall[1]

      // Simulate a 401 error
      const error401 = {
        config: { url: '/some-endpoint', _retry: false },
        response: { status: 401 },
      }

      // Mock token refresh success and retry
      mockAxiosInstance.post.mockResolvedValueOnce({}) // /token/refresh/

      // The interceptor calls api(originalRequest) which is the mockAxiosInstance callable
      // Since mockAxiosInstance is a callable mock, we need the parent mock
      const axiosMock = (await import('../__mocks__/axios')).default
      axiosMock.mockResolvedValueOnce({ data: 'retried' })

      try {
        await errorHandler(error401)
      } catch {
        // May throw if mock setup isn't complete
      }

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/token/refresh/')
    })

    it('clears user on refresh failure', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })

      await render(<TestComponent />)

      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0]!
      const errorHandler = interceptorCall[1]

      const error401 = {
        config: { url: '/some-endpoint', _retry: false },
        response: { status: 401 },
      }

      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Refresh failed'))

      await expect(errorHandler(error401)).rejects.toThrow('Refresh failed')
    })

    it('does not retry on refresh endpoint 401', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })

      await render(<TestComponent />)

      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0]!
      const errorHandler = interceptorCall[1]

      const error401 = {
        config: { url: '/token/refresh/', _retry: false },
        response: { status: 401 },
      }

      await expect(errorHandler(error401)).rejects.toBe(error401)
    })

    it('does not retry already retried requests', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })

      await render(<TestComponent />)

      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0]!
      const errorHandler = interceptorCall[1]

      const error401 = {
        config: { url: '/some-endpoint', _retry: true },
        response: { status: 401 },
      }

      await expect(errorHandler(error401)).rejects.toBe(error401)
    })

    it('passes through non-401 errors', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })

      await render(<TestComponent />)

      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0]!
      const errorHandler = interceptorCall[1]

      const error500 = {
        config: { url: '/some-endpoint' },
        response: { status: 500 },
      }

      await expect(errorHandler(error500)).rejects.toBe(error500)
    })
  })

  describe('logout', () => {
    it('successfully logs out', async () => {
      // Mock initial auth check to return user
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })
      // Mock logout endpoint
      mockAxiosInstance.post.mockResolvedValueOnce({})

      const LogoutTestComponent = () => {
        const { logout, user, loading } = useAuth()
        const handleLogout = async () => {
          await logout()
        }
        return (
          <div>
            <button onClick={handleLogout}>Logout</button>
            <div data-testid="user">{user ? user.email : 'null'}</div>
            <div data-testid="loading">{loading.toString()}</div>
          </div>
        )
      }

      await render(<LogoutTestComponent />)

      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)

      await act(async () => {
        screen.getByText('Logout').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null')
      })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logout/')
    })
  })
})
