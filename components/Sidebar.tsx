'use client'

import { Home, Target, Trophy, Settings, BarChart3, Award, Wallet, X } from 'lucide-react'
import Link from 'next/link'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user } = useFirestoreStore()
  const pathname = usePathname()

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Target, label: 'Habits', href: '/habits' },
    { icon: Trophy, label: 'Challenges', href: '/challenges' },
    { icon: BarChart3, label: 'Statistics', href: '/statistics' },
    { icon: Wallet, label: 'Finance', href: '/finance' },
    { icon: Award, label: 'Achievements', href: '/achievements' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (onClose && window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg 
          border-r border-gray-200 dark:border-gray-700 
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LevelUp
          </h1>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LevelUp
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Level Up Life</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg 
                  transition-colors
                  ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Level {user.level}</span>
                <span className="text-xs opacity-90">{user.xp} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{
                    width: `${Math.min((user.xp / (user.xp + user.xpToNextLevel)) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>🔥 {user.streak} day streak</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

