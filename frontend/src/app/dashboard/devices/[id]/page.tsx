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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="text-center py-12">
        <div className="text-danger-600 mb-4">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/devices"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">{getDeviceTypeIcon(device.type)}</span>
              {device.name}
            </h1>
            <p className="text-gray-600">Device Details & Real-time Monitoring</p>
          </div>
        </div>
      </div>

      {/* Device Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${device.isOnline ? 'bg-success-50' : 'bg-danger-50'}`}>
              {device.isOnline ? (
                <Wifi className="h-6 w-6 text-success-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-danger-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className={`text-lg font-bold ${device.isOnline ? 'text-success-600' : 'text-danger-600'}`}>
                {device.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-primary-50 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="text-lg font-bold text-gray-900">{device.location}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-warning-50 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Data Points</p>
              <p className="text-lg font-bold text-gray-900">
                {device._count.telemetry.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-gray-50 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Seen</p>
              <p className="text-lg font-bold text-gray-900">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <RealTimeChart
            key={metric.metric}
            title={`${device.name} - ${metric.metric.charAt(0).toUpperCase() + metric.metric.slice(1)}`}
            deviceId={device.id}
            metric={metric.metric}
            unit={metric.unit}
            color={metric.color}
          />
        ))}
      </div>

      {/* Device Information */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Device Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Device ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{device.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{device.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="text-sm text-gray-900">{device.location}</dd>
              </div>
            </dl>
          </div>
          <div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(device.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    device.isOnline ? 'status-online' : 'status-offline'
                  }`}>
                    {device.isOnline ? 'Online' : 'Offline'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Telemetry</dt>
                <dd className="text-sm text-gray-900">
                  {device._count.telemetry.toLocaleString()} data points
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}