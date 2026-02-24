import userEvent from '@testing-library/user-event'

import { mockAxiosInstance } from '../__mocks__/axios'
import { Login } from '../pages/Login'

import { render, screen, waitFor } from './test-utils'

// Helper to render Login page (already wrapped with AuthProvider and Router via test-utils)
const renderLogin = () => {
  const utils = render(<Login />)
  return {
    user: userEvent.setup(),
    ...utils,
  }
}

describe('Login Page', () => {
  beforeEach(() => {
    // Reset mock instance before each test
    mockAxiosInstance.get.mockReset()
    mockAxiosInstance.post.mockReset()
    mockAxiosInstance.put.mockReset()
    mockAxiosInstance.delete.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: /sign in to embla/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('allows typing email and password', async () => {
    const { user } = renderLogin()
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('submits form and calls login API', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({}) // CSRF
    mockAxiosInstance.post.mockResolvedValueOnce({}) // token
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { id: 1, email: 'test@example.com', name: 'Test User' },
    }) // users/me

    const { user } = renderLogin()

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in.../i })).toBeDisabled()

    await waitFor(() => {
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/csrf/')
    })
    await waitFor(() => {
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/token/', {
        email: 'test@example.com',
        password: 'password123',
      })
    })
    await waitFor(() => {
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me/')
    })
  })

  it('shows error message when login fails', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({}) // CSRF
    mockAxiosInstance.post.mockRejectedValueOnce({
      response: {
        data: { detail: 'Invalid credentials' },
        status: 401,
      },
    })

    const { user } = renderLogin()

    await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
  })

  it('disables submit button while loading', async () => {
    mockAxiosInstance.get.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { user } = renderLogin()

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/signing in.../i)
  })

  it('requires email and password', async () => {
    const { user } = renderLogin()

    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.click(submitButton)

    expect(mockAxiosInstance.get).not.toHaveBeenCalled()
  })
})
