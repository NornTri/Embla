interface PerformanceWithMemory extends Performance {
  memory?: {
    jsHeapSizeLimit: number
    totalJSHeapSize: number
    usedJSHeapSize: number
  }
}

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

export async function checkHealth(): Promise<HealthStatus> {
  const status: HealthStatus = {
    timestamp: new Date().toISOString(),
    frontend: {
      status: 'healthy',
      version: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
      environment: import.meta.env.VITE_APP_ENV ?? 'development',
      userAgent: navigator.userAgent,
      screenResolution: `${String(window.screen.width)}x${String(window.screen.height)}`,
      memory: getMemoryInfo(),
    },
    api: {
      status: 'healthy',
      endpoint: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
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

  try {
    const apiStartTime = Date.now()
    const response = await fetch(`${status.api.endpoint}/health/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
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

  if (!status.browser.localStorageEnabled || !status.browser.sessionStorageEnabled) {
    status.frontend.status = 'degraded'
  }

  if (status.frontend.memory.usedJSHeapSize && status.frontend.memory.jsHeapSizeLimit) {
    const memoryUsagePercent = (status.frontend.memory.usedJSHeapSize / status.frontend.memory.jsHeapSizeLimit) * 100
    if (memoryUsagePercent > 90) {
      status.frontend.status = 'degraded'
    }
  }

  return status
}

function getMemoryInfo(): HealthStatus['frontend']['memory'] {
  const perf = performance as PerformanceWithMemory
  if (perf.memory) {
    return {
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
      usedJSHeapSize: perf.memory.usedJSHeapSize,
    }
  }
  return {}
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) { return 'Chrome' }
  if (userAgent.includes('Firefox')) { return 'Firefox' }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) { return 'Safari' }
  if (userAgent.includes('Edg')) { return 'Edge' }
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) { return 'Opera' }
  return 'Unknown'
}

function getBrowserVersion(): string {
  const userAgent = navigator.userAgent
  const match = userAgent.match(/(chrome|firefox|safari|edge|opera|opr)\/?\s*(\d+)/i)
  return match?.[2] ?? 'Unknown'
}

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

export function logHealthStatus(): void {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    checkHealth().then(status => {
      // eslint-disable-next-line no-console
      console.group('Application Health Status')
      // eslint-disable-next-line no-console
      console.log('Timestamp:', status.timestamp)
      // eslint-disable-next-line no-console
      console.log('Frontend:', status.frontend)
      // eslint-disable-next-line no-console
      console.log('API:', status.api)
      // eslint-disable-next-line no-console
      console.log('Browser:', status.browser)
      // eslint-disable-next-line no-console
      console.groupEnd()
    }).catch((error: unknown) => {
      console.error('Health check failed:', error)
    })
  }
}

export function startHealthMonitoring(intervalMs = 30000): () => void {
  if (import.meta.env.VITE_APP_ENV !== 'development') {
    return () => {}
  }

  // eslint-disable-next-line no-console
  console.log(`Starting health monitoring with ${String(intervalMs)}ms interval`)

  const intervalId = setInterval(() => {
    checkHealth().then(status => {
      if (status.frontend.status === 'unhealthy' || status.api.status === 'unreachable') {
        console.warn('Health check warning:', status)
      }
    }).catch((error: unknown) => {
      console.error('Health monitoring error:', error)
    })
  }, intervalMs)

  return () => {
    clearInterval(intervalId)
    // eslint-disable-next-line no-console
    console.log('Health monitoring stopped')
  }
}
