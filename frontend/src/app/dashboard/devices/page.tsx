'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import axios from 'axios'
import DeviceTable from '@/components/devices/DeviceTable'
import DeviceFilters from '@/components/devices/DeviceFilters'
import { Plus, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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

interface DeviceFormData {
  name: string
  location: string
  type: string
}

export default function DevicesPage() {
  const { token, user } = useAuth()
  const { socket } = useSocket()
  const [devices, setDevices] = useState<Device[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    location: '',
    type: 'sensor'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (token) {
      fetchDevices()
    }
  }, [token, pagination.page, filters])

  useEffect(() => {
    if (socket) {
      socket.on('device:status', (data) => {
        setDevices(prev => 
          prev.map(device => 
            device.id === data.deviceId 
              ? { ...device, isOnline: data.isOnline, lastSeenAt: data.lastSeenAt }
              : device
          )
        )
      })

      return () => {
        socket.off('device:status')
      }
    }
  }, [socket])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        status: filters.status,
        type: filters.type
      })

      const response = await axios.get(`${API_URL}/api/devices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setDevices(response.data.devices)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleAddDevice = () => {
    setFormData({ name: '', location: '', type: 'sensor' })
    setEditingDevice(null)
    setShowAddModal(true)
  }

  const handleEditDevice = (device: Device) => {
    setFormData({
      name: device.name,
      location: device.location || '',
      type: device.type
    })
    setEditingDevice(device)
    setShowAddModal(true)
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${API_URL}/api/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Refresh the devices list
      fetchDevices()
      alert('Device deleted successfully!')
    } catch (error) {
      console.error('Failed to delete device:', error)
      alert('Failed to delete device. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingDevice) {
        // Update existing device
        await axios.put(`${API_URL}/api/devices/${editingDevice.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('Device updated successfully!')
      } else {
        // Create new device
        await axios.post(`${API_URL}/api/devices`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('Device created successfully!')
      }
      
      setShowAddModal(false)
      fetchDevices()
    } catch (error) {
      console.error('Failed to save device:', error)
      alert('Failed to save device. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canManageDevices = user?.role === 'ADMIN' || user?.role === 'OPERATOR'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Devices</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor all IoT devices</p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <button 
            onClick={handleAddDevice}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </button>
        )}
      </div>

      {/* Filters */}
      <DeviceFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Device Table */}
      <div className="card">
        <DeviceTable
          devices={devices}
          pagination={pagination}
          loading={loading}
          onPageChange={handlePageChange}
          canManage={canManageDevices}
          onEdit={handleEditDevice}
          onDelete={handleDeleteDevice}
        />
      </div>

      {/* Add/Edit Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {editingDevice ? 'Edit Device' : 'Add New Device'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Enter device name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="input"
                  placeholder="Enter device location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="input"
                >
                  <option value="sensor">Sensor</option>
                  <option value="temperature">Temperature</option>
                  <option value="motor">Motor</option>
                  <option value="power">Power</option>
                  <option value="vibration">Vibration</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingDevice ? 'Update Device' : 'Create Device')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}