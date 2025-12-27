'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { ArrowLeft, MapPin, Clock, BarChart3, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import RealTimeChart from '@/components/dashboard/RealTimeChart'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Device {
  id: string
  name: string
  location: string
  type: string
  isOnline: boolean
  lastSeenAt: string | null
  createdAt: string
  telemetry: any[]
  _count: {
    telemetry: number
  }
}

export default function DeviceDetailsPage() {
  const { token } = useAuth()
  const { socket } = useSocket()
  const params = useParams()
  const deviceId = params.id as string
  
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token && deviceId) {
      fetchDevice()
    }
  }, [token, deviceId])

  useEffect(() => {
    if (socket && deviceId) {
      socket.on('device:status', (data) => {
        if (data.deviceId === deviceId) {
          setDevice(prev => prev ? {
            ...prev,
            isOnline: data.isOnline,
            lastSeenAt: data.lastSeenAt
          } : null)
        }
      })

      return () => {
        socket.off('device:status')
      }
    }
  }, [socket, deviceId])

  const fetchDevice = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDevice(response.data)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch device')
    } finally {
      setLoading(false)
    }
  }

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return '🌡️'
      case 'motor':
        return '⚙️'
      case 'power':
        return '⚡'
      case 'vibration':
        return '📳'
      default:
        return '📡'
    }
  }

  const getMetricsForDevice = (type: string) => {
    switch (type) {
      case 'temperature':
        return [{ metric: 'temperature', unit: '°C', color: '#ef4444' }]
      case 'motor':
        return [
          { metric: 'rpm', unit: 'rpm', color: '#3b82f6' },
          { metric: 'current', unit: 'A', color: '#f59e0b' },
          { metric: 'temperature', unit: '°C', color: '#ef4444' }
        ]
      case 'power':
        return [
          { metric: 'power', unit: 'kW', color: '#3b82f6' },
          { metric: 'voltage', unit: 'V', color: '#10b981' },
          { metric: 'current', unit: 'A', color: '#f59e0b' }
        ]
      case 'vibration':
        return [{ metric: 'vibration', unit: 'mm/s', color: '#8b5cf6' }]
      default:
        return [{ metric: 'value', unit: '', color: '#6b7280' }]
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          {error || 'Device not found'}
        </div>
        <Link href="/dashboard/devices" className="btn btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Devices
        </Link>
      </div>
    )
  }

  const metrics = getMetricsForDevice(device.type)

  return (
    <div className="device-details-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/devices"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="text-3xl mr-3">{getDeviceTypeIcon(device.type)}</span>
              {device.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Device Details & Real-time Monitoring</p>
          </div>
        </div>
      </div>

      {/* Device Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-shrink-0">
        <div className="card p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${device.isOnline ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              {device.isOnline ? (
                <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
              <p className={`text-lg font-bold ${device.isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {device.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{device.location}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Points</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {device._count.telemetry.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Seen</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {device.lastSeenAt 
                  ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 gap-6 flex-shrink-0">
        {metrics.map((metric) => (
          <RealTimeChart
            key={metric.metric}
            title={`${device?.name || 'Device'} - ${metric?.metric?.charAt(0)?.toUpperCase() + metric?.metric?.slice(1) || 'Metric'}`}
            deviceId={device.id}
            metric={metric.metric}
            unit={metric.unit}
            color={metric.color}
          />
        ))}
      </div>

      {/* Bottom Content Grid - Fills remaining space */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Device Information */}
        <div className="card p-6 flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Device Information</h3>
          <div className="flex-1 space-y-6 min-h-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Device ID</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">{device.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 capitalize bg-gray-50 dark:bg-gray-700 p-2 rounded">{device.type}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">{device.location}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {new Date(device.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    device.isOnline ? 'status-online' : 'status-offline'
                  }`}>
                    {device.isOnline ? 'Online' : 'Offline'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Telemetry</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {device._count.telemetry.toLocaleString()} data points
                </dd>
              </div>
            </div>
            
            {/* Additional Device Specs */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex-1 min-h-0">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Device Specifications</h4>
              <div className="space-y-4 overflow-y-auto">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Model</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">Industrial {device?.type?.charAt(0)?.toUpperCase() + device?.type?.slice(1) || 'Device'} v2.1</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Firmware</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">v1.2.3</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Protocol</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">MQTT/WebSocket</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Sampling Rate</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">1 Hz</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Power Supply</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">24V DC</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Operating Temp</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">-40°C to +85°C</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">IP Rating</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">IP67</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Warranty</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">2 Years</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Certification</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">CE, FCC, RoHS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Device Health & Performance */}
        <div className="card p-6 flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Health & Performance</h3>
          <div className="flex-1 space-y-6 min-h-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {device.isOnline ? '99.2%' : '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: device.isOnline ? '99.2%' : '0%' }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Quality</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">96.8%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '96.8%' }}></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Time</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {device.isOnline ? '< 100ms' : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                  style={{ width: device.isOnline ? '85%' : '0%' }}
                ></div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex-1 min-h-0">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h4>
              <div className="space-y-4 overflow-y-auto flex-1">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Device came online</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Telemetry data received</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Configuration updated</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Maintenance scheduled</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3 days ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Firmware updated</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Alert threshold updated</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 weeks ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Calibration completed</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 month ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">Device installed</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 months ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}