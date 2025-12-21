import { useEffect } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { subscribeToTransactions } from '@/lib/financeApi'
import { calculateFinanceChallengeProgress } from '@/lib/financeChallengeUtils'
import { updateChallenge } from '@/lib/firestore'
import type { FinanceTransaction } from '@/types/finance'
import type { Challenge } from '@/types'

/**
 * Hook to automatically update finance challenge progress when transactions change
 */
export function useFinanceChallengeUpdater() {
  const { user, activeChallenges, addXP } = useFirestoreStore()

  useEffect(() => {
    if (!user?.id) return

    // Find all active finance challenges the user is participating in
    const financeChallenges = activeChallenges.filter(
      (challenge) =>
        challenge.type === 'finance' &&
        challenge.financeGoalType &&
        challenge.participants.includes(user.id) &&
        challenge.isActive
    )

    if (financeChallenges.length === 0) return

    // Debounce updates to avoid too frequent calculations
    let updateTimeout: NodeJS.Timeout | null = null
    let lastTransactions: FinanceTransaction[] = []
    let lastTransactionsHash = ''

    // Subscribe to transactions with debouncing
    const unsubscribe = subscribeToTransactions(
      user.id,
      (transactions: FinanceTransaction[]) => {
        // Simple hash to detect if transactions actually changed
        const newHash = transactions.length > 0 
          ? `${transactions.length}-${transactions[0]?.id || ''}-${transactions[transactions.length - 1]?.id || ''}`
          : 'empty'
        
        // Skip if data hasn't changed
        if (newHash === lastTransactionsHash) return
        
        lastTransactions = transactions
        lastTransactionsHash = newHash

        // Debounce updates (wait 2 seconds after last transaction update)
        if (updateTimeout) {
          clearTimeout(updateTimeout)
        }

        updateTimeout = setTimeout(async () => {
          // Update each finance challenge
          for (const challenge of financeChallenges) {
            const newProgress = calculateFinanceChallengeProgress(
              challenge,
              transactions,
              user.id
            )

            const currentProgress = challenge.progress?.[user.id] || 0

            // Only update if progress changed significantly (avoid unnecessary updates)
            if (Math.abs(newProgress - currentProgress) >= 1) {
              const updatedProgress = {
                ...(challenge.progress || {}),
                [user.id]: newProgress,
              }

              // Check if challenge is completed (100% progress)
              if (newProgress >= 100 && currentProgress < 100) {
                // Challenge completed! Award XP
                await addXP(challenge.xpReward)
                console.log(`🎉 Finance challenge "${challenge.title}" completed! +${challenge.xpReward} XP`)
              }

              // Update challenge progress
              await updateChallenge(challenge.id, {
                progress: updatedProgress,
              })
            }
          }
        }, 2000) // Wait 2 seconds after data change before updating
      },
      { limitCount: 0 } // Load all transactions for accurate calculation
    )

    return () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      unsubscribe()
    }
  }, [user?.id, activeChallenges, addXP])
}

