import React, { Component, ErrorInfo, ReactNode } from 'react'
import { checkHealth } from '../utils/health'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  healthStatus: any | null
}

/**
 * Error boundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorScreen />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      healthStatus: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  override async componentDidCatch(error: Error, errorInfo: ErrorInfo): Promise<void> {
    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Log the error to console
    console.error('React Error Boundary caught an error:', error, errorInfo)

    // Collect health status for debugging
    try {
      const healthStatus = await checkHealth()
      this.setState({ healthStatus })
      console.error('Health status at time of error:', healthStatus)
    } catch (healthError) {
      console.error('Failed to collect health status:', healthError)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo })
    if (import.meta.env.VITE_APP_ENV === 'production') {
      console.warn('Error caught by ErrorBoundary:', error)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      healthStatus: null,
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return this.renderDefaultErrorUI()
    }

    return this.props.children
  }

  private renderDefaultErrorUI(): React.ReactNode {
    const { error, errorInfo, healthStatus } = this.state

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              An error occurred while rendering this page. Our team has been notified.
            </p>
          </div>

          <div className="space-y-6">
            {/* Error Details (collapsible for developers) */}
            {(import.meta.env.VITE_APP_ENV === 'development' && error) && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100">
                    <span className="font-medium text-gray-900">Error Details (Development)</span>
                    <svg
                      className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">Error Message</h3>
                      <pre className="text-sm text-red-600 bg-red-50 p-3 rounded overflow-auto">
                        {error.toString()}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-2">Component Stack</h3>
                        <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded overflow-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    {healthStatus && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Health Status</h3>
                        <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded overflow-auto">
                          {JSON.stringify(healthStatus, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="flex-1 px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-colors text-center"
              >
                Go to Home
              </a>
            </div>

            {/* Support Contact */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Need help?{' '}
                <a
                  href="mailto:support@example.com"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Contact support
                </a>{' '}
                or{' '}
                <a
                  href="/docs/troubleshooting"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  view troubleshooting guide
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

/**
 * Higher-order component that wraps a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent: React.ComponentType<P> = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  // Copy display name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook to manually report errors to the error boundary context
 * (if using error boundary with context)
 */
export function useErrorReporter() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    console.error('Reported error:', error, context)
    
    // In production, send to error tracking service
    if (import.meta.env.VITE_APP_ENV === 'production') {
      console.warn('Reported error:', error, context)
    }
  }, [])

  return { reportError }
}