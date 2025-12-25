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
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
      })

      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket server')
        setConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server')
        setConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
        setConnected(false)
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