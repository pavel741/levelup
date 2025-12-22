import { useEffect } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { subscribeToWorkoutLogs } from '@/lib/workoutApi'
import { calculateWorkoutChallengeProgress } from '@/lib/workoutChallengeUtils'
import { updateChallenge } from '@/lib/firestore'
import type { WorkoutLog } from '@/types/workout'
import type { Challenge } from '@/types'

/**
 * Hook to automatically update workout challenge progress when workout logs change
 */
export function useWorkoutChallengeUpdater() {
  const { user, activeChallenges, addXP } = useFirestoreStore()

  useEffect(() => {
    if (!user?.id) return

    // Find all active workout challenges the user is participating in
    const workoutChallenges = activeChallenges.filter(
      (challenge) =>
        challenge.type === 'workout' &&
        challenge.workoutGoalType &&
        challenge.participants.includes(user.id) &&
        challenge.isActive
    )

    if (workoutChallenges.length === 0) return

    // Debounce updates to avoid too frequent calculations
    let updateTimeout: NodeJS.Timeout | null = null

    let lastLogsHash = ''

    // Subscribe to workout logs with debouncing
    const unsubscribe = subscribeToWorkoutLogs(
      user.id,
      (logs: WorkoutLog[]) => {
        // Simple hash to detect if logs actually changed
        const newHash = logs.length > 0
          ? `${logs.length}-${logs[logs.length - 1]?.id || ''}-${logs[logs.length - 1]?.date || ''}-${logs[logs.length - 1]?.endTime || ''}`
          : 'empty'

        if (newHash === lastLogsHash) return
        lastLogsHash = newHash

        // Clear existing timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout)
        }

        updateTimeout = setTimeout(async () => {
          // Update each workout challenge
          for (const challenge of workoutChallenges) {
            const newProgress = calculateWorkoutChallengeProgress(
              challenge,
              logs,
              user.id
            )

            const currentProgress = challenge.progress?.[user.id] || 0

            // Only update if progress changed (allow small changes for accuracy)
            if (Math.abs(newProgress - currentProgress) >= 0.01) {
              console.log(`📊 Updating workout challenge "${challenge.title}": ${currentProgress.toFixed(2)}% → ${newProgress.toFixed(2)}%`)
              
              const updatedProgress = {
                ...(challenge.progress || {}),
                [user.id]: newProgress,
              }

              // Check if challenge is completed (100% progress)
              if (newProgress >= 100 && currentProgress < 100) {
                // Challenge completed! Award XP
                await addXP(challenge.xpReward)
                console.log(`🎉 Workout challenge "${challenge.title}" completed! +${challenge.xpReward} XP`)
              }

              // Update challenge progress
              await updateChallenge(challenge.id, {
                progress: updatedProgress,
              })
            }
          }
        }, 1000) // Wait 1 second after data change before updating
      }
    )

    return () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      unsubscribe()
    }
  }, [user?.id, activeChallenges, addXP])
}

