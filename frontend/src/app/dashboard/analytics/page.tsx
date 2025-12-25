'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import axios from 'axios'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Thermometer,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AnalyticsData {
  devicePerformance: any[]
  telemetryTrends: any[]
  deviceTypes: any[]
  alertsOverTime: any[]
  efficiencyMetrics: any[]
}

export default function AnalyticsPage() {
  const { token } = useAuth()
  const { socket } = useSocket()
  const [data, setData] = useState<AnalyticsData>({
    devicePerformance: [],
    telemetryTrends: [],
    deviceTypes: [],
    alertsOverTime: [],
    efficiencyMetrics: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    if (token) {
      fetchAnalyticsData()
    }
  }, [token, timeRange])

  useEffect(() => {
    if (socket) {
      socket.on('telemetry:update', () => {
        // Refresh analytics data when new telemetry arrives
        fetchAnalyticsData()
      })

      return () => {
        socket.off('telemetry:update')
      }
    }
  }, [socket])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch devices and their telemetry data
      const [devicesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/devices?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const devices = devicesResponse.data.devices

      // Generate analytics data
      const devicePerformance = devices.map((device: any) => ({
        name: device.name.split(' ')[0] + ' ' + device.name.split(' ')[1],
        uptime: device.isOnline ? 100 : 0,
        dataPoints: device._count.telemetry,
        efficiency: device.isOnline ? 85 + Math.random() * 15 : 0,
        status: device.isOnline ? 'Online' : 'Offline'
      }))

      // Generate telemetry trends (mock data based on device types)
      const telemetryTrends = Array.from({ length: 24 }, (_, i) => ({
        hour: `${23 - i}h ago`,
        temperature: 900 + Math.random() * 300,
        power: 600 + Math.random() * 200,
        vibration: Math.random() * 8,
        rpm: 1400 + Math.random() * 200
      })).reverse()

      // Device type distribution
      const deviceTypeCounts = devices.reduce((acc: any, device: any) => {
        acc[device.type] = (acc[device.type] || 0) + 1
        return acc
      }, {})

      const deviceTypes = Object.entries(deviceTypeCounts).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: count,
        color: getTypeColor(type)
      }))

      // Alerts over time (mock data)
      const alertsOverTime = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        critical: Math.floor(Math.random() * 5),
        warning: Math.floor(Math.random() * 10),
        info: Math.floor(Math.random() * 15)
      }))

      // Efficiency metrics
      const efficiencyMetrics = [
        { metric: 'Overall Efficiency', value: 92, change: +2.5, trend: 'up' },
        { metric: 'Energy Usage', value: 78, change: -1.2, trend: 'down' },
        { metric: 'Uptime', value: 99.2, change: +0.3, trend: 'up' },
        { metric: 'Data Quality', value: 96.8, change: +1.1, trend: 'up' }
      ]

      setData({
        devicePerformance,
        telemetryTrends,
        deviceTypes,
        alertsOverTime,
        efficiencyMetrics
      })
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      temperature: '#ef4444',
      motor: '#3b82f6',
      power: '#f59e0b',
      vibration: '#8b5cf6',
      sensor: '#10b981'
    }
    return colors[type] || '#6b7280'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Advanced insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.efficiencyMetrics.map((metric) => (
          <div key={metric.metric} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.metric}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}%</p>
              </div>
              <div className={`p-3 rounded-lg ${
                metric.trend === 'up' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Device Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.devicePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="uptime" fill="#10b981" name="Uptime %" />
                <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Telemetry Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Telemetry Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.telemetryTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2} name="Power (kW)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Type Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.deviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Over Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.alertsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" name="Critical" />
                <Area type="monotone" dataKey="warning" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Warning" />
                <Area type="monotone" dataKey="info" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Info" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Device Status Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Device Performance Summary</h3>
        </div>
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
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.devicePerformance.map((device, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{device.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      device.status === 'Online' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {device.status === 'Online' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.uptime.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.efficiency.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.dataPoints.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}