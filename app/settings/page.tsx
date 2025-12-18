'use client'

import { useState, useEffect } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { User, Bell, Shield, Moon, CheckCircle2 } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { requestNotificationPermission } from '@/lib/notifications'

export default function SettingsPage() {
  const { user, updateUserPreference } = useFirestoreStore()
  const { theme, toggleTheme } = useTheme()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [emailSummaryEnabled, setEmailSummaryEnabled] = useState(user?.emailSummaryEnabled || false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setEmailSummaryEnabled(user.emailSummaryEnabled || false)
    }
  }, [user])

  const handleToggleEmailSummary = async () => {
    if (!user) return
    
    setIsUpdatingEmail(true)
    try {
      const newValue = !emailSummaryEnabled
      setEmailSummaryEnabled(newValue)
      await updateUserPreference('emailSummaryEnabled', newValue)
    } catch (error) {
      console.error('Error updating email preference:', error)
      setEmailSummaryEnabled(!emailSummaryEnabled) // Revert on error
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission()
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
              </div>

              {/* Profile Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Browser Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notificationPermission === 'granted'
                          ? 'Notifications are enabled'
                          : notificationPermission === 'denied'
                          ? 'Notifications are blocked. Please enable them in your browser settings.'
                          : 'Enable browser notifications for habit reminders'}
                      </p>
                    </div>
                    {notificationPermission === 'granted' ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Enabled</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestNotificationPermission}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        disabled={notificationPermission === 'denied'}
                      >
                        {notificationPermission === 'denied' ? 'Blocked' : 'Enable'}
                      </button>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notification Types</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Daily habit reminders (set per habit)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Streak reminders at 8 PM if no habits completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Weekly progress summary (coming soon)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Summary</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Progress Summary</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive a weekly email every Monday with your progress summary
                      </p>
                    </div>
                    <button
                      onClick={handleToggleEmailSummary}
                      disabled={isUpdatingEmail || !user}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        emailSummaryEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      } ${isUpdatingEmail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          emailSummaryEnabled ? 'right-1' : 'left-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                  {emailSummaryEnabled ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Weekly emails enabled. Next email will be sent on Monday.</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable to receive weekly progress summaries via email
                    </p>
                  )}
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy & Security</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Public Profile</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to see your progress</p>
                    </div>
                    <button className="relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full">
                      <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Leaderboard Visibility</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Show your rank on the leaderboard</p>
                    </div>
                    <button className="relative w-12 h-6 bg-blue-500 rounded-full">
                      <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Switch to dark theme</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          theme === 'dark' ? 'right-1' : 'left-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      </div>
    </AuthGuard>
  )
}

