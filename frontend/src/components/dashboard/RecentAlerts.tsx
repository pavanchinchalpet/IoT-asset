'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  deviceName?: string
  timestamp: Date
}

export default function RecentAlerts() {
  const { socket } = useSocket()
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'warning',
      message: 'Kiln temperature above threshold (1150°C)',
      deviceName: 'Kiln Temperature Sensor #1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      id: '2',
      type: 'info',
      message: 'Device reconnected successfully',
      deviceName: 'Conveyor Motor #1',
      timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    {
      id: '3',
      type: 'error',
      message: 'Communication timeout',
      deviceName: 'Vibration Sensor',
      timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: '4',
      type: 'warning',
      message: 'High power consumption detected',
      deviceName: 'Crusher Motor #2',
      timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
    },
    {
      id: '5',
      type: 'info',
      message: 'Maintenance schedule updated',
      deviceName: 'Conveyor Belt #3',
      timestamp: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    },
    {
      id: '6',
      type: 'warning',
      message: 'Vibration levels elevated',
      deviceName: 'Mill Vibration Sensor',
      timestamp: new Date(Date.now() - 90 * 60 * 1000) // 1.5 hours ago
    }
  ])

  useEffect(() => {
    if (socket) {
      // Listen for device status changes to generate alerts
      socket.on('device:status', (data) => {
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: data.isOnline ? 'info' : 'error',
          message: data.isOnline ? 'Device came online' : 'Device went offline',
          deviceName: data.deviceName || `Device ${data.deviceId}`,
          timestamp: new Date()
        }
        
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]) // Keep only 10 most recent
      })

      // Listen for telemetry updates to generate threshold alerts
      socket.on('telemetry:update', (data) => {
        data.data.forEach((telemetry: any) => {
          // Example: Temperature threshold alert
          if (telemetry.metric === 'temperature' && telemetry.value > 1100) {
            const newAlert: Alert = {
              id: Date.now().toString() + Math.random(),
              type: 'warning',
              message: `High temperature detected: ${telemetry.value.toFixed(1)}°C`,
              deviceName: data.deviceId,
              timestamp: new Date()
            }
            
            setAlerts(prev => [newAlert, ...prev.slice(0, 9)])
          }
          
          // Example: Power consumption alert
          if (telemetry.metric === 'power' && telemetry.value > 750) {
            const newAlert: Alert = {
              id: Date.now().toString() + Math.random(),
              type: 'warning',
              message: `High power consumption: ${telemetry.value.toFixed(1)} kW`,
              deviceName: data.deviceId,
              timestamp: new Date()
            }
            
            setAlerts(prev => [newAlert, ...prev.slice(0, 9)])
          }
        })
      })

      return () => {
        socket.off('device:status')
        socket.off('telemetry:update')
      }
    }
  }, [socket])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'info':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-500'
    }
  }

  return (
    <div className="card flex flex-col w-full h-full">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Alerts</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Latest system notifications and warnings</p>
      </div>
      
      <div className="flex-1 p-6">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 dark:text-green-500 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">All systems normal</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent alerts or warnings.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 ${getAlertBorderColor(alert.type)} bg-gray-50 dark:bg-gray-700 p-3 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                      {alert.message}
                    </p>
                    {alert.deviceName && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {alert.deviceName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}