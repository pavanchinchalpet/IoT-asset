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
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'Online Devices',
      value: stats.online,
      icon: Wifi,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      name: 'Offline Devices',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      name: 'Data Points',
      value: stats.telemetryCount.toLocaleString(),
      icon: BarChart3,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
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
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {card.name}
                </dt>
                <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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