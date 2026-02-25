import { vi, beforeEach, afterEach } from 'vitest'

import { checkHealth, logHealthStatus, startHealthMonitoring } from '../utils/health'

describe('health utils', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP_ENV', 'development')
    vi.stubEnv('VITE_APP_VERSION', '1.0.0')
    vi.stubEnv('VITE_API_URL', 'http://test-api.local')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'group').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('checkHealth', () => {
    it('returns healthy status when API responds OK', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
      } as Response)

      const status = await checkHealth()

      expect(status.frontend.status).toBe('healthy')
      expect(status.frontend.version).toBe('1.0.0')
      expect(status.api.status).toBe('healthy')
      expect(status.api.responseTime).toBeDefined()
      expect(status.browser.name).toBeDefined()
      expect(status.browser.version).toBeDefined()
      expect(status.timestamp).toBeDefined()
    })

    it('returns error status when API responds with non-OK', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const status = await checkHealth()

      expect(status.api.status).toBe('error')
      expect(status.frontend.status).toBe('degraded')
    })

    it('returns unreachable when API fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      const status = await checkHealth()

      expect(status.api.status).toBe('unreachable')
      expect(status.frontend.status).toBe('degraded')
    })

    it('reports degraded when localStorage is disabled', async () => {
      // Override localStorage to throw
      const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => {
            throw new Error('disabled')
          },
          removeItem: vi.fn(),
          getItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        },
        configurable: true,
      })

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)

      const status = await checkHealth()
      expect(status.browser.localStorageEnabled).toBe(false)
      expect(status.frontend.status).toBe('degraded')

      // Restore
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    })

    it('reports degraded when sessionStorage is disabled', async () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          setItem: () => {
            throw new Error('disabled')
          },
          removeItem: vi.fn(),
          getItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        },
        configurable: true,
      })

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)

      const status = await checkHealth()
      expect(status.browser.sessionStorageEnabled).toBe(false)
      expect(status.frontend.status).toBe('degraded')

      if (originalDescriptor) {
        Object.defineProperty(window, 'sessionStorage', originalDescriptor)
      }
    })

    it('detects Chrome browser', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.browser.name).toBe('Chrome')
    })

    it('detects Firefox browser', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 Firefox/120.0',
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.browser.name).toBe('Firefox')
    })

    it('detects Safari browser', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 AppleWebKit/605.1.15 Safari/605.1.15',
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.browser.name).toBe('Safari')
    })

    it('detects Edge browser', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 Chrome/120 Safari/537.36 Edg/120.0',
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.browser.name).toBe('Edge')
    })

    it('detects Opera browser with Opera string', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 Opera/120.0',
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.browser.name).toBe('Opera')
    })

    it('detects Opera browser with OPR string', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 OPR/120.0',
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.browser.name).toBe('Opera')
    })

    it('returns Unknown for unrecognized browser', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'CustomBrowser/1.0',
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.browser.name).toBe('Unknown')
    })

    it('reports degraded on high memory usage', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)

      // Mock performance.memory
      const perfWithMemory = performance as Performance & {
        memory?: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number }
      }
      const originalMemory = perfWithMemory.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          jsHeapSizeLimit: 100,
          totalJSHeapSize: 95,
          usedJSHeapSize: 95, // 95% usage > 90% threshold
        },
        configurable: true,
      })

      const status = await checkHealth()
      expect(status.frontend.status).toBe('degraded')

      // Restore
      if (originalMemory) {
        Object.defineProperty(performance, 'memory', {
          value: originalMemory,
          configurable: true,
        })
      } else {
        delete (performance as unknown as Record<string, unknown>)['memory']
      }
    })
  })

  describe('logHealthStatus', () => {
    it('logs health status in development', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)

      logHealthStatus()

      // Allow the promise to resolve
      await vi.advanceTimersByTimeAsync(0)

      expect(console.group).toHaveBeenCalledWith('Application Health Status')
      expect(console.groupEnd).toHaveBeenCalled()
    })

    it('handles checkHealth failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('fail'))

      logHealthStatus()
      await vi.advanceTimersByTimeAsync(0)

      // checkHealth itself catches fetch errors, so logHealthStatus should still succeed
      expect(console.group).toHaveBeenCalledWith('Application Health Status')
    })

    it('does nothing in non-development', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      logHealthStatus()
      expect(console.group).not.toHaveBeenCalled()
    })
  })

  describe('startHealthMonitoring', () => {
    it('starts and stops monitoring in development', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response)

      const stop = startHealthMonitoring(1000)

      expect(console.log).toHaveBeenCalledWith('Starting health monitoring with 1000ms interval')

      await vi.advanceTimersByTimeAsync(1000)

      stop()
      expect(console.log).toHaveBeenCalledWith('Health monitoring stopped')
    })

    it('logs warning when unhealthy', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

      const stop = startHealthMonitoring(1000)
      await vi.advanceTimersByTimeAsync(1000)

      // checkHealth catches fetch errors and returns 'unreachable' status
      expect(console.warn).toHaveBeenCalled()

      stop()
    })

    it('returns noop in non-development', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      const stop = startHealthMonitoring(1000)
      stop() // should not throw
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Starting health monitoring')
      )
    })
  })
})
