
import { render, screen } from './test-utils'
import Dashboard from '../pages/Dashboard'
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

describe('Dashboard Page', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard with user info', () => {
    mockedUseAuth.mockReturnValue({
      user: mockUser,
    })

    render(<Dashboard />)

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    expect(screen.getByText(mockUser.id.toString())).toBeInTheDocument()
  })

  it('shows "Not set" for missing name', () => {
    mockedUseAuth.mockReturnValue({
      user: { ...mockUser, name: null },
    })

    render(<Dashboard />)

    expect(screen.getByText('Not set')).toBeInTheDocument()
  })

  it('renders recent activity and quick actions sections', () => {
    mockedUseAuth.mockReturnValue({
      user: mockUser,
    })

    render(<Dashboard />)

    // Check section headings
    expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /quick actions/i })).toBeInTheDocument()
    
    // Check button texts (they're actually buttons with text)
    expect(screen.getByText(/edit profile/i)).toBeInTheDocument()
    expect(screen.getByText(/change password/i)).toBeInTheDocument()
  })
})