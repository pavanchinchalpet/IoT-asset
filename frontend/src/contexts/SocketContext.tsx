'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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

  useEffect(() => {
    if (user && token) {
      console.log('🔌 Connecting to WebSocket server...')
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        }
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
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user, token])

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