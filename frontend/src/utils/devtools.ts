/**
 * Development tools and utilities for debugging React applications
 */

/**
 * Check if React DevTools extension is installed
 * Note: This only works in development mode and when DevTools extension is active
 */
export function isReactDevToolsInstalled(): boolean {
  if (import.meta.env['VITE_APP_ENV'] !== 'development') {
    return false
  }

  try {
    // Check for React DevTools global hook
    // @ts-ignore - __REACT_DEVTOOLS_GLOBAL_HOOK__ is not in standard types
    return !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  } catch {
    return false
  }
}

/**
 * Log React DevTools status to console (development only)
 */
export function logDevToolsStatus(): void {
  if (import.meta.env['VITE_APP_ENV'] !== 'development') {
    return
  }

  const devToolsInstalled = isReactDevToolsInstalled()
  
  console.group('React Development Tools')
  console.log(`React DevTools Extension: ${devToolsInstalled ? '✅ Installed' : '❌ Not detected'}`)
  console.log(`React Version: ${React.version}`)
  console.log(`Environment: ${import.meta.env['VITE_APP_ENV']}`)
  
  if (!devToolsInstalled) {
    console.log('%c💡 Tip: Install React DevTools for better debugging:', 'color: #4CAF50; font-weight: bold')
    console.log('Chrome: https://chrome.google.com/webstore/detail/react-developer-tools')
    console.log('Firefox: https://addons.mozilla.org/firefox/addon/react-devtools')
    console.log('Standalone: https://github.com/facebook/react/tree/main/packages/react-devtools')
  }
  
  console.groupEnd()
}

/**
 * Enable React strict mode warnings in development
 * This is a no-op in production
 */
export function enableStrictModeWarnings(): void {
  if (import.meta.env['VITE_APP_ENV'] === 'development') {
    console.log('%c⚠️ React Strict Mode is enabled', 'color: #FF9800; font-weight: bold')
    console.log('Strict mode checks will run twice in development to help detect side effects.')
  }
}

/**
 * Performance monitoring utilities for development
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measurements: Map<string, number> = new Map()

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    if (import.meta.env['VITE_APP_ENV'] !== 'development') {
      return
    }
    
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`perf-${name}`)
    }
    this.marks.set(name, performance.now())
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): void {
    if (import.meta.env['VITE_APP_ENV'] !== 'development') {
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
      console.debug(`⏱️ Performance [${name}]: ${duration.toFixed(2)}ms`)
    }
  }

  /**
   * Get all measurements as a report
   */
  getReport(): Record<string, number> {
    return Object.fromEntries(this.measurements.entries())
  }

  /**
   * Clear all marks and measurements
   */
  clear(): void {
    this.marks.clear()
    this.measurements.clear()
    
    if (typeof performance !== 'undefined' && performance.clearMarks && performance.clearMeasures) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }
}

/**
 * Hook to monitor component render performance
 */
export function useRenderTime(componentName: string): void {
  useEffect(() => {
    if (import.meta.env['VITE_APP_ENV'] !== 'development') {
      return
    }

    const startTime = performance.now()
    
    return () => {
      const renderTime = performance.now() - startTime
      if (renderTime > 16) { // 16ms = 60fps threshold
        console.warn(`⚠️ Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })
}

/**
 * Development-only console utilities
 */
export const devConsole = {
  /**
   * Log component props (development only)
   */
  props(componentName: string, props: Record<string, any>): void {
    if (import.meta.env['VITE_APP_ENV'] === 'development') {
      console.log(`🔍 ${componentName} props:`, props)
    }
  },

  /**
   * Log state changes (development only)
   */
  state(componentName: string, prevState: any, nextState: any): void {
    if (import.meta.env['VITE_APP_ENV'] === 'development') {
      console.log(`🔄 ${componentName} state update:`, { prevState, nextState })
    }
  },

  /**
   * Log API calls (development only)
   */
  apiCall(method: string, url: string, data?: any): void {
    if (import.meta.env['VITE_APP_ENV'] === 'development') {
      console.log(`🌐 API ${method} ${url}:`, data)
    }
  },

  /**
   * Log authentication events (development only)
   */
  auth(event: string, data?: any): void {
    if (import.meta.env['VITE_APP_ENV'] === 'development') {
      console.log(`🔐 Auth ${event}:`, data)
    }
  },
}

/**
 * Initialize development tools
 * Call this in your main app file in development mode
 */
export function initDevTools(): () => void {
  if (import.meta.env['VITE_APP_ENV'] !== 'development') {
    return () => {} // No-op in production
  }

  console.log('%c🚀 Development Tools Initialized', 'color: #2196F3; font-weight: bold; font-size: 14px')
  
  // Log React DevTools status
  logDevToolsStatus()
  
  // Enable additional warnings
  enableStrictModeWarnings()
  
  // Add global helper for developers
  // @ts-ignore
  window.__EMBLA_DEVTOOLS__ = {
    version: import.meta.env['VITE_APP_VERSION'] || '0.0.0',
    environment: import.meta.env['VITE_APP_ENV'],
    reactVersion: React.version,
    perf: new PerformanceMonitor(),
    utils: {
      logHealthStatus: () => import('./health').then(m => m.logHealthStatus()),
      checkHealth: () => import('./health').then(m => m.checkHealth()),
    },
  }

  console.log('%c🔧 Global dev tools available at window.__EMBLA_DEVTOOLS__', 'color: #9C27B0')

  // Cleanup function
  return () => {
    // @ts-ignore
    delete window.__EMBLA_DEVTOOLS__
  }
}

// Import React for version detection
import React, { useEffect } from 'react'
