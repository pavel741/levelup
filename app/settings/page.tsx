'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { User, Bell, Shield, Moon, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/components/common/ThemeProvider'
import { requestNotificationPermission } from '@/lib/notifications'
import { showError, showSuccess } from '@/lib/utils'

export default function SettingsPage() {
  const { user, updateUserPreference, resetProgress } = useFirestoreStore()
  const { theme, toggleTheme } = useTheme()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [emailSummaryEnabled, setEmailSummaryEnabled] = useState(user?.emailSummaryEnabled || false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isResettingProgress, setIsResettingProgress] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setEmailSummaryEnabled(user.emailSummaryEnabled || false)
      setName(user.name || '')
      setAvatarUrl(user.avatar || '')
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
    await requestNotificationPermission()
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    const trimmedName = name.trim()
    if (!trimmedName) return
    const trimmedAvatar = avatarUrl.trim()

    setIsSavingProfile(true)
    try {
      await updateUserPreference('name', trimmedName)
      if (trimmedAvatar) {
        await updateUserPreference('avatar', trimmedAvatar)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleResetProgress = async () => {
    if (!user) return
    
    setIsResettingProgress(true)
    try {
      await resetProgress()
      setShowResetConfirm(false)
      showSuccess('Progress has been reset successfully!')
    } catch (error) {
      console.error('Error resetting progress:', error)
      showError(error, { component: 'SettingsPage', action: 'resetProgress' })
    } finally {
      setIsResettingProgress(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                <div className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                        <Image
                          src={avatarUrl}
                          alt={user?.name || 'User avatar'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profile picture URL
                      </label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/your-avatar.jpg"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Paste a public image URL (e.g. from GitHub, Gravatar, or another host). No upload to Firebase required.
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Email (read-only for now) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email changes require updating your Firebase Auth account; this field is read-only for now.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !user}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
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

              {/* Reset Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900">
                <div className="p-6 border-b border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reset Progress</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">Warning: This action cannot be undone</h3>
                        <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                          Resetting your progress will permanently delete:
                        </p>
                        <ul className="text-sm text-red-800 dark:text-red-300 space-y-1 list-disc list-inside mb-3">
                          <li>All XP earned (reset to 0)</li>
                          <li>All streaks (reset to 0)</li>
                          <li>All completed habit dates</li>
                          <li>All daily statistics</li>
                        </ul>
                        <p className="text-sm text-red-800 dark:text-red-300">
                          Your habits, challenges, and account settings will remain unchanged.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Reset Progress
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Are you sure you want to reset all progress? This cannot be undone.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleResetProgress}
                          disabled={isResettingProgress || !user}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isResettingProgress ? 'Resetting...' : 'Yes, Reset Everything'}
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          disabled={isResettingProgress}
                          className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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

