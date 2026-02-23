/**
 * Health check utilities for monitoring frontend application status
 */

export interface HealthStatus {
  timestamp: string
  frontend: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    version: string
    environment: string
    userAgent: string
    screenResolution: string
    memory: {
      jsHeapSizeLimit?: number
      totalJSHeapSize?: number
      usedJSHeapSize?: number
    }
  }
  api: {
    status: 'healthy' | 'unreachable' | 'error'
    responseTime?: number
    endpoint: string
  }
  browser: {
    name: string
    version: string
    platform: string
    cookiesEnabled: boolean
    localStorageEnabled: boolean
    sessionStorageEnabled: boolean
  }
}

/**
 * Check frontend application health
 */
export async function checkHealth(): Promise<HealthStatus> {
  const startTime = Date.now()
  const status: HealthStatus = {
    timestamp: new Date().toISOString(),
    frontend: {
      status: 'healthy',
      version: import.meta.env['VITE_APP_VERSION'] || '0.0.0',
      environment: import.meta.env['VITE_APP_ENV'] || 'development',
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      memory: getMemoryInfo(),
    },
    api: {
      status: 'healthy',
      endpoint: import.meta.env['VITE_API_URL'] || 'http://localhost:8000',
    },
    browser: {
      name: getBrowserName(),
      version: getBrowserVersion(),
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      localStorageEnabled: testLocalStorage(),
      sessionStorageEnabled: testSessionStorage(),
    },
  }

  // Test API connectivity
  try {
    const apiStartTime = Date.now()
    const response = await fetch(`${status.api.endpoint}/health/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Short timeout for health check
      signal: AbortSignal.timeout(5000),
    })
    
    status.api.responseTime = Date.now() - apiStartTime
    
    if (response.ok) {
      status.api.status = 'healthy'
    } else {
      status.api.status = 'error'
      status.frontend.status = 'degraded'
    }
  } catch (error) {
    status.api.status = 'unreachable'
    status.frontend.status = 'degraded'
    console.warn('API health check failed:', error)
  }

  // Check critical frontend functionality
  if (!status.browser.localStorageEnabled || !status.browser.sessionStorageEnabled) {
    status.frontend.status = 'degraded'
  }

  // Check memory pressure
  if (status.frontend.memory.usedJSHeapSize && status.frontend.memory.jsHeapSizeLimit) {
    const memoryUsagePercent = (status.frontend.memory.usedJSHeapSize / status.frontend.memory.jsHeapSizeLimit) * 100
    if (memoryUsagePercent > 90) {
      status.frontend.status = 'degraded'
    }
  }

  // Calculate total response time
  const totalTime = Date.now() - startTime
  console.debug(`Health check completed in ${totalTime}ms`, status)

  return status
}

/**
 * Get browser memory information if available
 */
function getMemoryInfo(): HealthStatus['frontend']['memory'] {
  if ('memory' in (performance as any)) {
    const memory = (performance as any).memory
    return {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
    }
  }
  return {}
}

/**
 * Detect browser name from user agent
 */
function getBrowserName(): string {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera'
  return 'Unknown'
}

/**
 * Detect browser version from user agent
 */
function getBrowserVersion(): string {
  const userAgent = navigator.userAgent
  const match = userAgent.match(/(chrome|firefox|safari|edge|opera|opr)\/?\s*(\d+)/i)
  return match && match[2] ? match[2] : 'Unknown'
}

/**
 * Test localStorage availability
 */
function testLocalStorage(): boolean {
  try {
    const testKey = '__health_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Test sessionStorage availability
 */
function testSessionStorage(): boolean {
  try {
    const testKey = '__health_test__'
    sessionStorage.setItem(testKey, 'test')
    sessionStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Log health status to console (development only)
 */
export function logHealthStatus(): void {
  if (import.meta.env['VITE_APP_ENV'] === 'development') {
    checkHealth().then(status => {
      console.group('Application Health Status')
      console.log('Timestamp:', status.timestamp)
      console.log('Frontend:', status.frontend)
      console.log('API:', status.api)
      console.log('Browser:', status.browser)
      console.groupEnd()
    }).catch(error => {
      console.error('Health check failed:', error)
    })
  }
}

/**
 * Register periodic health checks (development only)
 */
export function startHealthMonitoring(intervalMs: number = 30000): () => void {
  if (import.meta.env['VITE_APP_ENV'] !== 'development') {
    return () => {} // No-op in production
  }

  console.log(`Starting health monitoring with ${intervalMs}ms interval`)
  
  const intervalId = setInterval(() => {
    checkHealth().then(status => {
      if (status.frontend.status === 'unhealthy' || status.api.status === 'unreachable') {
        console.warn('Health check warning:', status)
      }
    }).catch(error => {
      console.error('Health monitoring error:', error)
    })
  }, intervalMs)

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
    console.log('Health monitoring stopped')
  }
}