
import { render, screen } from './test-utils'
import PrivateRoute from '../components/PrivateRoute'
import { vi, type Mock } from 'vitest'

// Mock useAuth only, keep other exports
vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>()
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

// Need to import after mock
import { useAuth } from '../contexts/AuthContext'

const mockedUseAuth = useAuth as Mock

describe('PrivateRoute', () => {
  const TestChild = () => <div data-testid="test-child">Protected Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading indicator when loading', () => {
    // Mock loading state
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
    })

    render(<PrivateRoute><TestChild /></PrivateRoute>)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    // Mock not authenticated, loading false
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    })

    render(<PrivateRoute><TestChild /></PrivateRoute>)

    // Should redirect to /login - Navigate component renders nothing
    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    // Mock authenticated
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    })

    render(<PrivateRoute><TestChild /></PrivateRoute>)

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
})