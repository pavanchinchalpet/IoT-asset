'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Cpu, 
  BarChart3, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Devices', href: '/dashboard/devices', icon: Cpu },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-gray-900">
            IoT Dashboard
          </h1>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
          {connected ? (
            <>
              <Wifi className="h-4 w-4 text-success-600" />
              <span className="text-sm text-success-700">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-danger-600" />
              <span className="text-sm text-danger-700">Disconnected</span>
            </>
          )}
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={clsx(
                        pathname === item.href
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className={clsx(
                          pathname === item.href ? 'text-primary-700' : 'text-gray-400 group-hover:text-primary-700',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            <li className="mt-auto">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role.toLowerCase()}</p>
                  </div>
                </div>
                
                <button
                  onClick={logout}
                  className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-danger-700"
                >
                  <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-danger-700" />
                  Sign out
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}