'use client'

import { formatDistanceToNow } from 'date-fns'
import { Cpu, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'

interface Device {
  id: string
  name: string
  location: string
  type: string
  isOnline: boolean
  lastSeenAt: string | null
}

interface DeviceStatusGridProps {
  devices: Device[]
}

export default function DeviceStatusGrid({ devices }: DeviceStatusGridProps) {
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

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case 'temperature':
        return 'bg-red-100 text-red-800'
      case 'motor':
        return 'bg-blue-100 text-blue-800'
      case 'power':
        return 'bg-yellow-100 text-yellow-800'
      case 'vibration':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card flex flex-col w-full h-full">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Device Status</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time status of all connected devices</p>
      </div>
      
      <div className="flex-1 p-6">
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Cpu className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No devices</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No devices are currently registered.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {devices.map((device) => (
              <Link
                key={device.id}
                href={`/dashboard/devices/${device.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {getDeviceTypeIcon(device.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {device.name}
                      </h4>
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{device.location}</span>
                      </div>
                      {device.lastSeenAt && (
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        device.isOnline ? 'status-online' : 'status-offline'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          device.isOnline ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      {device.isOnline ? 'Online' : 'Offline'}
                    </span>
                    
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getDeviceTypeColor(device.type)}`}
                    >
                      {device.type}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}