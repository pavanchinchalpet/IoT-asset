'use client'

import { Cpu, Wifi, WifiOff, BarChart3 } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    total: number
    online: number
    offline: number
    telemetryCount: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      name: 'Total Devices',
      value: stats.total,
      icon: Cpu,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      name: 'Online Devices',
      value: stats.online,
      icon: Wifi,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      name: 'Offline Devices',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50'
    },
    {
      name: 'Data Points',
      value: stats.telemetryCount.toLocaleString(),
      icon: BarChart3,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.name} className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {card.name}
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {card.value}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}