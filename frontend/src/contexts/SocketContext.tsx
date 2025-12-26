'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user, token } = useAuth()
  const pathname = usePathname()

  // Only connect socket for dashboard routes
  const needsSocket = pathname?.startsWith('/dashboard')

  useEffect(() => {
    if (needsSocket && user && token && !socket) {
      console.log('🔌 Connecting to WebSocket server...')
      console.log('Socket URL:', SOCKET_URL)
      console.log('User:', user?.email)
      console.log('Token exists:', !!token)
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['polling'], // Use only polling for now to avoid WebSocket issues
        timeout: 15000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 3,
        upgrade: true, // Allow upgrade to WebSocket after initial connection
        rememberUpgrade: false
      })

      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket server')
        console.log('Transport:', newSocket.io.engine.transport.name)
        setConnected(true)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket server:', reason)
        setConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
        console.log('Trying to reconnect...')
        setConnected(false)
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts')
        setConnected(true)
      })

      newSocket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection failed:', error)
      })

      setSocket(newSocket)

      return () => {
        console.log('🔌 Cleaning up WebSocket connection')
        newSocket.close()
      }
    } else if (!needsSocket && socket) {
      // Disconnect socket when not needed
      console.log('🔌 Disconnecting WebSocket (not needed)')
      socket.close()
      setSocket(null)
      setConnected(false)
    } else if (!user && socket) {
      // Clean up socket when user logs out
      socket.close()
      setSocket(null)
      setConnected(false)
    }
  }, [needsSocket, user, token, socket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [socket])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}