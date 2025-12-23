'use client'

import { useEffect, useState } from 'react'
import { Achievement } from '@/types'
import { Trophy } from 'lucide-react'

interface AchievementCelebrationProps {
  achievement: Achievement
  onClose: () => void
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 via-orange-400 to-yellow-600',
}

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

export default function AchievementCelebration({ achievement, onClose }: AchievementCelebrationProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    setShowAnimation(true)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-gradient-to-br ${rarityColors[achievement.rarity]} rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-2xl transform transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="text-center">
          {/* Confetti Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Achievement Icon */}
          <div className="mb-4 transform animate-bounce">
            <div className="text-6xl sm:text-8xl">{achievement.icon}</div>
          </div>

          {/* Badge */}
          <div className="mb-4">
            <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-semibold">
              {rarityLabels[achievement.rarity]} Achievement Unlocked!
            </span>
          </div>

          {/* Achievement Name */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 px-2">{achievement.name}</h2>

          {/* Description */}
          <p className="text-white/90 mb-6 text-sm sm:text-base px-2">{achievement.description}</p>

          {/* Trophy Icon */}
          <div className="flex justify-center mb-4">
            <Trophy className="w-12 h-12 text-white animate-pulse" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  )
}

