'use client'

import { Search, Filter } from 'lucide-react'

interface DeviceFiltersProps {
  filters: {
    search: string
    status: string
    type: string
  }
  onFiltersChange: (filters: any) => void
}

export default function DeviceFilters({ filters, onFiltersChange }: DeviceFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, status: e.target.value })
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, type: e.target.value })
  }

  return (
    <div className="card p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search devices..."
              value={filters.search}
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="sm:w-48">
          <select
            value={filters.type}
            onChange={handleTypeChange}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="temperature">Temperature</option>
            <option value="motor">Motor</option>
            <option value="power">Power</option>
            <option value="vibration">Vibration</option>
            <option value="sensor">Sensor</option>
          </select>
        </div>
      </div>
    </div>
  )
}