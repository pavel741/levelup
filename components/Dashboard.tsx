'use client'

import { useFirestoreStore } from '@/store/useFirestoreStore'
import { format } from 'date-fns'
import { TrendingUp, Target, Trophy, Shield, Flame, Award } from 'lucide-react'
import HabitCard from './HabitCard'
import ChallengeCard from './ChallengeCard'
import StatsCard from './StatsCard'

export default function Dashboard() {
  const { user, habits, activeChallenges, dailyStats } = useFirestoreStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayStats = dailyStats.find((s) => s.date === today) || {
    date: today,
    habitsCompleted: 0,
    xpEarned: 0,
    challengesCompleted: 0,
    distractionsBlocked: 0,
  }

  const activeHabits = habits.filter((h) => h.isActive)
  const completedToday = activeHabits.filter((h) =>
    h.completedDates.includes(today)
  ).length

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white dark:from-blue-700 dark:to-purple-700">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-blue-100 dark:text-blue-200 text-lg">
          Ready to level up today? You're on a {user?.streak} day streak! 🔥
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Target}
          title="Habits Completed"
          value={`${completedToday}/${activeHabits.length}`}
          subtitle="Today"
          color="blue"
        />
        <StatsCard
          icon={TrendingUp}
          title="XP Earned"
          value={todayStats.xpEarned.toString()}
          subtitle="Today"
          color="purple"
        />
        <StatsCard
          icon={Flame}
          title="Current Streak"
          value={`${user?.streak} days`}
          subtitle="Keep it up!"
          color="orange"
        />
        <StatsCard
          icon={Award}
          title="Level"
          value={user?.level.toString() || '1'}
          subtitle={`${user?.xp} total XP`}
          color="green"
        />
      </div>

      {/* Habits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Habits</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            + Add Habit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeHabits.length > 0 ? (
            activeHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No habits yet. Create your first habit to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Challenges Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Challenges</h2>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeChallenges.length > 0 ? (
            activeChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active challenges. Join one to earn bonus XP!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

