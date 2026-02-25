import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'

import { ErrorBoundary, withErrorBoundary, useErrorReporter } from '../components/ErrorBoundary'

// Mock the health module - use a controllable mock
const mockCheckHealth = vi.fn().mockResolvedValue({
  timestamp: '2024-01-01T00:00:00.000Z',
  frontend: {
    status: 'healthy',
    version: '1.0.0',
    environment: 'test',
    userAgent: '',
    screenResolution: '1920x1080',
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
})
vi.mock('../utils/health', () => ({
  checkHealth: (...args: unknown[]) => mockCheckHealth(...args),
}))

const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Working component</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders default error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
    expect(screen.getByText('Go to Home')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('calls onError callback when error occurs', async () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    // componentDidCatch is async, wait for it
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      )
    })
  })

  it('resets error state when Try Again is clicked', async () => {
    // We need a component that can toggle between throwing and not
    let shouldThrow = true
    const ToggleComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>Recovered</div>
    }

    render(
      <ErrorBoundary>
        <ToggleComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Stop throwing before clicking Try Again
    shouldThrow = false
    fireEvent.click(screen.getByText('Try Again'))

    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })

  it('calls window.location.reload when Reload Page is clicked', () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('Reload Page'))
    expect(reloadMock).toHaveBeenCalled()
  })

  it('shows Go to Home link with correct href', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    const homeLink = screen.getByText('Go to Home')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('logs production warning in production env', async () => {
    vi.stubEnv('VITE_APP_ENV', 'production')

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith('Error caught by ErrorBoundary:', expect.any(Error))
    })

    vi.unstubAllEnvs()
  })

  it('handles health check failure in componentDidCatch', async () => {
    mockCheckHealth.mockRejectedValueOnce(new Error('Health check failed'))

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to collect health status:',
        expect.any(Error)
      )
    })
  })

  it('shows error details in development mode', async () => {
    vi.stubEnv('VITE_APP_ENV', 'development')

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    // Wait for componentDidCatch (async) to set errorInfo and healthStatus
    await waitFor(() => {
      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()
    })

    expect(screen.getByText('Error Message')).toBeInTheDocument()
    expect(screen.getByText('Component Stack')).toBeInTheDocument()

    vi.unstubAllEnvs()
  })

  it('shows health status in error details when available', async () => {
    vi.stubEnv('VITE_APP_ENV', 'development')
    mockCheckHealth.mockResolvedValueOnce({
      timestamp: '2024-01-01T00:00:00.000Z',
      frontend: { status: 'healthy' },
    })

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText('Health Status')).toBeInTheDocument()
    })

    vi.unstubAllEnvs()
  })

  it('shows support links', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Contact support')).toHaveAttribute(
      'href',
      'mailto:support@example.com'
    )
    expect(screen.getByText('view troubleshooting guide')).toHaveAttribute(
      'href',
      '/docs/troubleshooting'
    )
  })
})

describe('withErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('wraps component with error boundary', () => {
    const MyComponent = () => <div>Wrapped</div>
    MyComponent.displayName = 'MyComponent'
    const Wrapped = withErrorBoundary(MyComponent)

    render(<Wrapped />)
    expect(screen.getByText('Wrapped')).toBeInTheDocument()
  })

  it('catches errors from wrapped component', () => {
    const Wrapped = withErrorBoundary(ThrowingComponent)

    render(<Wrapped />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('sets displayName correctly with displayName', () => {
    const MyComponent = () => <div>Test</div>
    MyComponent.displayName = 'CustomName'
    const Wrapped = withErrorBoundary(MyComponent)
    expect(Wrapped.displayName).toBe('withErrorBoundary(CustomName)')
  })

  it('sets displayName correctly with function name', () => {
    function NamedComponent() {
      return <div>Test</div>
    }
    const Wrapped = withErrorBoundary(NamedComponent)
    expect(Wrapped.displayName).toBe('withErrorBoundary(NamedComponent)')
  })

  it('passes errorBoundary props through', async () => {
    const onError = vi.fn()
    const Wrapped = withErrorBoundary(ThrowingComponent, { onError })

    render(<Wrapped />)
    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})

describe('useErrorReporter', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports errors with context', () => {
    const { result } = renderHook(() => useErrorReporter())
    const error = new Error('test error')
    const context = { component: 'Test' }

    result.current.reportError(error, context)

    expect(console.error).toHaveBeenCalledWith('Reported error:', error, context)
  })

  it('reports errors without context', () => {
    const { result } = renderHook(() => useErrorReporter())
    const error = new Error('test error')

    result.current.reportError(error)

    expect(console.error).toHaveBeenCalledWith('Reported error:', error, undefined)
  })

  it('logs production warning in production env', () => {
    vi.stubEnv('VITE_APP_ENV', 'production')
    const { result } = renderHook(() => useErrorReporter())
    const error = new Error('prod error')

    result.current.reportError(error, { page: 'home' })

    expect(console.warn).toHaveBeenCalledWith('Reported error:', error, { page: 'home' })
    vi.unstubAllEnvs()
  })
})
