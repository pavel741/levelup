'use client'

import { useState, useEffect } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { Dumbbell, TrendingUp, AlertCircle, CheckCircle, BarChart3, Calendar, Target, Activity, TrendingDown, Sparkles, X } from 'lucide-react'
import type { WorkoutHistoryInsights } from '@/scripts/analyzeWorkoutHistory'
import ProgressiveOverloadChart from '@/components/ProgressiveOverloadChart'
import { improveRoutine, type ImproveRoutineResult } from '@/lib/workoutApi'
import { subscribeToRoutines } from '@/lib/workoutApi'

interface MuscleGroupCoverage {
  muscleGroup: string
  exercises: string[]
  directWork: number
  indirectWork: number
  totalSets: number
}

interface Improvement {
  category: string
  priority: 'high' | 'medium' | 'low'
  issue: string
  recommendation: string
  suggestedExercises?: Array<{
    id: string
    name: string
    description: string
    difficulty: string
    equipment: string[]
    reason: string
  }>
}

interface RoutineAnalysis {
  routineId: string
  routineName: string
  muscleGroups: MuscleGroupCoverage[]
  exerciseAnalysis: Array<{
    exerciseId: string
    exerciseName: string
    sets: number
    averageReps: number
    restTime: number
    isCompound: boolean
    isIsolation: boolean
    muscleGroups: string[]
  }>
  improvements: Improvement[]
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  overallRecommendations: string[]
  report: string
}

export default function RoutineAnalyzer() {
  const { user } = useFirestoreStore()
  const { workoutLogs, loadWorkoutLogs } = useWorkoutStore()
  const [analyses, setAnalyses] = useState<RoutineAnalysis[]>([])
  const [historyInsights, setHistoryInsights] = useState<WorkoutHistoryInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedExerciseForChart, setSelectedExerciseForChart] = useState<string | null>(null)
  const [improvingRoutineId, setImprovingRoutineId] = useState<string | null>(null)
  const [improvementPreview, setImprovementPreview] = useState<ImproveRoutineResult | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const analyzeRoutines = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const { authenticatedFetch } = await import('@/lib/utils')
      const response = await authenticatedFetch('/api/routines/analyze')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Failed to analyze routines:', response.status, errorData)
        throw new Error(errorData.message || `Failed to analyze routines: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Routine analysis response:', responseData)
      
      // Handle response wrapped in 'data' property (from createGetHandler)
      const data = responseData.data || responseData
      console.log('Extracted data:', data)
      console.log('Analyses array:', data.analyses)
      console.log('Analyses length:', data.analyses?.length)
      console.log('History insights:', data.historyInsights)
      console.log('Summary:', data.summary)
      
      setAnalyses(data.analyses || [])
      setHistoryInsights(data.historyInsights || null)
      
      // Debug: Log state after setting
      setTimeout(() => {
        console.log('State after update - analyses:', data.analyses?.length, 'historyInsights:', !!data.historyInsights)
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleImproveRoutine = async (routineId: string) => {
    if (!user?.id) return

    setImprovingRoutineId(routineId)
    setError(null)

    try {
      const result = await improveRoutine(routineId)
      setImprovementPreview(result)
      setShowPreviewModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve routine')
    } finally {
      setImprovingRoutineId(null)
    }
  }

  const applyImprovements = async () => {
    if (!improvementPreview || !user?.id) return

    try {
      // The improvements are already applied on the server
      // Just refresh the routines and analysis
      setShowPreviewModal(false)
      setImprovementPreview(null)
      
      // Refresh analysis to show updated routine
      await analyzeRoutines()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply improvements')
    }
  }

  useEffect(() => {
    if (user?.id) {
      analyzeRoutines()
      loadWorkoutLogs(user.id)
    }
  }, [user?.id, loadWorkoutLogs])

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Routine Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analyze your routines and get suggestions for improvements
          </p>
        </div>
        <button
          onClick={analyzeRoutines}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {analyses.length === 0 && !loading && !historyInsights && !error && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No routines found. Create a routine to get analysis and suggestions.
        </div>
      )}

      {/* Workout History Insights */}
      {historyInsights && historyInsights.totalWorkouts > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Workout History Insights
            </h2>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Workouts</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {historyInsights.totalWorkouts}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Volume</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {historyInsights.totalVolume.toLocaleString()} kg
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Duration</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {historyInsights.averageWorkoutDuration} min
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Workouts/Week</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {historyInsights.workoutsPerWeek.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Training Frequency */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Training Frequency</h3>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {historyInsights.trainingFrequency.daysPerWeek.toFixed(1)} days/week
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                historyInsights.trainingFrequency.consistency === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                historyInsights.trainingFrequency.consistency === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                historyInsights.trainingFrequency.consistency === 'moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {historyInsights.trainingFrequency.consistency.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {historyInsights.trainingFrequency.recommendation}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Progress Indicators</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volume Trend</div>
                <div className="flex items-center gap-2">
                  {historyInsights.progressIndicators.volumeTrend === 'increasing' ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : historyInsights.progressIndicators.volumeTrend === 'decreasing' ? (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {historyInsights.progressIndicators.volumeTrend}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Frequency Trend</div>
                <div className="flex items-center gap-2">
                  {historyInsights.progressIndicators.frequencyTrend === 'increasing' ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : historyInsights.progressIndicators.frequencyTrend === 'decreasing' ? (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {historyInsights.progressIndicators.frequencyTrend}
                  </span>
                </div>
              </div>
            </div>

            {/* Strength Progression */}
            {historyInsights.progressIndicators.strengthProgression.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Strength Progression (Last 5 Workouts):
                </div>
                <div className="space-y-1 mb-4">
                  {historyInsights.progressIndicators.strengthProgression.map((prog, idx) => (
                    <div 
                      key={idx} 
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => setSelectedExerciseForChart(prog.exerciseId)}
                    >
                      <span className="font-medium">{prog.name}:</span> {prog.progression}
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(click to view chart)</span>
                    </div>
                  ))}
                </div>
                
                {/* Progressive Overload Chart */}
                {selectedExerciseForChart && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ProgressiveOverloadChart 
                      workoutLogs={workoutLogs} 
                      exerciseId={selectedExerciseForChart}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Muscle Group Balance */}
          {!historyInsights.muscleGroupBalance.wellBalanced && historyInsights.muscleGroupBalance.imbalances.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Muscle Group Imbalances</h3>
              </div>
              <div className="space-y-2">
                {historyInsights.muscleGroupBalance.imbalances.map((imbalance, idx) => (
                  <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium capitalize">{imbalance.muscleGroup}</span>: {imbalance.recommendation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Variety */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Exercise Variety</h3>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {historyInsights.exerciseVariety.varietyScore}/100
              </div>
            </div>
            <div className="mb-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    historyInsights.exerciseVariety.varietyScore >= 70 ? 'bg-green-600' :
                    historyInsights.exerciseVariety.varietyScore >= 40 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${historyInsights.exerciseVariety.varietyScore}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {historyInsights.exerciseVariety.uniqueExercises} unique exercises • {historyInsights.exerciseVariety.recommendation}
            </p>
          </div>

          {/* Most Frequent Exercises */}
          {historyInsights.mostFrequentExercises.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Most Frequent Exercises
              </h3>
              <div className="space-y-2">
                {historyInsights.mostFrequentExercises.slice(0, 5).map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {idx + 1}. {ex.name}
                    </span>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <span>{ex.count} workouts</span>
                      <span>{ex.totalVolume.toLocaleString()} kg total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {analyses.map((analysis) => (
        <div
          key={analysis.routineId}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6"
        >
          {/* Header with Score */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {analysis.routineName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive Routine Analysis
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                analysis.overallScore >= 85 ? 'text-green-600 dark:text-green-400' :
                analysis.overallScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {analysis.overallScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">/ 100</div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.strengths.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Strengths</h4>
                </div>
                <ul className="space-y-1">
                  {analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.weaknesses.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Areas for Improvement</h4>
                </div>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      • {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Muscle Group Coverage Overview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Muscle Group Coverage
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {analysis.muscleGroups.slice(0, 12).map((mg) => {
                const minSets = 6 // Default minimum
                const isAdequate = mg.totalSets >= minSets
                return (
                  <div
                    key={mg.muscleGroup}
                    className={`p-2 rounded border ${
                      isAdequate
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {isAdequate ? (
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                      )}
                      <div className="text-xs font-medium text-gray-900 dark:text-white capitalize">
                        {mg.muscleGroup}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {mg.totalSets} sets ({mg.frequency}x/week)
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      {mg.directWork > 0 ? 'Direct' : 'Indirect'}
                    </div>
                  </div>
                )
              })}
            </div>
            {analysis.muscleGroups.length > 12 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                +{analysis.muscleGroups.length - 12} more muscle groups
              </div>
            )}
          </div>

          {/* Improve Routine Button */}
          {analysis.improvements.filter(imp => imp.priority === 'high' || imp.priority === 'medium').length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => handleImproveRoutine(analysis.routineId)}
                disabled={improvingRoutineId === analysis.routineId || loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
              >
                {improvingRoutineId === analysis.routineId ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Auto-Improve Routine
                  </>
                )}
              </button>
            </div>
          )}

          {/* Comprehensive Improvements */}
          {analysis.improvements.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Improvement Suggestions
              </h4>
              
              {/* Group by category */}
              {Array.from(new Set(analysis.improvements.map(imp => imp.category))).map(category => {
                const categoryImprovements = analysis.improvements.filter(imp => imp.category === category)
                return (
                  <div key={category} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {category}
                    </h5>
                    <div className="space-y-4">
                      {categoryImprovements.map((improvement, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            improvement.priority === 'high'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : improvement.priority === 'medium'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              improvement.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : improvement.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {improvement.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {improvement.issue}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {improvement.recommendation}
                          </div>
                          
                          {/* Suggested Exercises */}
                          {improvement.suggestedExercises && improvement.suggestedExercises.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Suggested Exercises:
                              </div>
                              <div className="space-y-2">
                                {improvement.suggestedExercises.map((ex) => (
                                  <div
                                    key={ex.id}
                                    className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                                      {ex.name}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {ex.reason}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs">
                                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                        {ex.difficulty}
                                      </span>
                                      <span className="text-gray-500 dark:text-gray-400">
                                        {ex.equipment.join(', ')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recommendations */}
          {analysis.overallRecommendations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Recommendations:
              </h4>
              <ul className="space-y-1">
                {analysis.overallRecommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {/* Improvement Preview Modal */}
      {showPreviewModal && improvementPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Routine Improvements Preview
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setImprovementPreview(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {improvementPreview.summary}
                </p>
              </div>

              {improvementPreview.changes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Changes to be applied:
                  </h4>
                  <div className="space-y-2">
                    {improvementPreview.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          change.type === 'exercise_added'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {change.type === 'exercise_added' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {change.description}
                            </div>
                            {change.details && typeof change.details === 'object' && 'reason' in change.details && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Reason: {change.details.reason as string}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={applyImprovements}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium"
                >
                  Apply Improvements
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setImprovementPreview(null)
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

