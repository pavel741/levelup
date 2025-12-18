'use client'

import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react'

export default function CommunityPage() {
  const { user } = useFirestoreStore()

  // Mock leaderboard data
  const leaderboard: Array<{
    rank: number
    name: string
    level: number
    xp: number
    streak: number
    isCurrentUser?: boolean
  }> = [
    { rank: 1, name: 'Alex Chen', level: 25, xp: 12500, streak: 45 },
    { rank: 2, name: 'Sarah Johnson', level: 23, xp: 11800, streak: 38 },
    { rank: 3, name: 'Mike Davis', level: 22, xp: 11200, streak: 42 },
    { rank: 4, name: user?.name || 'You', level: user?.level || 1, xp: user?.xp || 0, streak: user?.streak || 0, isCurrentUser: true },
    { rank: 5, name: 'Emma Wilson', level: 20, xp: 9800, streak: 30 },
    { rank: 6, name: 'David Brown', level: 19, xp: 9200, streak: 28 },
    { rank: 7, name: 'Lisa Anderson', level: 18, xp: 8800, streak: 35 },
    { rank: 8, name: 'Chris Taylor', level: 17, xp: 8200, streak: 25 },
  ]

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />
    return <span className="text-gray-400 font-bold">#{rank}</span>
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
                <p className="text-gray-600">See how you rank against other LevelUp users</p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">12,458</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Active Today</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">8,234</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Your Rank</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">#{leaderboard.find((l) => l.isCurrentUser)?.rank || 'N/A'}</p>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Global Leaderboard</h2>
                  <p className="text-sm text-gray-600 mt-1">Top performers this month</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                        entry.isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="w-10 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{entry.name}</span>
                          {entry.isCurrentUser && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Level {entry.level}</span>
                          <span>•</span>
                          <span>{entry.xp.toLocaleString()} XP</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span>🔥</span>
                            {entry.streak} days
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Features */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">Share Your Progress</h3>
                  <p className="text-blue-100 mb-4">Inspire others by sharing your achievements</p>
                  <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                    Share Now
                  </button>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">Join Challenges</h3>
                  <p className="text-purple-100 mb-4">Compete with friends and earn rewards</p>
                  <button className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium">
                    View Challenges
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      </div>
    </AuthGuard>
  )
}

