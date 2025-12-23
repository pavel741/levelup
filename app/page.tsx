'use client'

import { useEffect, useRef, useState } from 'react'
export const dynamic = 'force-dynamic'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import Dashboard from '@/components/layout/Dashboard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/common/AuthGuard'
import AchievementCelebration from '@/components/AchievementCelebration'
import { Achievement } from '@/types'

export default function Home() {
  const { user, newAchievements, showAchievementCelebration } = useFirestoreStore()
  const initialized = useRef(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (newAchievements.length > 0) {
      const unlocked = newAchievements.filter((a) => a.unlockedAt)
      if (unlocked.length > 0) {
        setCelebratingAchievement(unlocked[0])
        setShowCelebration(true)
        // Clear after showing
        setTimeout(() => {
          showAchievementCelebration([])
        }, 6000)
      }
    }
  }, [newAchievements, showAchievementCelebration])

  useEffect(() => {
    // Mark as initialized to prevent any automatic initialization
    if (!initialized.current && user) {
      initialized.current = true
    }
  }, [user])

  return (
    <>
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="flex h-screen overflow-hidden">
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
              <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <Dashboard />
              </main>
            </div>
          </div>
        </div>
      </AuthGuard>

      {/* Achievement Celebration Modal */}
      {showCelebration && celebratingAchievement && (
        <AchievementCelebration
          achievement={celebratingAchievement}
          onClose={() => {
            setShowCelebration(false)
            setCelebratingAchievement(null)
          }}
        />
      )}
    </>
  )
}

