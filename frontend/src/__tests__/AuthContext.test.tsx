import React from 'react'
import { render, screen, waitFor } from './test-utils'
import { useAuth } from '../contexts/AuthContext'
import { mockUser } from './test-utils'
import { mockAxiosInstance } from '../__mocks__/axios'
import { vi } from 'vitest'

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

      render(<TestComponent />)

      // Should show loading as true initially
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('sets user when authenticated', async () => {
      // Mock successful auth check
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser })

      render(<TestComponent />)

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('true')

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Should be authenticated with user data
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      
      // Verify the API was called with correct endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me/')
    })

    it('sets null user when not authenticated', async () => {
      // Mock failed auth check
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not authenticated'))

      render(<TestComponent />)

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
      // Mock CSRF endpoint
      mockAxiosInstance.get.mockResolvedValueOnce({}) // /csrf/
      // Mock token endpoint
      mockAxiosInstance.post.mockResolvedValueOnce({}) // /token/
      // Mock user fetch
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser }) // /users/me/

      // We need to test login function directly
      // Create a test component that calls login
      const LoginTestComponent = () => {
        const { login, user, loading } = useAuth()
        const handleLogin = async () => {
          try {
            await login('test@example.com', 'password')
          } catch (error) {
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

      render(<LoginTestComponent />)

      // Click login button
      screen.getByText('Login').click()

      // Wait for loading to finish and user to be set
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      })

      // Verify API calls were made in correct order
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(1, '/csrf/')
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/token/', {
        email: 'test@example.com',
        password: 'password',
      })
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(2, '/users/me/')
    })

    it('handles login failure', async () => {
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
          } catch (error) {
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

      render(<LoginTestComponent />)

      screen.getByText('Login').click()

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed')
      })

      // User should still be null
      expect(screen.getByTestId('user')).toHaveTextContent('null')
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

      render(<LogoutTestComponent />)

      // Wait for initial auth to complete
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      })

      // Click logout
      screen.getByText('Logout').click()

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // User should be null after logout
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      
      // Verify logout API was called
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logout/')
    })
  })
})
