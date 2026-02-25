import React, { Component, type ErrorInfo, type ReactNode } from 'react'

import { checkHealth, type HealthStatus } from '../utils/health'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  healthStatus: HealthStatus | null
}

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
    return {
      hasError: true,
      error,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  override async componentDidCatch(error: Error, errorInfo: ErrorInfo): Promise<void> {
    this.setState({
      errorInfo,
    })

    console.error('React Error Boundary caught an error:', error, errorInfo)

    try {
      const healthStatus = await checkHealth()
      this.setState({ healthStatus })
      console.error('Health status at time of error:', healthStatus)
    } catch (healthError) {
      console.error('Failed to collect health status:', healthError)
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="size-8 text-red-600"
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
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mb-6 text-gray-600">
              An error occurred while rendering this page. Our team has been notified.
            </p>
          </div>

          <div className="space-y-6">
            {import.meta.env.VITE_APP_ENV === 'development' && error && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between bg-gray-50 p-4 hover:bg-gray-100">
                    <span className="font-medium text-gray-900">Error Details (Development)</span>
                    <svg
                      className="size-5 text-gray-500 transition-transform group-open:rotate-180"
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
                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="mb-4">
                      <h3 className="mb-2 font-medium text-gray-900">Error Message</h3>
                      <pre className="overflow-auto rounded bg-red-50 p-3 text-sm text-red-600">
                        {error.toString()}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div className="mb-4">
                        <h3 className="mb-2 font-medium text-gray-900">Component Stack</h3>
                        <pre className="overflow-auto rounded bg-gray-50 p-3 text-sm text-gray-700">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    {healthStatus && (
                      <div>
                        <h3 className="mb-2 font-medium text-gray-900">Health Status</h3>
                        <pre className="overflow-auto rounded bg-gray-50 p-3 text-sm text-gray-700">
                          {JSON.stringify(healthStatus, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="flex-1 rounded-lg bg-gray-800 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-gray-900 focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-none"
              >
                Go to Home
              </a>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-center text-sm text-gray-600">
                Need help?{' '}
                <a
                  href="mailto:support@example.com"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  Contact support
                </a>{' '}
                or{' '}
                <a
                  href="/docs/troubleshooting"
                  className="font-medium text-blue-600 hover:text-blue-800"
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

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WithErrorBoundary: React.ComponentType<P> = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName ?? WrappedComponent.name})`

  return WithErrorBoundary
}

export function useErrorReporter() {
  const reportError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    console.error('Reported error:', error, context)

    if (import.meta.env.VITE_APP_ENV === 'production') {
      console.warn('Reported error:', error, context)
    }
  }, [])

  return { reportError }
}
