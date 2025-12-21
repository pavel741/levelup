'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, X, Play, Info } from 'lucide-react'
import { EXERCISE_DATABASE, searchExercises, getExercisesByCategory, getExercisesByMuscleGroup, getExercisesByEquipment } from '@/lib/exerciseDatabase'
import type { Exercise } from '@/types/workout'

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void
}

export default function ExerciseLibrary({ onSelectExercise }: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all')
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  // Get unique values for filters
  const categories = ['all', ...Array.from(new Set(EXERCISE_DATABASE.map(ex => ex.category)))]
  const muscleGroups = ['all', ...Array.from(new Set(EXERCISE_DATABASE.flatMap(ex => [...ex.muscleGroups.primary, ...ex.muscleGroups.secondary])))]
  const equipment = ['all', ...Array.from(new Set(EXERCISE_DATABASE.flatMap(ex => ex.equipment)))]
  const difficulties = ['all', ...Array.from(new Set(EXERCISE_DATABASE.map(ex => ex.difficulty)))]

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let exercises = EXERCISE_DATABASE

    // Search
    if (searchQuery.trim()) {
      exercises = searchExercises(searchQuery)
    }

    // Category filter
    if (selectedCategory !== 'all') {
      exercises = exercises.filter(ex => ex.category === selectedCategory)
    }

    // Muscle group filter
    if (selectedMuscleGroup !== 'all') {
      exercises = exercises.filter(ex => 
        ex.muscleGroups.primary.includes(selectedMuscleGroup) ||
        ex.muscleGroups.secondary.includes(selectedMuscleGroup)
      )
    }

    // Equipment filter
    if (selectedEquipment !== 'all') {
      exercises = exercises.filter(ex => ex.equipment.includes(selectedEquipment))
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      exercises = exercises.filter(ex => ex.difficulty === selectedDifficulty)
    }

    return exercises
  }, [searchQuery, selectedCategory, selectedMuscleGroup, selectedEquipment, selectedDifficulty])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedMuscleGroup('all')
    setSelectedEquipment('all')
    setSelectedDifficulty('all')
  }

  const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getCategoryColor = (category: Exercise['category']) => {
    switch (category) {
      case 'strength':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'cardio':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      case 'flexibility':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Muscle Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Muscle Group
                </label>
                <select
                  value={selectedMuscleGroup}
                  onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {muscleGroups.map(mg => (
                    <option key={mg} value={mg}>
                      {mg.charAt(0).toUpperCase() + mg.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipment
                </label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {equipment.map(eq => (
                    <option key={eq} value={eq}>
                      {eq.charAt(0).toUpperCase() + eq.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory !== 'all' || selectedMuscleGroup !== 'all' || selectedEquipment !== 'all' || selectedDifficulty !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'}
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedExercise(exercise)}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {exercise.name}
                </h3>
              {onSelectExercise && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectExercise(exercise)
                  }}
                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Add to routine"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {exercise.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(exercise.category)}`}>
                {exercise.category}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                {exercise.difficulty}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Primary: </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {exercise.muscleGroups.primary.join(', ')}
                </span>
              </div>
              {exercise.muscleGroups.secondary.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Secondary: </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {exercise.muscleGroups.secondary.join(', ')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Equipment: </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {exercise.equipment.join(', ') || 'None'}
                </span>
              </div>
            </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No exercises found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedExercise.name}</h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">{selectedExercise.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded text-sm font-medium ${getCategoryColor(selectedExercise.category)}`}>
                  {selectedExercise.category}
                </span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getDifficultyColor(selectedExercise.difficulty)}`}>
                  {selectedExercise.difficulty}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Primary Muscles</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedExercise.muscleGroups.primary.join(', ')}
                  </p>
                </div>
                {selectedExercise.muscleGroups.secondary.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Secondary Muscles</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedExercise.muscleGroups.secondary.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Equipment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedExercise.equipment.join(', ') || 'None required'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Instructions</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedExercise.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

              {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Tips
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedExercise.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedExercise.commonMistakes && selectedExercise.commonMistakes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Common Mistakes</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400">
                    {selectedExercise.commonMistakes.map((mistake, index) => (
                      <li key={index}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              )}

              {onSelectExercise && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      onSelectExercise(selectedExercise)
                      setSelectedExercise(null)
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Add to Routine
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

