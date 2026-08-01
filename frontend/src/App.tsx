import { useEffect } from 'react'

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import { ErrorBoundary } from './components/ErrorBoundary'
import { PrivateRoute } from './components/PrivateRoute'
import { AuthProvider } from './contexts/AuthContext'
import { Dashboard } from './pages/Dashboard'
import { HealthPage } from './pages/Health'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { initDevTools } from './utils/devtools'
import { logHealthStatus, startHealthMonitoring } from './utils/health'

function App() {
  useEffect(() => {
    if (import.meta.env.VITE_APP_ENV === 'development') {
      const cleanupDevTools = initDevTools()
      logHealthStatus()
      const stopHealthMonitoring = startHealthMonitoring(30000)
      return () => {
        cleanupDevTools()
        stopHealthMonitoring()
      }
    }
    return undefined
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          {/* Top-level prefixes /api /admin /users /accounts /static /media are
              reserved for the backend and routed away at the Traefik edge
              (compose/production/traefik/traefik.yml is the source of truth) —
              a SPA route under any of them will never render in production.
              The Django-rendered auth surface (/accounts/, /users/) is
              intentionally disjoint from the SPA's /login. */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            {import.meta.env.VITE_APP_ENV === 'development' && (
              <Route path="/health" element={<HealthPage />} />
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

// eslint-disable-next-line import-x/no-default-export
export default App
