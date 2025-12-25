'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'

// Lazy load heavy components
const StatsCards = lazy(() => import('@/components/dashboard/StatsCards'))
const DeviceStatusGrid = lazy(() => import('@/components/dashboard/DeviceStatusGrid'))
const RealTimeChart = lazy(() => import('@/components/dashboard/RealTimeChart'))
const RecentAlerts = lazy(() => import('@/components/dashboard/RecentAlerts'))

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

// Loading component
function ComponentLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  )
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
      // Fetch data with staggered loading
      fetchStatsAndDevices()
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

  const fetchStatsAndDevices = async () => {
    try {
      // Fetch stats and devices in parallel
      const [statsResponse, devicesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/devices/stats/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/devices?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      setStats(statsResponse.data)
      setDevices(devicesResponse.data.devices)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your cement plant operations in real-time</p>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor your cement plant operations in real-time</p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<ComponentLoader />}>
        <StatsCards stats={stats} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Status Grid - Takes 2 columns */}
        <div className="lg:col-span-2 flex">
          <Suspense fallback={<ComponentLoader />}>
            <DeviceStatusGrid devices={devices} />
          </Suspense>
        </div>

        {/* Right Column - Takes 1 column */}
        <div className="flex">
          {/* Recent Alerts */}
          <Suspense fallback={<ComponentLoader />}>
            <RecentAlerts />
          </Suspense>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Suspense fallback={<ComponentLoader />}>
          <RealTimeChart 
            title="Kiln Temperature"
            deviceId="kiln-temp-01"
            metric="temperature"
            unit="°C"
            color="#ef4444"
          />
        </Suspense>
        <Suspense fallback={<ComponentLoader />}>
          <RealTimeChart 
            title="Power Consumption"
            deviceId="power-meter-01"
            metric="power"
            unit="kW"
            color="#3b82f6"
          />
        </Suspense>
      </div>
    </div>
  )
}