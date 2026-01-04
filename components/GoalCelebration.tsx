'use client'

import { useEffect, useState } from 'react'
import { Goal } from '@/types'
import { Target, Trophy, Sparkles } from 'lucide-react'

interface GoalCelebrationProps {
  goal: Goal
  onClose: () => void
}

const categoryEmojis = {
  health: '💚',
  finance: '💰',
  career: '💼',
  personal: '🌟',
  fitness: '💪',
  learning: '📚',
  other: '🎯',
}

export default function GoalCelebration({ goal, onClose }: GoalCelebrationProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    setShowAnimation(true)
  }, [])

  const categoryEmoji = categoryEmojis[goal.category] || '🎯'
  const progressPercentage = Math.round(goal.progressPercentage)

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-2xl transform transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="text-center">
          {/* Confetti Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
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

          {/* Goal Icon */}
          <div className="mb-4 transform animate-bounce">
            <div className="text-6xl sm:text-8xl">{categoryEmoji}</div>
          </div>

          {/* Badge */}
          <div className="mb-4">
            <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-semibold">
              Goal Achieved! 🎉
            </span>
          </div>

          {/* Goal Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 px-2">{goal.title}</h2>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 text-white/90">
              <Target className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {goal.currentValue} / {goal.targetValue} {goal.unit}
              </span>
            </div>
            <div className="mt-2 text-white/80 text-sm">
              {progressPercentage}% Complete
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-white/90 mb-6 text-sm sm:text-base px-2">{goal.description}</p>
          )}

          {/* Trophy Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-12 h-12 text-white animate-pulse" />
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-spin" />
            </div>
          </div>

          {/* Milestones Completed */}
          {goal.milestones && goal.milestones.length > 0 && (
            <div className="mb-4 text-white/80 text-sm">
              {goal.milestones.filter(m => m.isCompleted).length} / {goal.milestones.length} milestones completed
            </div>
          )}

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

