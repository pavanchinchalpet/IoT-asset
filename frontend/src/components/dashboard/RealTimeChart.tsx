'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface TelemetryData {
  id: string
  value: number
  createdAt: string
}

interface RealTimeChartProps {
  title: string
  deviceId: string
  metric: string
  unit: string
  color: string
}

export default function RealTimeChart({ title, deviceId, metric, unit, color }: RealTimeChartProps) {
  const { token } = useAuth()
  const { socket } = useSocket()
  const [data, setData] = useState<TelemetryData[]>([])
  const [loading, setLoading] = useState(true)

  // Memoize formatters to prevent recreation on every render
  const formatXAxis = useCallback((tickItem: string) => {
    return format(new Date(tickItem), 'HH:mm')
  }, [])

  const formatTooltip = useCallback((value: number) => {
    return [`${value.toFixed(2)} ${unit}`, metric]
  }, [unit, metric])

  const formatTooltipLabel = useCallback((label: string) => {
    return format(new Date(label), 'MMM dd, HH:mm:ss')
  }, [])

  // Memoize tooltip style to prevent recreation
  const tooltipStyle = useMemo(() => ({
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }), [])

  useEffect(() => {
    if (token) {
      fetchInitialData()
    }
  }, [token, deviceId, metric])

  useEffect(() => {
    if (socket) {
      const handleTelemetryUpdate = (update: any) => {
        if (update.deviceId === deviceId) {
          const relevantData = update.data.filter((item: any) => item.metric === metric)
          if (relevantData.length > 0) {
            setData(prev => {
              const newData = [...prev, ...relevantData]
              // Keep only last 50 data points for performance
              return newData.slice(-50)
            })
          }
        }
      }

      socket.on('telemetry:update', handleTelemetryUpdate)

      return () => {
        socket.off('telemetry:update', handleTelemetryUpdate)
      }
    }
  }, [socket, deviceId, metric])

  const fetchInitialData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/telemetry/device/${deviceId}?metric=${metric}&hours=1&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setData(response.data.reverse()) // Reverse to show chronological order
    } catch (error) {
      console.error('Failed to fetch telemetry data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize last update time to prevent unnecessary recalculations
  const lastUpdateTime = useMemo(() => {
    return data.length > 0 ? format(new Date(data[data.length - 1].createdAt), 'HH:mm:ss') : 'Never'
  }, [data])

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{metric} ({unit})</span>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p>No data available</p>
            <p className="text-sm">Waiting for telemetry data...</p>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="createdAt" 
                tickFormatter={formatXAxis}
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
                tickFormatter={(value) => `${value}${unit}`}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={formatTooltipLabel}
                contentStyle={tooltipStyle}
                wrapperClassName="dark:[&_.recharts-tooltip-wrapper]:!bg-gray-800 dark:[&_.recharts-tooltip-wrapper]:!border-gray-600 dark:[&_.recharts-tooltip-wrapper]:!text-gray-100"
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {lastUpdateTime}
      </div>
    </div>
  )
}