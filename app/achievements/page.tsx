'use client'

import { useEffect, useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements'
import { Trophy, Lock, CheckCircle2 } from 'lucide-react'
import { Achievement, User } from '@/types'
import AchievementCelebration from '@/components/AchievementCelebration'
import { useLanguage } from '@/components/common/LanguageProvider'

const rarityColors = {
  common: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
  rare: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700',
  epic: 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700',
  legendary: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700',
}

export default function AchievementsPage() {
  const { user, habits, checkAchievements, newAchievements, showAchievementCelebration } = useFirestoreStore()
  const { t } = useLanguage()
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getRarityLabel = (rarity: keyof typeof rarityColors) => {
    return t(`achievements.${rarity}`)
  }

  useEffect(() => {
    if (user) {
      checkAchievements()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.streak, user?.level, user?.xp])

  useEffect(() => {
    if (newAchievements.length > 0) {
      const unlocked = newAchievements.filter((a) => a.unlockedAt)
      if (unlocked.length > 0) {
        setCelebratingAchievement(unlocked[0])
        setShowCelebration(true)
        // Clear after a delay
        setTimeout(() => {
          showAchievementCelebration([])
        }, 6000)
      }
    }
  }, [newAchievements, showAchievementCelebration])

  const userAchievements = user?.achievements || []
  const achievementMap = new Map(userAchievements.map((a) => [a.id, a]))

  const allAchievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const userAchievement = achievementMap.get(def.id)
    const defaultProgress = user ? def.checkProgress(user, habits, [], []) : { progress: 0, target: def.checkProgress({ streak: 0, level: 0, xp: 0 } as User, [], [], []).target, completed: false }
    return {
      ...def,
      progress: userAchievement?.progress ?? defaultProgress.progress,
      target: userAchievement?.target ?? defaultProgress.target,
      unlocked: !!userAchievement?.unlockedAt,
      unlockedAt: userAchievement?.unlockedAt,
    }
  })

  const unlockedAchievements = allAchievements.filter((a) => a.unlocked)
  const lockedAchievements = allAchievements.filter((a) => !a.unlocked)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('achievements.achievements')}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {unlockedAchievements.length} {t('achievements.of')} {allAchievements.length} {t('achievements.achievementsUnlocked')}
                  </p>
                </div>

                {/* Progress Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('achievements.overallProgress')}</h2>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round((unlockedAchievements.length / allAchievements.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(unlockedAchievements.length / allAchievements.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Unlocked Achievements */}
                {unlockedAchievements.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                      {t('achievements.unlocked')} ({unlockedAchievements.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unlockedAchievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`${rarityColors[achievement.rarity]} rounded-xl p-6 border-2 shadow-sm relative overflow-hidden`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-4xl">{achievement.icon}</div>
                            <div className="text-right">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                achievement.rarity === 'legendary' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                                achievement.rarity === 'epic' ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200' :
                                achievement.rarity === 'rare' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' :
                                'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}>
                                {getRarityLabel(achievement.rarity)}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{achievement.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{achievement.description}</p>
                          {achievement.unlockedAt && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              {t('achievements.unlockedAt')} {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locked Achievements */}
                {lockedAchievements.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      {t('achievements.locked')} ({lockedAchievements.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lockedAchievements.map((achievement) => {
                        const progressPercent = (achievement.progress / achievement.target) * 100
                        return (
                          <div
                            key={achievement.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm opacity-75 relative overflow-hidden"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-4xl grayscale opacity-50">{achievement.icon}</div>
                              <div className="text-right">
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                  {getRarityLabel(achievement.rarity)}
                                </span>
                              </div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{achievement.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{achievement.description}</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>{t('achievements.progress')}</span>
                                <span>
                                  {achievement.progress} / {achievement.target}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

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
    </AuthGuard>
  )
}

