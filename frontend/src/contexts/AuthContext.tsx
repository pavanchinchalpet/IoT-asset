'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'

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
      setLoading(true)
      setInitialized(true)
      
      // Check for stored token on mount
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
        // Verify token with server
        verifyToken(storedToken)
      } else {
        setLoading(false)
      }
    } else if (!isProtectedRoute) {
      // For landing page, don't load auth
      setLoading(false)
    }
  }, [isProtectedRoute, initialized])

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
      setToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      })

      const { user, token } = response.data
      setUser(user)
      setToken(token)
      localStorage.setItem('token', token)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
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