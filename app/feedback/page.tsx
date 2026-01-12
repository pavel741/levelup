'use client'

import { useState } from 'react'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { MessageCircle, Send } from 'lucide-react'
import { useLanguage } from '@/components/common/LanguageProvider'

export default function FeedbackPage() {
  const { user } = useFirestoreStore()
  const { t } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [category, setCategory] = useState('Idea')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [name, setName] = useState(user?.name || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    if (!message.trim() || message.trim().length < 5) {
      setErrorMessage(t('feedback.shareAtLeast'))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          message,
          email: email.trim(),
          name: name.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || t('feedback.somethingWentWrong'))
        return
      }

      setSuccessMessage(t('feedback.thanksForSuggestion'))
      setMessage('')
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setErrorMessage(t('feedback.networkError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('feedback.feedbackSuggestions')}</h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('feedback.tellUsBetter')}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('feedback.yourName')}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder={t('common.name')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('feedback.emailOptional')}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder={t('common.email')}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('feedback.emailNote')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('feedback.category')}
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="Idea">{t('feedback.newIdea')}</option>
                          <option value="Improvement">{t('feedback.improvement')}</option>
                          <option value="Bug">{t('feedback.bug')}</option>
                          <option value="Other">{t('feedback.other')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('feedback.yourSuggestion')}
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[140px] text-sm"
                        placeholder={t('feedback.suggestionPlaceholder')}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('feedback.suggestionNote')}
                      </p>
                    </div>

                    {errorMessage && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                    )}
                    {successMessage && (
                      <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? t('common.sending') : t('feedback.sendFeedback')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}


