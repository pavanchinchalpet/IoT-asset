'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import StatsCards from '@/components/dashboard/StatsCards'
import DeviceStatusGrid from '@/components/dashboard/DeviceStatusGrid'
import RealTimeChart from '@/components/dashboard/RealTimeChart'
import RecentAlerts from '@/components/dashboard/RecentAlerts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface DeviceStats {
  total: number
  online: number
  offline: number
  telemetryCount: number
}

interface Device {
  id: string
  name: string
  location: string
  type: string
  isOnline: boolean
  lastSeenAt: string | null
}

export default function Dashboard() {
  const { token } = useAuth()
  const { socket } = useSocket()
  const [stats, setStats] = useState<DeviceStats>({
    total: 0,
    online: 0,
    offline: 0,
    telemetryCount: 0
  })
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchStats()
      fetchDevices()
    }
  }, [token])

  useEffect(() => {
    if (socket) {
      // Listen for real-time device status updates
      socket.on('device:status', (data) => {
        setDevices(prev => 
          prev.map(device => 
            device.id === data.deviceId 
              ? { ...device, isOnline: data.isOnline, lastSeenAt: data.lastSeenAt }
              : device
          )
        )
        
        // Update stats
        fetchStats()
      })

      // Listen for telemetry updates
      socket.on('telemetry:update', (data) => {
        console.log('📊 Real-time telemetry:', data)
        // Update telemetry count
        setStats(prev => ({ ...prev, telemetryCount: prev.telemetryCount + data.data.length }))
      })

      return () => {
        socket.off('device:status')
        socket.off('telemetry:update')
      }
    }
  }, [socket])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/devices/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/devices?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDevices(response.data.devices)
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your cement plant operations in real-time</p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Status Grid - Takes 2 columns */}
        <div className="lg:col-span-2">
          <DeviceStatusGrid devices={devices} />
        </div>

        {/* Recent Alerts - Takes 1 column */}
        <div>
          <RecentAlerts />
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RealTimeChart 
          title="Kiln Temperature"
          deviceId="kiln-temp-01"
          metric="temperature"
          unit="°C"
          color="#ef4444"
        />
        <RealTimeChart 
          title="Power Consumption"
          deviceId="power-meter-01"
          metric="power"
          unit="kW"
          color="#3b82f6"
        />
      </div>
    </div>
  )
}