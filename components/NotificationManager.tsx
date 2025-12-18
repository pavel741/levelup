'use client'

import { useEffect, useRef } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { requestNotificationPermission, shouldShowReminder, showNotification } from '@/lib/notifications'
import { format } from 'date-fns'

export default function NotificationManager() {
  const { habits, user, updateHabit } = useFirestoreStore()
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckRef = useRef<string>('')

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission()

    // Check for reminders every minute
    const checkReminders = () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      // Only check once per day
      if (lastCheckRef.current === today) return
      lastCheckRef.current = today

      habits.forEach((habit) => {
        if (!habit.reminderEnabled || !habit.reminderTime || !habit.isActive) return

        const lastReminder = habit.lastReminderDate
        if (shouldShowReminder(habit.reminderTime, lastReminder)) {
          // Check if habit is already completed today
          const isCompleted = habit.completedDates.includes(today)
          
          if (!isCompleted) {
            showNotification(`${habit.icon} ${habit.name}`, {
              body: `Don't forget to complete "${habit.name}" today!`,
              tag: `habit-${habit.id}`,
            })

            // Update last reminder date
            updateHabit(habit.id, { lastReminderDate: today })
          }
        }
      })
    }

    // Check immediately
    checkReminders()

    // Then check every minute
    checkIntervalRef.current = setInterval(checkReminders, 60000)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [habits, updateHabit])

  // Check for streak reminders
  useEffect(() => {
    if (!user || user.streak === 0) return

    const checkStreakReminder = () => {
      const now = new Date()
      const hour = now.getHours()
      
      // Check at 8 PM if user hasn't completed any habits today
      if (hour === 20) {
        const today = format(now, 'yyyy-MM-dd')
        const hasCompletedToday = habits.some((h) => h.completedDates.includes(today))
        
        if (!hasCompletedToday && user.streak > 0) {
          showNotification('🔥 Don\'t Break Your Streak!', {
            body: `You have a ${user.streak}-day streak! Complete a habit today to keep it going.`,
            tag: 'streak-reminder',
          })
        }
      }
    }

    // Check every hour
    const interval = setInterval(checkStreakReminder, 3600000)
    
    return () => clearInterval(interval)
  }, [user, habits])

  return null // This component doesn't render anything
}

