'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { ROUTINE_TEMPLATES } from '@/lib/routineTemplates'
import type { Routine } from '@/types/workout'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: Partial<Routine>) => void
}

export default function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (!isOpen) return null

  const handleSelectTemplate = (template: typeof ROUTINE_TEMPLATES[0]) => {
    const templateRoutine: Partial<Routine> = {
      ...template,
      isTemplate: true,
      isPublic: false,
      createdBy: 'system',
      rating: undefined,
      timesUsed: undefined,
    }
    onSelectTemplate(templateRoutine)
    onClose()
  }

  // Categorize templates
  const stretchRoutines = ROUTINE_TEMPLATES.filter(t => 
    t.tags?.some(tag => tag.includes('stretch') || tag.includes('morning') || tag.includes('yoga'))
  )
  const strengthRoutines = ROUTINE_TEMPLATES.filter(t => 
    !t.tags?.some(tag => tag.includes('stretch') || tag.includes('morning') || tag.includes('yoga') || tag.includes('cardio'))
  )
  const cardioRoutines = ROUTINE_TEMPLATES.filter(t => 
    t.tags?.some(tag => tag.includes('cardio'))
  )

  const displayedTemplates = selectedCategory === 'stretch' 
    ? stretchRoutines 
    : selectedCategory === 'strength'
    ? strengthRoutines
    : selectedCategory === 'cardio'
    ? cardioRoutines
    : ROUTINE_TEMPLATES

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Routine Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Choose a pre-built routine template to get started. You can customize it after loading.
        </p>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({ROUTINE_TEMPLATES.length})
          </button>
          <button
            onClick={() => setSelectedCategory('strength')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'strength'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Strength ({strengthRoutines.length})
          </button>
          <button
            onClick={() => setSelectedCategory('cardio')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'cardio'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Cardio ({cardioRoutines.length})
          </button>
          <button
            onClick={() => setSelectedCategory('stretch')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              selectedCategory === 'stretch'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Morning Stretch ({stretchRoutines.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTemplates.map((template, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadgeClass(template.difficulty)}`}>
                  {template.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {template.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span>
                  {template.sessions?.length || template.exercises.length}{' '}
                  {template.sessions ? 'days' : 'exercises'}
                </span>
                <span>~{template.estimatedDuration} min</span>
                <span className="capitalize">{template.goal}</span>
              </div>
              {template.sessions && template.sessions.length > 0 && (
                <div className="mb-3 space-y-1">
                  {template.sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex} className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-medium">{session.name}:</span>{' '}
                      {session.exercises.length} exercises (~{session.estimatedDuration} min)
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleSelectTemplate(template)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Use This Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

