import { useState, useEffect } from 'react'

import { checkHealth, type HealthStatus } from '../utils/health'

export function HealthPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadHealthStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const status = await checkHealth()
      setHealthStatus(status)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Failed to load health status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHealthStatus()
  }, [])

  if (import.meta.env.VITE_APP_ENV === 'production') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Health Check</h1>
          <p className="text-gray-600">Health check page is not available in production mode.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Application Health Dashboard</h1>
          <p className="text-gray-600">
            Real-time monitoring of frontend application health and system status
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={() => void loadHealthStatus()}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            {healthStatus && (
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  healthStatus.frontend.status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : healthStatus.frontend.status === 'degraded'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                Overall: {healthStatus.frontend.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <svg
                className="mr-3 size-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-red-800">Error loading health status: {error}</span>
            </div>
          </div>
        )}

        {loading && !healthStatus ? (
          <div className="py-12 text-center">
            <div className="mb-4 inline-block size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading health status...</p>
          </div>
        ) : healthStatus ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Frontend Application</h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    healthStatus.frontend.status === 'healthy'
                      ? 'bg-green-100 text-green-800'
                      : healthStatus.frontend.status === 'degraded'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {healthStatus.frontend.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Version</label>
                  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                    {healthStatus.frontend.version}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Environment
                  </label>
                  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                    {healthStatus.frontend.environment}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Screen Resolution
                  </label>
                  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                    {healthStatus.frontend.screenResolution}
                  </div>
                </div>
                {healthStatus.frontend.memory.usedJSHeapSize &&
                  healthStatus.frontend.memory.totalJSHeapSize &&
                  healthStatus.frontend.memory.jsHeapSizeLimit && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Memory Usage
                      </label>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Used:</span>
                          <span className="font-mono">
                            {(healthStatus.frontend.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}{' '}
                            MB
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total:</span>
                          <span className="font-mono">
                            {(healthStatus.frontend.memory.totalJSHeapSize / 1024 / 1024).toFixed(
                              2
                            )}{' '}
                            MB
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Limit:</span>
                          <span className="font-mono">
                            {(healthStatus.frontend.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(
                              2
                            )}{' '}
                            MB
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{
                              width: `${(healthStatus.frontend.memory.usedJSHeapSize / healthStatus.frontend.memory.jsHeapSizeLimit) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">API Connectivity</h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    healthStatus.api.status === 'healthy'
                      ? 'bg-green-100 text-green-800'
                      : healthStatus.api.status === 'error'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {healthStatus.api.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Endpoint</label>
                  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm">
                    {healthStatus.api.endpoint}
                  </div>
                </div>
                {healthStatus.api.responseTime && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Response Time
                    </label>
                    <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                      <span className="font-mono">{healthStatus.api.responseTime}ms</span>
                      <span
                        className={`ml-2 rounded-full px-2 py-1 text-xs ${
                          healthStatus.api.responseTime < 100
                            ? 'bg-green-100 text-green-800'
                            : healthStatus.api.responseTime < 500
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {healthStatus.api.responseTime < 100
                          ? 'Fast'
                          : healthStatus.api.responseTime < 500
                            ? 'Moderate'
                            : 'Slow'}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Last Check</label>
                  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                    {new Date(healthStatus.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Browser Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Browser</label>
                    <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                      {healthStatus.browser.name} {healthStatus.browser.version}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Platform</label>
                    <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                      {healthStatus.browser.platform}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Storage Support
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div
                        className={`mb-2 inline-flex size-10 items-center justify-center rounded-full ${
                          healthStatus.browser.cookiesEnabled
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {healthStatus.browser.cookiesEnabled ? '\u2713' : '\u2717'}
                      </div>
                      <div className="text-sm font-medium">Cookies</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`mb-2 inline-flex size-10 items-center justify-center rounded-full ${
                          healthStatus.browser.localStorageEnabled
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {healthStatus.browser.localStorageEnabled ? '\u2713' : '\u2717'}
                      </div>
                      <div className="text-sm font-medium">Local Storage</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`mb-2 inline-flex size-10 items-center justify-center rounded-full ${
                          healthStatus.browser.sessionStorageEnabled
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {healthStatus.browser.sessionStorageEnabled ? '\u2713' : '\u2717'}
                      </div>
                      <div className="text-sm font-medium">Session Storage</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">User Agent</label>
                  <div className="overflow-auto rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm">
                    {healthStatus.frontend.userAgent}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg lg:col-span-2">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Raw Health Data</h2>
              <pre className="max-h-96 overflow-auto rounded border border-gray-200 bg-gray-50 p-4 text-sm">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
