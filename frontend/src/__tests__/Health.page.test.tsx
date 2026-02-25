import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'

import { HealthPage } from '../pages/Health'

// Mock the health module
const mockCheckHealth = vi.fn()
vi.mock('../utils/health', () => ({
  checkHealth: (...args: unknown[]) => mockCheckHealth(...args),
}))

describe('HealthPage', () => {
  const healthyStatus = {
    timestamp: '2024-01-01T00:00:00.000Z',
    frontend: {
      status: 'healthy' as const,
      version: '1.0.0',
      environment: 'development',
      userAgent: 'Test Browser',
      screenResolution: '1920x1080',
      memory: {},
    },
    api: {
      status: 'healthy' as const,
      responseTime: 50,
      endpoint: 'http://test-api.local',
    },
    browser: {
      name: 'Chrome',
      version: '120',
      platform: 'MacIntel',
      cookiesEnabled: true,
      localStorageEnabled: true,
      sessionStorageEnabled: true,
    },
  }

  beforeEach(() => {
    vi.stubEnv('VITE_APP_ENV', 'development')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockCheckHealth.mockResolvedValue(healthyStatus)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    mockCheckHealth.mockReset()
  })

  it('shows production message in production mode', async () => {
    vi.stubEnv('VITE_APP_ENV', 'production')
    render(<HealthPage />)
    expect(
      screen.getByText(/health check page is not available in production mode/i)
    ).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    // Make checkHealth never resolve to see loading state
    mockCheckHealth.mockImplementation(() => new Promise(() => {}))
    render(<HealthPage />)
    expect(screen.getByText(/loading health status/i)).toBeInTheDocument()
  })

  it('displays health status after loading', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Application Health Dashboard')).toBeInTheDocument()
    })

    expect(screen.getByText('Frontend Application')).toBeInTheDocument()
    expect(screen.getByText('API Connectivity')).toBeInTheDocument()
    expect(screen.getByText('Browser Information')).toBeInTheDocument()
    expect(screen.getByText('Raw Health Data')).toBeInTheDocument()
  })

  it('shows overall status badge when healthy', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Overall: HEALTHY')).toBeInTheDocument()
    })
  })

  it('shows degraded status badge', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      frontend: { ...healthyStatus.frontend, status: 'degraded' },
    })

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Overall: DEGRADED')).toBeInTheDocument()
    })
  })

  it('shows unhealthy status badge', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      frontend: { ...healthyStatus.frontend, status: 'unhealthy' },
    })

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Overall: UNHEALTHY')).toBeInTheDocument()
    })
  })

  it('shows frontend details', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument()
      expect(screen.getByText('development')).toBeInTheDocument()
      expect(screen.getByText('1920x1080')).toBeInTheDocument()
    })
  })

  it('shows API details with response time', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('http://test-api.local')).toBeInTheDocument()
      expect(screen.getByText('50ms')).toBeInTheDocument()
      expect(screen.getByText('Fast')).toBeInTheDocument()
    })
  })

  it('shows moderate response time label', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      api: { ...healthyStatus.api, responseTime: 250 },
    })

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Moderate')).toBeInTheDocument()
    })
  })

  it('shows slow response time label', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      api: { ...healthyStatus.api, responseTime: 600 },
    })

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Slow')).toBeInTheDocument()
    })
  })

  it('shows browser info', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Chrome 120')).toBeInTheDocument()
      expect(screen.getByText('MacIntel')).toBeInTheDocument()
    })
  })

  it('shows storage support indicators', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Cookies')).toBeInTheDocument()
      expect(screen.getByText('Local Storage')).toBeInTheDocument()
      expect(screen.getByText('Session Storage')).toBeInTheDocument()
    })
  })

  it('shows memory usage when available', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      frontend: {
        ...healthyStatus.frontend,
        memory: {
          jsHeapSizeLimit: 4294967296,
          totalJSHeapSize: 1073741824,
          usedJSHeapSize: 536870912,
        },
      },
    })

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Memory Usage')).toBeInTheDocument()
    })
  })

  it('refreshes health status when button is clicked', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('Refresh Status')).toBeInTheDocument()
    })

    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      frontend: { ...healthyStatus.frontend, status: 'degraded' },
    })

    fireEvent.click(screen.getByText('Refresh Status'))

    await waitFor(() => {
      expect(mockCheckHealth).toHaveBeenCalledTimes(2)
    })
  })

  it('shows error state when checkHealth fails', async () => {
    mockCheckHealth.mockRejectedValueOnce(new Error('Health check failed'))

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText(/error loading health status/i)).toBeInTheDocument()
      expect(screen.getByText(/health check failed/i)).toBeInTheDocument()
    })
  })

  it('shows error for non-Error throws', async () => {
    mockCheckHealth.mockRejectedValueOnce('string error')

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText(/unknown error/i)).toBeInTheDocument()
    })
  })

  it('shows button as disabled and with text Refreshing while loading', () => {
    mockCheckHealth.mockImplementation(() => new Promise(() => {}))
    render(<HealthPage />)

    const button = screen.getByRole('button', { name: /refreshing/i })
    expect(button).toBeDisabled()
  })

  it('shows API error status badge', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      api: { ...healthyStatus.api, status: 'error' },
    })

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('ERROR')).toBeInTheDocument()
    })
  })

  it('shows API unreachable status badge', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      api: { ...healthyStatus.api, status: 'unreachable' },
    })

    render(<HealthPage />)

    await waitFor(() => {
      expect(screen.getByText('UNREACHABLE')).toBeInTheDocument()
    })
  })

  it('shows raw health data', async () => {
    render(<HealthPage />)

    await waitFor(() => {
      const rawData = screen.getByText('Raw Health Data')
      expect(rawData).toBeInTheDocument()
    })

    // The raw data section contains the JSON
    const pre = document.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre!.textContent).toContain('healthy')
  })

  it('shows disabled storage indicators when disabled', async () => {
    mockCheckHealth.mockResolvedValue({
      ...healthyStatus,
      browser: {
        ...healthyStatus.browser,
        cookiesEnabled: false,
        localStorageEnabled: false,
        sessionStorageEnabled: false,
      },
    })

    render(<HealthPage />)

    await waitFor(() => {
      const markers = screen.getAllByText('\u2717')
      expect(markers).toHaveLength(3)
    })
  })
})
