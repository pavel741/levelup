'use client'

import { useEffect, useRef } from 'react'
export const dynamic = 'force-dynamic'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import Dashboard from '@/components/Dashboard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import AuthGuard from '@/components/AuthGuard'

export default function Home() {
  const { user, habits, challenges, addHabit } = useFirestoreStore()
  const initialized = useRef(false)

  useEffect(() => {
    // Initialize with sample data (only once, even in Strict Mode)
    if (!initialized.current && habits.length === 0 && user) {
      initialized.current = true
      
      const sampleHabits = [
        {
          id: Date.now().toString(),
          userId: user.id,
          name: 'Morning Exercise',
          description: '30 minutes of exercise',
          icon: '💪',
          color: 'bg-blue-500',
          frequency: 'daily' as const,
          targetDays: [1, 2, 3, 4, 5, 6, 7],
          xpReward: 50,
          completedDates: [],
          createdAt: new Date(),
          isActive: true,
        },
        {
          id: (Date.now() + 1).toString(),
          userId: user.id,
          name: 'Meditation',
          description: '10 minutes of mindfulness',
          icon: '🧘',
          color: 'bg-purple-500',
          frequency: 'daily' as const,
          targetDays: [1, 2, 3, 4, 5, 6, 7],
          xpReward: 30,
          completedDates: [],
          createdAt: new Date(),
          isActive: true,
        },
        {
          id: (Date.now() + 2).toString(),
          userId: user.id,
          name: 'Drink Water',
          description: 'Drink 8 glasses of water',
          icon: '💧',
          color: 'bg-cyan-500',
          frequency: 'daily' as const,
          targetDays: [1, 2, 3, 4, 5, 6, 7],
          xpReward: 20,
          completedDates: [],
          createdAt: new Date(),
          isActive: true,
        },
      ]

      sampleHabits.forEach((habit) => {
        addHabit(habit)
      })
    }

    // Challenges are loaded from Firestore automatically
  }, [habits.length, user, challenges.length, addHabit])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Dashboard />
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

