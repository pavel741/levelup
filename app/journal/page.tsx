'use client'

import { useState, useEffect } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { useJournalStore } from '@/store/useJournalStore'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { BookOpen, Plus, Search, Download, Heart, Smile, Edit, Trash2, X, Filter } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { JournalEntry } from '@/types'
import { useLanguage } from '@/components/common/LanguageProvider'

export default function JournalPage() {
  const { user, habits } = useFirestoreStore()
  const { t } = useLanguage()
  const {
    entries,
    isLoadingEntries,
    currentEntry,
    moodStats,
    filters,
    subscribeEntries,
    loadMoodStatistics,
    addEntry,
    updateEntry,
    deleteEntry,
    setCurrentEntry,
    setFilters,
    unsubscribe,
  } = useJournalStore()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [validationError, setValidationError] = useState<string>('')

  // Get prompts based on language
  const getJournalPrompts = (type: JournalEntry['type']): string[] => {
    const promptKeys = {
      daily: ['grateful', 'highlight', 'challenge', 'learned', 'grow', 'smile', 'differently'],
      gratitude: ['grateful', 'who', 'experience', 'opportunity', 'lesson'],
      reflection: ['thoughts', 'patterns', 'proud', 'letGo', 'forward'],
      weekly: ['highlights', 'challenges', 'learned', 'grow', 'grateful', 'differently', 'goals'],
      monthly: ['accomplishments', 'challenges', 'learned', 'grow', 'grateful', 'differently', 'goals'],
    }
    return promptKeys[type].map(key => t(`journal.prompts.${type}.${key}`))
  }

  // Get mood options based on language
  const getMoodOptions = (): Array<{ value: JournalEntry['mood']; label: string; emoji: string }> => [
    { value: 'very-happy', label: t('journal.veryHappy'), emoji: '😄' },
    { value: 'happy', label: t('journal.happy'), emoji: '😊' },
    { value: 'neutral', label: t('journal.neutral'), emoji: '😐' },
    { value: 'sad', label: t('journal.sad'), emoji: '😢' },
    { value: 'very-sad', label: t('journal.verySad'), emoji: '😭' },
    { value: 'anxious', label: t('journal.anxious'), emoji: '😰' },
    { value: 'calm', label: t('journal.calm'), emoji: '😌' },
    { value: 'energetic', label: t('journal.energetic'), emoji: '⚡' },
    { value: 'tired', label: t('journal.tired'), emoji: '😴' },
  ]

  const [newEntry, setNewEntry] = useState<{
    date: string
    type: JournalEntry['type']
    title: string
    content: string
    mood?: JournalEntry['mood']
    moodRating?: number
    gratitudeItems: string[]
    tags: string[]
    linkedHabitId: string
  }>({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'daily',
    title: '',
    content: '',
    mood: undefined,
    moodRating: undefined,
    gratitudeItems: [],
    tags: [],
    linkedHabitId: '',
  })

  useEffect(() => {
    if (user?.id) {
      const currentFilters = { ...filters }
      if (searchQuery) {
        currentFilters.search = searchQuery
      } else {
        delete currentFilters.search
      }
      const cleanup = subscribeEntries(user.id, currentFilters)
      loadMoodStatistics(user.id)
      return cleanup
    }
    return undefined
  }, [user?.id, subscribeEntries, searchQuery])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  const handleAddEntry = async () => {
    console.log('handleAddEntry called')
    // For gratitude entries, check gratitudeItems instead of content
    const hasContent = newEntry.type === 'gratitude' 
      ? newEntry.gratitudeItems.length > 0 && newEntry.gratitudeItems.some(item => item.trim())
      : !!newEntry.content.trim()
    
    if (!hasContent || !user) {
      console.log('Validation failed:', { 
        hasContent, 
        hasUser: !!user,
        type: newEntry.type,
        contentLength: newEntry.content.length,
        gratitudeItemsLength: newEntry.gratitudeItems.length
      })
      if (!hasContent) {
        setValidationError(
          newEntry.type === 'gratitude' 
            ? t('journal.addGratitudeItem')
            : t('journal.enterContent')
        )
        setTimeout(() => setValidationError(''), 3000)
      }
      return
    }
    
    setValidationError('')

    try {
      // For gratitude entries, use gratitude items as content if content is empty
      let content = newEntry.content.trim()
      if (newEntry.type === 'gratitude' && !content && newEntry.gratitudeItems.length > 0) {
        content = newEntry.gratitudeItems.filter(item => item.trim()).join('\n')
      }
      
      const entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        date: newEntry.date,
        type: newEntry.type,
        title: newEntry.title.trim() || undefined,
        content: content || ' ', // Ensure content is never empty (API requirement)
        mood: newEntry.mood,
        moodRating: newEntry.moodRating,
        gratitudeItems: newEntry.type === 'gratitude' && newEntry.gratitudeItems.length > 0
          ? newEntry.gratitudeItems.filter(item => item.trim())
          : undefined,
        tags: newEntry.tags.length > 0 ? newEntry.tags : undefined,
        linkedHabitId: newEntry.linkedHabitId || undefined,
      }
      
      console.log('Sending entry data:', entryData)

      console.log('Calling addEntry with:', entryData)
      await addEntry(user.id, entryData)
      console.log('addEntry completed successfully')

      // Reset form
      setNewEntry({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'daily',
        title: '',
        content: '',
        mood: undefined,
        moodRating: undefined,
        gratitudeItems: [],
        tags: [],
        linkedHabitId: '',
      })
      setShowAddModal(false)
      console.log('Form reset and modal closed')
    } catch (error) {
      console.error('Failed to add journal entry:', error)
      alert('Failed to add journal entry: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleEditEntry = async () => {
    if (!currentEntry || !user) return

    try {
      await updateEntry(user.id, currentEntry.id, {
        title: currentEntry.title,
        content: currentEntry.content,
        mood: currentEntry.mood,
        moodRating: currentEntry.moodRating,
        gratitudeItems: currentEntry.gratitudeItems,
        tags: currentEntry.tags,
      })
      setShowEditModal(false)
      setCurrentEntry(null)
    } catch (error) {
      console.error('Failed to update journal entry:', error)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!user || !confirm(t('journal.deleteEntryConfirm'))) return

    try {
      await deleteEntry(user.id, entryId)
    } catch (error) {
      console.error('Failed to delete journal entry:', error)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    if (!user) return

    try {
      const { exportJournalEntries } = await import('@/lib/journalApi')
      const exported = await exportJournalEntries(user.id, format)
      const blob = new Blob([exported], { type: format === 'json' ? 'application/json' : 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `journal-entries.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export journal entries:', error)
    }
  }

  const applyPrompt = (prompt: string) => {
    if (newEntry.type === 'gratitude') {
      setNewEntry((prev) => ({
        ...prev,
        gratitudeItems: [...prev.gratitudeItems, ''],
      }))
    } else {
      setNewEntry((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${prompt}\n` : `${prompt}\n`,
      }))
    }
  }

  const filteredEntries = entries.filter((entry) => {
    if (filters.type && entry.type !== filters.type) return false
    if (filters.dateFrom && entry.date < filters.dateFrom) return false
    if (filters.dateTo && entry.date > filters.dateTo) return false
    return true
  })

  const getMoodEmoji = (mood?: JournalEntry['mood']) => {
    const moodOption = getMoodOptions().find((m) => m.value === mood)
    return moodOption?.emoji || '😐'
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={!isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  {t('journal.journalReflection')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('journal.trackThoughts')}
                </p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('journal.exportJSON')}
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('journal.exportCSV')}
                </button>
                <button
                  onClick={() => {
                    setNewEntry((prev) => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }))
                    setShowAddModal(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('journal.newEntry')}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('journal.searchEntries')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {t('todos.filter')}
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('journal.type')}
                    </label>
                    <select
                      value={filters.type || ''}
                      onChange={(e) => setFilters({ type: e.target.value as JournalEntry['type'] || undefined })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('journal.allTypes')}</option>
                      <option value="daily">{t('journal.daily')}</option>
                      <option value="gratitude">{t('journal.gratitude')}</option>
                      <option value="reflection">{t('journal.reflection')}</option>
                      <option value="weekly">{t('journal.weekly')}</option>
                      <option value="monthly">{t('journal.monthly')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('journal.dateFrom')}
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('journal.dateTo')}
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  {(filters.type || filters.dateFrom || filters.dateTo) && (
                    <button
                      onClick={() => setFilters({})}
                      className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:underline self-end"
                    >
                      {t('journal.clearFilters')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mood Statistics */}
            {moodStats && moodStats.moodTrend.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {t('journal.moodOverview')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('journal.averageMoodRating')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {moodStats.averageMoodRating.toFixed(1)}/10
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('journal.moodDistribution')}</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(moodStats.moodCounts).map(([mood, count]) => (
                        <span key={mood} className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                          {getMoodEmoji(mood as JournalEntry['mood'])} {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Journal Entries */}
            {isLoadingEntries ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('journal.loadingJournalEntries')}</p>
              </div>
            ) : filteredEntries.length === 0 && entries.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('journal.noEntriesMatchFilters')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('journal.entriesButNoneMatch', { count: entries.length })}
                </p>
                <button
                  onClick={() => setFilters({})}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('journal.clearFilters')}
                </button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('journal.noEntriesFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('journal.startJourney')}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('journal.createEntry')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            {entry.type}
                          </span>
                          {entry.mood && (
                            <span className="text-2xl" title={getMoodOptions().find((m) => m.value === entry.mood)?.label}>
                              {getMoodEmoji(entry.mood)}
                            </span>
                          )}
                          {entry.moodRating && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {entry.moodRating}/10
                            </span>
                          )}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(parseISO(entry.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {entry.title && (
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {entry.title}
                          </h3>
                        )}
                        {entry.type === 'gratitude' && entry.gratitudeItems && entry.gratitudeItems.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <Heart className="w-4 h-4 text-red-500" />
                              {t('journal.gratitudeItems')}:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              {entry.gratitudeItems.map((item, idx) => (
                                <li key={idx} className="text-gray-600 dark:text-gray-400">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {entry.content}
                        </p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {entry.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setCurrentEntry(entry)
                            setShowEditModal(true)
                          }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>

            {/* Add Entry Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('journal.newEntry')}</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={newEntry.type}
                      onChange={(e) => {
                        const newType = e.target.value as JournalEntry['type']
                        setNewEntry((prev) => ({
                          ...prev,
                          type: newType,
                          gratitudeItems: newType === 'gratitude' ? prev.gratitudeItems : [],
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="daily">{t('journal.daily')}</option>
                      <option value="gratitude">{t('journal.gratitude')}</option>
                      <option value="reflection">{t('journal.reflection')}</option>
                      <option value="weekly">{t('journal.weekly')}</option>
                      <option value="monthly">{t('journal.monthly')}</option>
                    </select>
                  </div>
                </div>

                {/* Journal Prompts */}
                {getJournalPrompts(newEntry.type).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('journal.selectPrompt')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getJournalPrompts(newEntry.type).map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyPrompt(prompt)}
                          className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('journal.title')} ({t('common.optional')})
                  </label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder={t('journal.title')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {newEntry.type === 'gratitude' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('journal.gratitudeItems')} <span className="text-red-500">*</span>
                    </label>
                    {validationError && newEntry.type === 'gratitude' && (
                      <p className="text-red-500 text-sm mb-2">{validationError}</p>
                    )}
                    <div className="space-y-2">
                      {newEntry.gratitudeItems.map((item, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...newEntry.gratitudeItems]
                            updated[idx] = e.target.value
                            setNewEntry((prev) => ({ ...prev, gratitudeItems: updated }))
                          }}
                          placeholder={`${t('journal.gratitude')} ${idx + 1}...`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ))}
                      <button
                        onClick={() =>
                          setNewEntry((prev) => ({ ...prev, gratitudeItems: [...prev.gratitudeItems, ''] }))
                        }
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + {t('journal.addGratitudeItem')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('journal.content')} <span className="text-red-500">*</span>
                    </label>
                    {validationError && (
                      <p className="text-red-500 text-sm mb-1">{validationError}</p>
                    )}
                    <textarea
                      value={newEntry.content}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder={t('journal.writeThoughts')}
                      rows={8}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationError 
                          ? 'border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('journal.mood')}
                    </label>
                    <select
                      value={newEntry.mood || ''}
                      onChange={(e) =>
                        setNewEntry((prev) => ({ ...prev, mood: e.target.value as JournalEntry['mood'] || undefined }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('journal.selectMood')}</option>
                      {getMoodOptions().map((mood) => (
                        <option key={mood.value} value={mood.value}>
                          {mood.emoji} {mood.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('journal.moodRating')} (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newEntry.moodRating || ''}
                      onChange={(e) =>
                        setNewEntry((prev) => ({
                          ...prev,
                          moodRating: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('focus.linkToHabit')} ({t('common.optional')})
                  </label>
                  <select
                    value={newEntry.linkedHabitId}
                    onChange={(e) => setNewEntry((prev) => ({ ...prev, linkedHabitId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('journal.noHabitLinked')}</option>
                    {habits
                      .filter((h) => h.isActive)
                      .map((habit) => (
                        <option key={habit.id} value={habit.id}>
                          {habit.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleAddEntry}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('journal.saveEntry')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Entry Modal */}
        {showEditModal && currentEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('journal.editJournalEntry')}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setCurrentEntry(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('journal.title')} ({t('common.optional')})
                  </label>
                  <input
                    type="text"
                    value={currentEntry.title || ''}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {currentEntry.type === 'gratitude' && currentEntry.gratitudeItems ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('journal.gratitudeItems')}
                    </label>
                    <div className="space-y-2">
                      {currentEntry.gratitudeItems.map((item, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...currentEntry.gratitudeItems!]
                            updated[idx] = e.target.value
                            setCurrentEntry({ ...currentEntry, gratitudeItems: updated })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ))}
                      <button
                        onClick={() =>
                          setCurrentEntry({
                            ...currentEntry,
                            gratitudeItems: [...(currentEntry.gratitudeItems || []), ''],
                          })
                        }
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + Add gratitude item
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content
                    </label>
                    <textarea
                      value={currentEntry.content}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, content: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mood
                    </label>
                    <select
                      value={currentEntry.mood || ''}
                      onChange={(e) =>
                        setCurrentEntry({
                          ...currentEntry,
                          mood: e.target.value as JournalEntry['mood'] || undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select mood...</option>
                      {MOOD_OPTIONS.map((mood) => (
                        <option key={mood.value} value={mood.value}>
                          {mood.emoji} {mood.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mood Rating (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentEntry.moodRating || ''}
                      onChange={(e) =>
                        setCurrentEntry({
                          ...currentEntry,
                          moodRating: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleEditEntry}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('habits.saveChanges')}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setCurrentEntry(null)
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

