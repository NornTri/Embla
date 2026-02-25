import userEvent from '@testing-library/user-event'
import { vi, type Mock } from 'vitest'

import { Home } from '../pages/Home'

import { render, screen } from './test-utils'

// Mock useAuth only, keep other exports
vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>()
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

// Need to import after mock
import { useAuth } from '../contexts/AuthContext' // eslint-disable-line import-x/order

const mockedUseAuth = useAuth as Mock

describe('Home Page', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user email and logout button when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
    })

    render(<Home />)

    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    expect(screen.getByText(/welcome to embla/i)).toBeInTheDocument()
  })

  it('calls logout when logout button is clicked', async () => {
    const mockLogout = vi.fn()
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    })

    const user = userEvent.setup()
    render(<Home />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('shows user name if available', () => {
    mockedUseAuth.mockReturnValue({
      user: { ...mockUser, name: 'John Doe' },
      logout: vi.fn(),
    })

    render(<Home />)

    expect(screen.getByText(/you are logged in as John Doe/i)).toBeInTheDocument()
  })

  it('shows email if name is not available', () => {
    mockedUseAuth.mockReturnValue({
      user: { ...mockUser, name: null },
      logout: vi.fn(),
    })

    render(<Home />)

    expect(
      screen.getByText(new RegExp(`you are logged in as ${mockUser.email}`, 'i'))
    ).toBeInTheDocument()
  })
})
