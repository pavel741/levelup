'use client'

import { useFirestoreStore } from '@/store/useFirestoreStore'
import { format } from 'date-fns'
import { CheckCircle2, Circle } from 'lucide-react'
import { Habit } from '@/types'

interface HabitCardProps {
  habit: Habit
}

export default function HabitCard({ habit }: HabitCardProps) {
  const { completeHabit } = useFirestoreStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const isCompleted = habit.completedDates.includes(today)

  const handleToggle = () => {
    if (!isCompleted) {
      completeHabit(habit.id)
    }
  }

  const completionRate = habit.completedDates.length / 7 // Last 7 days
  const streak = calculateStreak(habit.completedDates)

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${habit.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
            {habit.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{habit.name}</h3>
            <p className="text-sm text-gray-500">{habit.description}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`p-2 rounded-lg transition-colors ${
            isCompleted
              ? 'text-green-600 bg-green-50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Streak</span>
          <span className="font-semibold text-orange-600">🔥 {streak} days</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">XP Reward</span>
          <span className="font-semibold text-blue-600">+{habit.xpReward} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(completionRate * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const sorted = [...completedDates].sort().reverse()
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sorted.length; i++) {
    const date = new Date(sorted[i])
    date.setHours(0, 0, 0, 0)
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)

    if (format(date, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
      streak++
    } else {
      break
    }
  }

  return streak
}

