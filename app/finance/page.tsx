'use client'

import { useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Wallet, ExternalLink } from 'lucide-react'

export default function FinancePage() {
  const { user } = useFirestoreStore()
  const [iframeError, setIframeError] = useState(false)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Tracker</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Track your income, expenses, and budget goals</p>
                  </div>
                  <a
                    href="https://budgeting-93adb.web.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </a>
                </div>

                {/* Embedded Budget Tracker */}
                {!iframeError ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <iframe
                      src="https://budgeting-93adb.web.app/"
                      className="w-full h-[calc(100vh-200px)] min-h-[800px] border-0"
                      title="Budget Tracker"
                      allow="clipboard-read; clipboard-write"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                      onError={() => setIframeError(true)}
                    />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Unable to Load Finance Tracker
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      The finance tracker couldn't be embedded. Click the button above to open it in a new tab.
                    </p>
                    <a
                      href="https://budgeting-93adb.web.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open Finance Tracker
                    </a>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

