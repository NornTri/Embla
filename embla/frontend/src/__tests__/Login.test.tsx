
import { render, screen, waitFor } from './test-utils'
import userEvent from '@testing-library/user-event'
import Login from '../pages/Login'
import { mockAxiosInstance } from '../__mocks__/axios'

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

    // Check form elements
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
    // Mock successful login flow
    mockAxiosInstance.get.mockResolvedValueOnce({}) // CSRF
    mockAxiosInstance.post.mockResolvedValueOnce({}) // token
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { id: 1, email: 'test@example.com', name: 'Test User' } }) // users/me

    const { user } = renderLogin()
    
    // Fill form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Check loading state (button should be disabled or show loading)
    expect(screen.getByRole('button', { name: /signing in.../i })).toBeDisabled()

    // Wait for API calls
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

    // After successful login, the user should be redirected (handled by AuthContext)
    // We can't easily test navigation without mocking useNavigate
    // For now, we just verify API calls were made
  })

  it('shows error message when login fails', async () => {
    // Mock CSRF success, token failure
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

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Button should be enabled again
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
  })

  it('disables submit button while loading', async () => {
    // Mock a slow API response
    mockAxiosInstance.get.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { user } = renderLogin()
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password')
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // Button should be disabled and show loading text
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/signing in.../i)
  })

  it('requires email and password', async () => {
    const { user } = renderLogin()
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Try to submit empty form
    await user.click(submitButton)

    // HTML5 validation should prevent submission
    // We can check that API wasn't called
    expect(mockAxiosInstance.get).not.toHaveBeenCalled()
  })
})