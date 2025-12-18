'use client'

import { useState } from 'react'
export const dynamic = 'force-dynamic'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Shield, Plus, X, Clock } from 'lucide-react'

export default function FocusPage() {
  const { blockedSites, blockSite, unblockSite } = useFirestoreStore()
  const [newSite, setNewSite] = useState('')
  const [focusModeActive, setFocusModeActive] = useState(false)

  const handleBlockSite = () => {
    if (newSite.trim()) {
      blockSite(newSite.trim())
      setNewSite('')
    }
  }

  const commonSites = [
    { name: 'Facebook', domain: 'facebook.com' },
    { name: 'Twitter', domain: 'twitter.com' },
    { name: 'Instagram', domain: 'instagram.com' },
    { name: 'Reddit', domain: 'reddit.com' },
    { name: 'YouTube', domain: 'youtube.com' },
    { name: 'TikTok', domain: 'tiktok.com' },
  ]

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Focus Mode</h1>
                <p className="text-gray-600">Block distracting websites and stay focused on your goals</p>
              </div>

              {/* Focus Mode Toggle */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${focusModeActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Shield className={`w-6 h-6 ${focusModeActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Focus Mode</h2>
                      <p className="text-sm text-gray-600">
                        {focusModeActive
                          ? 'Distractions are blocked. Stay focused!'
                          : 'Enable to block distracting websites'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFocusModeActive(!focusModeActive)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      focusModeActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        focusModeActive ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Add Site */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Block a Website</h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBlockSite()}
                    placeholder="e.g., facebook.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleBlockSite}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Block
                  </button>
                </div>

                {/* Common Sites */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Quick add:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonSites.map((site) => (
                      <button
                        key={site.domain}
                        onClick={() => {
                          setNewSite(site.domain)
                          setTimeout(() => handleBlockSite(), 100)
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {site.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blocked Sites List */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Blocked Websites</h2>
                {blockedSites.length > 0 ? (
                  <div className="space-y-3">
                    {blockedSites.map((block) => (
                      <div
                        key={block.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-gray-900">{block.site}</span>
                          {block.blockedUntil && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Until {block.blockedUntil.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => unblockSite(block.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No blocked sites yet. Add websites to block distractions!</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      </div>
    </AuthGuard>
  )
}

