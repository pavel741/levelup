'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Trophy, Target, Award, X, Wallet, Dumbbell, Flag } from 'lucide-react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notificationsApi'
import { formatDistanceToNow } from 'date-fns'
import { createSmartPoll } from '@/lib/utils/smart-polling'
import type { AppNotification } from '@/lib/notificationsMongo'

export default function NotificationsDropdown() {
  const { user } = useFirestoreStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user?.id) return

    setIsLoading(true)

    const hashData = (data: { notifications: AppNotification[]; unreadCount: number }): string => {
      if (data.notifications.length === 0) return 'empty'
      return `${data.notifications.length}-${data.unreadCount}-${data.notifications[0]?.id || ''}`
    }

    const fetchNotificationsFn = async (): Promise<{ notifications: AppNotification[]; unreadCount: number }> => {
      return getNotifications(user.id, { limit: 50 })
    }

    // Subscribe with smart polling
    unsubscribeRef.current = createSmartPoll(
      fetchNotificationsFn,
      (data) => {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
        setIsLoading(false)
      },
      {
        activeInterval: 30000, // 30 seconds when active
        idleInterval: 120000, // 2 minutes when idle
        hiddenInterval: 300000, // 5 minutes when tab hidden
        idleThreshold: 60000, // 1 minute idle threshold
        hashFn: hashData,
        initialData: { notifications: [], unreadCount: 0 },
      }
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [user?.id])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-500" />
      case 'challenge':
        return <Trophy className="w-5 h-5 text-purple-500" />
      case 'goal':
        return <Flag className="w-5 h-5 text-blue-500" />
      case 'habit':
        return <Target className="w-5 h-5 text-green-500" />
      case 'workout':
        return <Dumbbell className="w-5 h-5 text-orange-500" />
      case 'bill':
        return <Wallet className="w-5 h-5 text-red-500" />
      case 'streak':
        return <Target className="w-5 h-5 text-blue-500" />
      case 'system':
        return <Bell className="w-5 h-5 text-gray-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const handleMarkAsRead = async (id: string) => {
    if (!user?.id) return
    try {
      await markNotificationAsRead(user.id, id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.id) return
    try {
      await deleteNotification(user.id, id)
      const deleted = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (deleted && !deleted.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative group ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {notification.actionLabel && (
                          <span className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {notification.actionLabel} →
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                          title="Delete notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

