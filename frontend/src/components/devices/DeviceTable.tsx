'use client'

import { formatDistanceToNow } from 'date-fns'
import { Eye, Edit, Trash2, MapPin, Clock, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface Device {
  id: string
  name: string
  location: string
  type: string
  isOnline: boolean
  lastSeenAt: string | null
  createdAt: string
  _count: {
    telemetry: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface DeviceTableProps {
  devices: Device[]
  pagination: Pagination
  loading: boolean
  onPageChange: (page: number) => void
  canManage: boolean
  onEdit: (device: Device) => void
  onDelete: (deviceId: string) => void
}

export default function DeviceTable({ 
  devices, 
  pagination, 
  loading, 
  onPageChange, 
  canManage,
  onEdit,
  onDelete
}: DeviceTableProps) {
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Devices ({pagination.total})
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No devices found matching your criteria.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {getDeviceTypeIcon(device.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {device.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {device.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.isOnline ? 'status-online' : 'status-offline'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          device.isOnline ? 'bg-success-400' : 'bg-danger-400'
                        }`}
                      />
                      {device.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeviceTypeColor(device.type)}`}
                    >
                      {device.type}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {device.location || 'Unknown'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <BarChart3 className="h-4 w-4 text-gray-400 mr-1" />
                      {device._count.telemetry.toLocaleString()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.lastSeenAt ? (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}
                      </div>
                    ) : (
                      'Never'
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/dashboard/devices/${device.id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      
                      {canManage && (
                        <>
                          <button
                            onClick={() => onEdit(device)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Device"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => onDelete(device.id)}
                            className="text-danger-600 hover:text-danger-900"
                            title="Delete Device"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        pagination.page === page
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}