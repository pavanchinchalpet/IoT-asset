'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'
import apiClient from '@/utils/axios'
import { tokenCookie, debugCookies } from '@/utils/cookies'

interface User {
  id: string
  email: string
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER'
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const pathname = usePathname()

  // Only initialize auth on protected routes
  const isProtectedRoute = pathname?.startsWith('/dashboard') || pathname === '/login'

  useEffect(() => {
    if (isProtectedRoute && !initialized) {
      console.log('🔐 Initializing auth for protected route:', pathname)
      setLoading(true)
      setInitialized(true)
      
      // Check for stored token on mount
      const storedToken = tokenCookie.get()
      console.log('🔐 Stored token exists:', !!storedToken)
      debugCookies()
      
      if (storedToken) {
        setToken(storedToken)
        // Verify token with server
        verifyToken(storedToken)
      } else {
        console.log('🔐 No stored token found')
        setLoading(false)
      }
    } else if (!isProtectedRoute) {
      // For landing page, don't load auth
      console.log('🔐 Not a protected route, skipping auth')
      setLoading(false)
    }
  }, [isProtectedRoute, initialized])

  const verifyToken = async (token: string) => {
    try {
      console.log('🔐 Verifying token with backend...')
      console.log('API URL:', `${API_URL}/api/auth/me`)
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...')
      
      const response = await apiClient.get('/api/auth/me')
      
      console.log('✅ Token verification successful:', response.data.user)
      setUser(response.data.user)
      setToken(token)
    } catch (error: any) {
      console.error('❌ Token verification failed:', error.response?.data || error.message)
      console.log('🔐 Clearing invalid token from cookies')
      tokenCookie.remove()
      setToken(null)
      setUser(null)
      
      // If we're on a protected route and token is invalid, redirect to login
      if (isProtectedRoute && pathname !== '/login') {
        console.log('🔐 Redirecting to login due to invalid token')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      })

      const { user, token } = response.data
      setUser(user)
      setToken(token)
      
      // Store token in secure cookie
      tokenCookie.set(token)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    tokenCookie.remove()
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}