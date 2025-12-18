'use client'

import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Trophy, Users, Clock } from 'lucide-react'
import { Challenge } from '@/types'
import { format, differenceInDays } from 'date-fns'

interface ChallengeCardProps {
  challenge: Challenge
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { user, joinChallenge } = useFirestoreStore()
  const isParticipating = challenge.participants.includes(user?.id || '')
  const daysRemaining = differenceInDays(challenge.endDate, new Date())

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className={`w-5 h-5 ${
              challenge.difficulty === 'easy' ? 'text-green-600' :
              challenge.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
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
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{challenge.participants.length} participants</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{daysRemaining} days left</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Requirements:</p>
          <ul className="space-y-1">
            {challenge.requirements.map((req, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
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

