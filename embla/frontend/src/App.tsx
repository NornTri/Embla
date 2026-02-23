import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import HealthPage from './pages/Health'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logHealthStatus, startHealthMonitoring } from './utils/health'
import { initDevTools } from './utils/devtools'
import { useEffect } from 'react'

function App() {
  // Initialize development tools
  useEffect(() => {
    if (import.meta.env['VITE_APP_ENV'] === 'development') {
      // Initialize dev tools (React DevTools detection, console helpers, etc.)
      const cleanupDevTools = initDevTools()
      
      // Log initial health status
      logHealthStatus()
      
      // Start periodic health monitoring (every 30 seconds)
      const stopHealthMonitoring = startHealthMonitoring(30000)
      
      // Cleanup on unmount
      return () => {
        cleanupDevTools()
        stopHealthMonitoring()
      }
    }
    
    // Return undefined in production (no cleanup needed)
    return undefined
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            {/* Health page - only accessible in development or with proper auth */}
            {import.meta.env['VITE_APP_ENV'] === 'development' && (
              <Route path="/health" element={<HealthPage />} />
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App