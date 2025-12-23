'use client'

import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Trophy, Users, Clock, Edit2, DollarSign, Link2, Trash2 } from 'lucide-react'
import { Challenge } from '@/types'
import { differenceInDays } from 'date-fns'
import { calculateFinanceChallengeProgress, getFinanceChallengeStatus } from '@/lib/financeChallengeUtils'
import { calculateWorkoutChallengeProgress, getWorkoutChallengeProgressText } from '@/lib/workoutChallengeUtils'
import { useEffect, useState } from 'react'
import { subscribeToTransactions } from '@/lib/financeApi'
import { subscribeToWorkoutLogs } from '@/lib/workoutApi'
import type { FinanceTransaction } from '@/types/finance'
import type { WorkoutLog } from '@/types/workout'

interface ChallengeCardProps {
  challenge: Challenge
  onEdit?: (challenge: Challenge) => void
  onDelete?: (challengeId: string) => void
}

export default function ChallengeCard({ challenge, onEdit, onDelete }: ChallengeCardProps) {
  const { user, joinChallenge, habits } = useFirestoreStore()
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const isParticipating = challenge.participants.includes(user?.id || '')
  const daysRemaining = differenceInDays(challenge.endDate, new Date())
  
  // Load finance transactions for finance challenges (only if participating)
  useEffect(() => {
    if (challenge.type === 'finance' && user?.id && isParticipating) {
      let lastHash = ''
      const unsubscribe = subscribeToTransactions(
        user.id,
        (txs) => {
          const newHash = txs.length > 0 
            ? `${txs.length}-${txs[0]?.id || ''}-${txs[txs.length - 1]?.id || ''}`
            : 'empty'
          if (newHash !== lastHash) {
            lastHash = newHash
            setFinanceTransactions(txs)
          }
        },
        { limitCount: 0 }
      )
      return () => unsubscribe()
    }
    return undefined
  }, [challenge.type, user?.id, isParticipating])

  // Load workout logs for workout challenges (only if participating)
  useEffect(() => {
    if (challenge.type === 'workout' && user?.id && isParticipating) {
      let lastHash = ''
      const unsubscribe = subscribeToWorkoutLogs(
        user.id,
        (logs) => {
          const newHash = logs.length > 0 
            ? `${logs.length}-${logs[0]?.id || ''}-${logs[logs.length - 1]?.id || ''}`
            : 'empty'
          if (newHash !== lastHash) {
            lastHash = newHash
            setWorkoutLogs(logs)
          }
        }
      )
      return () => unsubscribe()
    }
    return undefined
  }, [challenge.type, user?.id, isParticipating])

  // Calculate progress based on challenge type
  let userProgress = user ? (challenge.progress?.[user.id] || 0) : 0
  let progressPercentage = 0
  let isCompleted = false
  let progressLabel = ''

  if (challenge.type === 'finance' && challenge.financeGoalType) {
    // Finance challenge: progress is percentage-based
    userProgress = user ? calculateFinanceChallengeProgress(challenge, financeTransactions, user.id) : 0
    progressPercentage = userProgress
    isCompleted = userProgress >= 100
    progressLabel = getFinanceChallengeStatus(challenge, userProgress)
  } else if (challenge.type === 'workout' && challenge.workoutGoalType) {
    // Workout challenge: progress is percentage-based
    userProgress = user ? calculateWorkoutChallengeProgress(challenge, workoutLogs, user.id) : 0
    progressPercentage = userProgress
    isCompleted = userProgress >= 100
    progressLabel = user ? getWorkoutChallengeProgressText(challenge, workoutLogs, user.id) : '0%'
  } else {
    // Habit challenge: progress is days-based
    progressPercentage = Math.min((userProgress / challenge.duration) * 100, 100)
    isCompleted = userProgress >= challenge.duration
    progressLabel = `${userProgress} / ${challenge.duration} days`
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {challenge.type === 'finance' ? (
              <DollarSign className={`w-5 h-5 ${
                challenge.difficulty === 'easy' ? 'text-green-600' :
                challenge.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            ) : challenge.type === 'workout' ? (
              <Trophy className={`w-5 h-5 ${
                challenge.difficulty === 'easy' ? 'text-green-600' :
                challenge.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            ) : (
              <Trophy className={`w-5 h-5 ${
                challenge.difficulty === 'easy' ? 'text-green-600' :
                challenge.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white">{challenge.title}</h3>
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(challenge)}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Edit challenge"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${challenge.title}"? This action cannot be undone.`)) {
                      onDelete(challenge.id)
                    }
                  }}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete challenge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{challenge.description}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[challenge.difficulty]}`}>
              {challenge.difficulty}
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
              +{challenge.xpReward} XP
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {isParticipating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {progressLabel || `${userProgress} / ${challenge.duration} days`}
                {isCompleted && <span className="ml-2 text-green-600 dark:text-green-400">✓ Completed!</span>}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            {challenge.type === 'finance' && challenge.financeGoalType && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {challenge.financeGoalType === 'savings_rate' && `Target: ${challenge.financeTargetPercentage}% savings rate`}
                {challenge.financeGoalType === 'spending_limit' && `Target: €${challenge.financeTarget?.toLocaleString()} per ${challenge.financePeriod || 'period'}`}
                {challenge.financeGoalType === 'savings_amount' && `Target: Save €${challenge.financeTarget?.toLocaleString()}`}
                {challenge.financeGoalType === 'no_spend_days' && `Target: ${challenge.financeTarget} no-spend days`}
              </p>
            )}
            {challenge.type === 'workout' && challenge.workoutGoalType && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {challenge.workoutGoalType === 'workouts_completed' && `Target: ${challenge.workoutTarget} workouts`}
                {challenge.workoutGoalType === 'workouts_per_week' && `Target: ${challenge.workoutTargetPerWeek} workouts per week`}
                {challenge.workoutGoalType === 'routine_completed' && `Target: Complete routine ${challenge.workoutTarget} times`}
                {challenge.workoutGoalType === 'total_volume' && `Target: ${challenge.workoutTarget} kg total volume`}
                {challenge.workoutGoalType === 'streak' && `Target: ${challenge.workoutTarget} day workout streak`}
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{challenge.participants.length} participants</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{daysRemaining} days left</span>
          </div>
        </div>
        {challenge.type === 'finance' && (
          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            <Link2 className="w-3 h-3" />
            <span className="font-medium">Linked to your finances</span>
            <span className="text-gray-500 dark:text-gray-400">• Updates automatically</span>
          </div>
        )}
        {challenge.type === 'workout' && (
          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            <Link2 className="w-3 h-3" />
            <span className="font-medium">Linked to your workouts</span>
            <span className="text-gray-500 dark:text-gray-400">• Updates automatically</span>
          </div>
        )}
        {challenge.habitIds && challenge.habitIds.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Linked habits: </span>
            {challenge.habitIds.map((habitId, idx) => {
              const habit = habits.find(h => h.id === habitId)
              return habit ? (
                <span key={habitId}>
                  {habit.icon} {habit.name}
                  {idx < challenge.habitIds!.length - 1 && ', '}
                </span>
              ) : null
            })}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Requirements:</p>
          <ul className="space-y-1">
            {challenge.requirements.map((req, idx) => (
              <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        {!isParticipating ? (
          <button
            onClick={() => joinChallenge(challenge.id)}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
          >
            Join Challenge
          </button>
        ) : (
          <div className="w-full py-2 bg-green-50 text-green-700 rounded-lg text-center font-medium">
            ✓ Participating
          </div>
        )}
      </div>
    </div>
  )
}

