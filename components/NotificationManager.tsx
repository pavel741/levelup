'use client'

import { useEffect, useRef } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { useGoalsStore } from '@/store/useGoalsStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { requestNotificationPermission, shouldShowReminder, showNotification } from '@/lib/notifications'
import { format, differenceInDays, isPast, getDay } from 'date-fns'

export default function NotificationManager() {
  const { habits, user, updateHabit } = useFirestoreStore()
  const { goals } = useGoalsStore()
  const { routines } = useWorkoutStore()
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckRef = useRef<string>('')
  const goalRemindersSentRef = useRef<Set<string>>(new Set())
  const workoutRemindersSentRef = useRef<Set<string>>(new Set())

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

  // Check for goal reminders
  useEffect(() => {
    const checkGoalReminders = () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = new Date()

      goals.forEach((goal) => {
        if (goal.status !== 'active' || !goal.deadline) return

        const deadline = new Date(goal.deadline)
        const daysUntilDeadline = differenceInDays(deadline, now)
        const reminderKey = `goal-${goal.id}-${today}`

        // Skip if already reminded today
        if (goalRemindersSentRef.current.has(reminderKey)) return

        // Check if overdue
        if (isPast(deadline) && goal.progressPercentage < 100) {
          showNotification(`🎯 Goal Overdue: ${goal.title}`, {
            body: `Your goal "${goal.title}" deadline has passed. You're at ${Math.round(goal.progressPercentage)}% progress.`,
            tag: `goal-overdue-${goal.id}`,
          })
          goalRemindersSentRef.current.add(reminderKey)
        }
        // Check if deadline is approaching (7 days, 3 days, 1 day)
        else if (daysUntilDeadline === 7 || daysUntilDeadline === 3 || daysUntilDeadline === 1) {
          const progressText = goal.progressPercentage >= 100 
            ? 'Completed! 🎉' 
            : `${Math.round(goal.progressPercentage)}% complete`
          
          showNotification(`🎯 Goal Deadline Approaching: ${goal.title}`, {
            body: `${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''} left! ${progressText}`,
            tag: `goal-reminder-${goal.id}-${daysUntilDeadline}`,
          })
          goalRemindersSentRef.current.add(reminderKey)
        }
      })

      // Clean up old reminder keys (keep only today's)
      const todayKeys = Array.from(goalRemindersSentRef.current).filter(key => key.includes(today))
      goalRemindersSentRef.current = new Set(todayKeys)
    }

    // Check immediately
    checkGoalReminders()

    // Check every hour
    const interval = setInterval(checkGoalReminders, 3600000)
    
    return () => clearInterval(interval)
  }, [goals])

  // Check for workout reminders
  useEffect(() => {
    if (!user?.id || routines.length === 0) return

    const checkWorkoutReminders = () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = new Date()
      const dayOfWeek = getDay(now) // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Check each routine's schedule
      routines.forEach((routine) => {
        if (!routine.schedule?.enabled || !routine.schedule?.reminderEnabled) return
        if (!routine.schedule.workoutDays || routine.schedule.workoutDays.length === 0) return

        const reminderKey = `workout-${routine.id}-${today}`
        
        // Skip if already reminded today
        if (workoutRemindersSentRef.current.has(reminderKey)) return

        // Check if today is a workout day
        const isWorkoutDay = routine.schedule.workoutDays.includes(dayOfWeek)
        
        if (isWorkoutDay && routine.schedule.reminderTime) {
          const [hours, minutes] = routine.schedule.reminderTime.split(':').map(Number)
          const currentHour = now.getHours()
          const currentMinutes = now.getMinutes()

          // Check if it's time for reminder (within the reminder hour)
          if (currentHour === hours && currentMinutes >= minutes && currentMinutes < minutes + 30) {
            showNotification(`💪 Workout Reminder: ${routine.name}`, {
              body: `Time for your ${routine.name} workout! Estimated duration: ${routine.estimatedDuration} minutes.`,
              tag: `workout-reminder-${routine.id}`,
            })
            workoutRemindersSentRef.current.add(reminderKey)
          }
        }
        // Check for rest day reminders
        else if (!isWorkoutDay && routine.schedule.restDayReminders) {
          // Remind once per day on rest days (at 9 AM)
          if (now.getHours() === 9 && now.getMinutes() < 30) {
            showNotification(`🧘 Rest Day Reminder`, {
              body: `Today is a rest day for "${routine.name}". Take it easy and recover!`,
              tag: `rest-day-${routine.id}-${today}`,
            })
            workoutRemindersSentRef.current.add(reminderKey)
          }
        }
      })

      // Clean up old reminder keys
      const todayKeys = Array.from(workoutRemindersSentRef.current).filter(key => key.includes(today))
      workoutRemindersSentRef.current = new Set(todayKeys)
    }

    // Check immediately
    checkWorkoutReminders()

    // Check every 30 minutes for workout reminders (more frequent than goals)
    const interval = setInterval(checkWorkoutReminders, 1800000)
    
    return () => clearInterval(interval)
  }, [user?.id, routines])

  return null // This component doesn't render anything
}

