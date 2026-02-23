import { useState, useEffect } from 'react'
import { checkHealth, HealthStatus } from '../utils/health'

/**
 * Health check page for monitoring and debugging
 * Accessible at /health in development mode only
 */
export default function HealthPage() {
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
    loadHealthStatus()
  }, [])

  // In production, restrict access or hide this page
  if (import.meta.env['VITE_APP_ENV'] === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Health Check</h1>
          <p className="text-gray-600">
            Health check page is not available in production mode.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Health Dashboard</h1>
          <p className="text-gray-600">
            Real-time monitoring of frontend application health and system status
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <button
              onClick={loadHealthStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            {healthStatus && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                healthStatus.frontend.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : healthStatus.frontend.status === 'degraded'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                Overall: {healthStatus.frontend.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-3"
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
              <span className="text-red-800 font-medium">Error loading health status: {error}</span>
            </div>
          </div>
        )}

        {loading && !healthStatus ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading health status...</p>
          </div>
        ) : healthStatus ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Frontend Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Frontend Application</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthStatus.frontend.status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : healthStatus.frontend.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {healthStatus.frontend.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                    {healthStatus.frontend.version}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                    {healthStatus.frontend.environment}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Screen Resolution</label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                    {healthStatus.frontend.screenResolution}
                  </div>
                </div>
                {healthStatus.frontend.memory.usedJSHeapSize && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memory Usage</label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used:</span>
                        <span className="font-mono">
                          {(healthStatus.frontend.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-mono">
                          {(healthStatus.frontend.memory.totalJSHeapSize! / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Limit:</span>
                        <span className="font-mono">
                          {(healthStatus.frontend.memory.jsHeapSizeLimit! / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(healthStatus.frontend.memory.usedJSHeapSize / healthStatus.frontend.memory.jsHeapSizeLimit!) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* API Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">API Connectivity</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthStatus.api.status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : healthStatus.api.status === 'error'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {healthStatus.api.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                    {healthStatus.api.endpoint}
                  </div>
                </div>
                {healthStatus.api.responseTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response Time</label>
                    <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                      <span className="font-mono">{healthStatus.api.responseTime}ms</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        healthStatus.api.responseTime < 100
                          ? 'bg-green-100 text-green-800'
                          : healthStatus.api.responseTime < 500
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {healthStatus.api.responseTime < 100 ? 'Fast' : 
                         healthStatus.api.responseTime < 500 ? 'Moderate' : 'Slow'}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Check</label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                    {new Date(healthStatus.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Browser Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Browser Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Browser</label>
                    <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                      {healthStatus.browser.name} {healthStatus.browser.version}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                      {healthStatus.browser.platform}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Support</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        healthStatus.browser.cookiesEnabled
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {healthStatus.browser.cookiesEnabled ? '✓' : '✗'}
                      </div>
                      <div className="text-sm font-medium">Cookies</div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        healthStatus.browser.localStorageEnabled
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {healthStatus.browser.localStorageEnabled ? '✓' : '✗'}
                      </div>
                      <div className="text-sm font-medium">Local Storage</div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        healthStatus.browser.sessionStorageEnabled
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {healthStatus.browser.sessionStorageEnabled ? '✓' : '✗'}
                      </div>
                      <div className="text-sm font-medium">Session Storage</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm font-mono overflow-auto">
                    {healthStatus.frontend.userAgent}
                  </div>
                </div>
              </div>
            </div>

            {/* Raw JSON Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Raw Health Data</h2>
              <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm overflow-auto max-h-96">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}