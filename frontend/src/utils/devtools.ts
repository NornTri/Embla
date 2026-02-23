import React, { useEffect } from 'react'

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown
    __EMBLA_DEVTOOLS__?: unknown
  }
}

export function isReactDevToolsInstalled(): boolean {
  if (import.meta.env.VITE_APP_ENV !== 'development') {
    return false
  }

  try {
    return !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  } catch {
    return false
  }
}

export function logDevToolsStatus(): void {
  if (import.meta.env.VITE_APP_ENV !== 'development') {
    return
  }

  const devToolsInstalled = isReactDevToolsInstalled()

  // eslint-disable-next-line no-console
  console.group('React Development Tools')
  // eslint-disable-next-line no-console
  console.log(`React DevTools Extension: ${devToolsInstalled ? 'Installed' : 'Not detected'}`)
  // eslint-disable-next-line no-console
  console.log(`React Version: ${React.version}`)
  // eslint-disable-next-line no-console
  console.log(`Environment: ${import.meta.env.VITE_APP_ENV ?? 'unknown'}`)

  if (!devToolsInstalled) {
    // eslint-disable-next-line no-console
    console.log('Tip: Install React DevTools for better debugging')
  }

  // eslint-disable-next-line no-console
  console.groupEnd()
}

export function enableStrictModeWarnings(): void {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('React Strict Mode is enabled')
    // eslint-disable-next-line no-console
    console.log('Strict mode checks will run twice in development to help detect side effects.')
  }
}

export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measurements: Map<string, number> = new Map()

  mark(name: string): void {
    if (import.meta.env.VITE_APP_ENV !== 'development') {
      return
    }

    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`perf-${name}`)
    }
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string, endMark: string): void {
    if (import.meta.env.VITE_APP_ENV !== 'development') {
      return
    }

    if (typeof performance !== 'undefined' && performance.measure) {
      performance.measure(`perf-${name}`, `perf-${startMark}`, `perf-${endMark}`)
    }

    const start = this.marks.get(startMark)
    const end = this.marks.get(endMark)

    if (start && end) {
      const duration = end - start
      this.measurements.set(name, duration)
      // eslint-disable-next-line no-console
      console.debug(`Performance [${name}]: ${duration.toFixed(2)}ms`)
    }
  }

  getReport(): Record<string, number> {
    return Object.fromEntries(this.measurements.entries())
  }

  clear(): void {
    this.marks.clear()
    this.measurements.clear()

    if (typeof performance !== 'undefined' && performance.clearMarks && performance.clearMeasures) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }
}

export function useRenderTime(componentName: string): void {
  useEffect(() => {
    if (import.meta.env.VITE_APP_ENV !== 'development') {
      return
    }

    const startTime = performance.now()

    return () => {
      const renderTime = performance.now() - startTime
      if (renderTime > 16) {
        console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })
}

export const devConsole = {
  props(componentName: string, props: Record<string, unknown>): void {
    if (import.meta.env.VITE_APP_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`${componentName} props:`, props)
    }
  },

  state(componentName: string, prevState: unknown, nextState: unknown): void {
    if (import.meta.env.VITE_APP_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`${componentName} state update:`, { prevState, nextState })
    }
  },

  apiCall(method: string, url: string, data?: unknown): void {
    if (import.meta.env.VITE_APP_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`API ${method} ${url}:`, data)
    }
  },

  auth(event: string, data?: unknown): void {
    if (import.meta.env.VITE_APP_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Auth ${event}:`, data)
    }
  },
}

export function initDevTools(): () => void {
  if (import.meta.env.VITE_APP_ENV !== 'development') {
    return () => {}
  }

  // eslint-disable-next-line no-console
  console.log('Development Tools Initialized')

  logDevToolsStatus()
  enableStrictModeWarnings()

  window.__EMBLA_DEVTOOLS__ = {
    version: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
    environment: import.meta.env.VITE_APP_ENV,
    reactVersion: React.version,
    perf: new PerformanceMonitor(),
    utils: {
      logHealthStatus: () => import('./health').then(m => { m.logHealthStatus() }),
      checkHealth: () => import('./health').then(m => m.checkHealth()),
    },
  }

  // eslint-disable-next-line no-console
  console.log('Global dev tools available at window.__EMBLA_DEVTOOLS__')

  return () => {
    delete window.__EMBLA_DEVTOOLS__
  }
}
