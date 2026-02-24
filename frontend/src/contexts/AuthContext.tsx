import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react'

import axios, { type AxiosInstance } from 'axios'

interface User {
  id: number
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configure axios to include CSRF token and credentials
axios.defaults.withCredentials = true
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

// Base URL for API - will be proxied in dev, set via environment variable in production
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Create axios instance with interceptors
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get<User>('/users/me/')
        setUser(response.data)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    void checkAuth()
  }, [])

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        const axiosError = error as {
          config: Record<string, unknown>
          response?: { status: number }
        }
        const originalRequest = axiosError.config
        if (
          axiosError.response?.status === 401 &&
          !originalRequest['_retry'] &&
          !(originalRequest['url'] as string | undefined)?.includes('/token/refresh/')
        ) {
          originalRequest['_retry'] = true
          try {
            await api.post('/token/refresh/')
            return await api(originalRequest as unknown as Parameters<typeof api>[0])
          } catch (refreshError) {
            setUser(null)
            throw refreshError
          }
        }
        return Promise.reject(error as Error)
      }
    )

    return () => {
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      await api.get('/csrf/')
      await api.post('/token/', { email, password })
      const userResponse = await api.get<User>('/users/me/')
      setUser(userResponse.data)
    } catch (error) {
      setUser(null)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await api.post('/logout/')
    } finally {
      setUser(null)
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
