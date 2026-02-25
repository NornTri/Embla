import { renderHook } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'

import {
  isReactDevToolsInstalled,
  logDevToolsStatus,
  enableStrictModeWarnings,
  PerformanceMonitor,
  useRenderTime,
  devConsole,
  initDevTools,
} from '../utils/devtools'

describe('devtools', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP_ENV', 'development')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'group').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    delete window.__EMBLA_DEVTOOLS__
  })

  describe('isReactDevToolsInstalled', () => {
    it('returns true when devtools hook is present', () => {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
      expect(isReactDevToolsInstalled()).toBe(true)
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    })

    it('returns false when devtools hook is not present', () => {
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
      expect(isReactDevToolsInstalled()).toBe(false)
    })

    it('returns false in non-development environment', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
      expect(isReactDevToolsInstalled()).toBe(false)
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    })

    it('returns false when accessing hook throws', () => {
      Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
        get: () => {
          throw new Error('access denied')
        },
        configurable: true,
      })
      expect(isReactDevToolsInstalled()).toBe(false)
      // Clean up
      Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
        value: undefined,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('logDevToolsStatus', () => {
    it('logs devtools status in development', () => {
      logDevToolsStatus()
      expect(console.group).toHaveBeenCalledWith('React Development Tools')
      expect(console.groupEnd).toHaveBeenCalled()
    })

    it('shows tip when devtools not installed', () => {
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
      logDevToolsStatus()
      expect(console.log).toHaveBeenCalledWith('Tip: Install React DevTools for better debugging')
    })

    it('does nothing in non-development environment', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      logDevToolsStatus()
      expect(console.group).not.toHaveBeenCalled()
    })
  })

  describe('enableStrictModeWarnings', () => {
    it('logs in development mode', () => {
      enableStrictModeWarnings()
      expect(console.log).toHaveBeenCalledWith('React Strict Mode is enabled')
    })

    it('does nothing in non-development', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      enableStrictModeWarnings()
      expect(console.log).not.toHaveBeenCalledWith('React Strict Mode is enabled')
    })
  })

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor

    beforeEach(() => {
      monitor = new PerformanceMonitor()
    })

    it('marks and measures performance', () => {
      monitor.mark('start')
      monitor.mark('end')
      monitor.measure('test', 'start', 'end')
      const report = monitor.getReport()
      expect(report).toHaveProperty('test')
      expect(typeof report['test']).toBe('number')
    })

    it('does nothing in non-development', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      const prodMonitor = new PerformanceMonitor()
      prodMonitor.mark('start')
      prodMonitor.mark('end')
      prodMonitor.measure('test', 'start', 'end')
      expect(prodMonitor.getReport()).toEqual({})
    })

    it('handles missing marks gracefully', () => {
      // Mock performance.measure to avoid the real browser throwing
      vi.spyOn(performance, 'measure').mockImplementation(
        () => ({ detail: null }) as PerformanceMeasure
      )
      monitor.measure('test', 'nonexistent-start', 'nonexistent-end')
      expect(monitor.getReport()).toEqual({})
    })

    it('clears marks and measurements', () => {
      monitor.mark('start')
      monitor.mark('end')
      monitor.measure('test', 'start', 'end')
      expect(Object.keys(monitor.getReport()).length).toBe(1)
      monitor.clear()
      expect(monitor.getReport()).toEqual({})
    })
  })

  describe('useRenderTime', () => {
    it('does not warn for fast renders', () => {
      renderHook(() => useRenderTime('TestComponent'))
      expect(console.warn).not.toHaveBeenCalled()
    })

    it('warns for slow renders (> 16ms)', () => {
      // Mock performance.now to simulate slow render
      // Returns increasing values so the diff is > 16ms
      let time = 0
      vi.spyOn(performance, 'now').mockImplementation(() => {
        time += 20
        return time
      })

      const { unmount } = renderHook(() => useRenderTime('SlowComponent'))
      unmount()

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow render in SlowComponent')
      )
    })

    it('does nothing in non-development', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      renderHook(() => useRenderTime('TestComponent'))
      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('devConsole', () => {
    it('logs props in development', () => {
      devConsole.props('TestComp', { foo: 'bar' })
      expect(console.log).toHaveBeenCalledWith('TestComp props:', { foo: 'bar' })
    })

    it('logs state updates in development', () => {
      devConsole.state('TestComp', { count: 0 }, { count: 1 })
      expect(console.log).toHaveBeenCalledWith('TestComp state update:', {
        prevState: { count: 0 },
        nextState: { count: 1 },
      })
    })

    it('logs api calls in development', () => {
      devConsole.apiCall('GET', '/api/test', { query: 'value' })
      expect(console.log).toHaveBeenCalledWith('API GET /api/test:', { query: 'value' })
    })

    it('logs auth events in development', () => {
      devConsole.auth('login', { userId: 1 })
      expect(console.log).toHaveBeenCalledWith('Auth login:', { userId: 1 })
    })

    it('does nothing in non-development for props', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      devConsole.props('TestComp', { foo: 'bar' })
      expect(console.log).not.toHaveBeenCalledWith('TestComp props:', expect.anything())
    })

    it('does nothing in non-development for state', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      devConsole.state('TestComp', {}, {})
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('state update'),
        expect.anything()
      )
    })

    it('does nothing in non-development for apiCall', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      devConsole.apiCall('GET', '/test')
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('API'),
        expect.anything()
      )
    })

    it('does nothing in non-development for auth', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      devConsole.auth('login')
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Auth'),
        expect.anything()
      )
    })
  })

  describe('initDevTools', () => {
    it('initializes devtools in development', () => {
      const cleanup = initDevTools()
      expect(window.__EMBLA_DEVTOOLS__).toBeDefined()
      expect(console.log).toHaveBeenCalledWith('Development Tools Initialized')
      expect(console.log).toHaveBeenCalledWith(
        'Global dev tools available at window.__EMBLA_DEVTOOLS__'
      )
      cleanup()
      expect(window.__EMBLA_DEVTOOLS__).toBeUndefined()
    })

    it('returns noop cleanup in non-development', () => {
      vi.stubEnv('VITE_APP_ENV', 'production')
      const cleanup = initDevTools()
      expect(window.__EMBLA_DEVTOOLS__).toBeUndefined()
      cleanup() // should not throw
    })
  })
})
