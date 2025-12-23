'use client'

import { useState, useEffect } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Dumbbell, TrendingUp, AlertCircle, CheckCircle, BarChart3, Calendar, Target, Activity, TrendingDown } from 'lucide-react'
import type { WorkoutHistoryInsights } from '@/scripts/analyzeWorkoutHistory'

interface MuscleGroupCoverage {
  muscleGroup: string
  exercises: string[]
  directWork: number
  indirectWork: number
  totalSets: number
}

interface RoutineAnalysis {
  routineId: string
  routineName: string
  muscleGroups: MuscleGroupCoverage[]
  bicepsAnalysis: {
    hasDirectBicepsWork: boolean
    hasIndirectBicepsWork: boolean
    bicepsExercises: string[]
    indirectBicepsExercises: string[]
    totalBicepsSets: number
    recommendation: 'add' | 'sufficient' | 'excessive'
    suggestedExercises: Array<{
      id: string
      name: string
      description: string
      difficulty: string
      equipment: string[]
    }>
  }
  overallRecommendations: string[]
  report: string
}

export default function RoutineAnalyzer() {
  const { user } = useFirestoreStore()
  const [analyses, setAnalyses] = useState<RoutineAnalysis[]>([])
  const [historyInsights, setHistoryInsights] = useState<WorkoutHistoryInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeRoutines = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/routines/analyze?userId=${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to analyze routines')
      }

      const data = await response.json()
      setAnalyses(data.analyses || [])
      setHistoryInsights(data.historyInsights || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      analyzeRoutines()
    }
  }, [user?.id])

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

      {analyses.length === 0 && !loading && !historyInsights && (
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
                <div className="space-y-1">
                  {historyInsights.progressIndicators.strengthProgression.map((prog, idx) => (
                    <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{prog.name}:</span> {prog.progression}
                    </div>
                  ))}
                </div>
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
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {analysis.routineName}
            </h3>
            {analysis.bicepsAnalysis.recommendation === 'add' && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Needs Biceps Work
              </span>
            )}
            {analysis.bicepsAnalysis.recommendation === 'sufficient' && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Biceps Coverage Good
              </span>
            )}
          </div>

          {/* Muscle Group Coverage Overview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Muscle Group Coverage
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {analysis.muscleGroups.slice(0, 12).map((mg) => (
                <div
                  key={mg.muscleGroup}
                  className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-xs font-medium text-gray-900 dark:text-white capitalize">
                    {mg.muscleGroup}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {mg.totalSets} sets
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {mg.directWork > 0 ? 'Direct' : 'Indirect'}
                  </div>
                </div>
              ))}
            </div>
            {analysis.muscleGroups.length > 12 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                +{analysis.muscleGroups.length - 12} more muscle groups
              </div>
            )}
          </div>

          {/* Biceps Analysis */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Dumbbell className="w-5 h-5" />
              Biceps Analysis
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Direct Work:</span>
                <span className={`ml-2 font-medium ${
                  analysis.bicepsAnalysis.hasDirectBicepsWork
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {analysis.bicepsAnalysis.hasDirectBicepsWork ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Sets:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {analysis.bicepsAnalysis.totalBicepsSets}
                </span>
              </div>
            </div>

            {analysis.bicepsAnalysis.bicepsExercises.length > 0 && (
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Direct Exercises: </span>
                <span className="text-gray-900 dark:text-white text-sm font-medium">
                  {analysis.bicepsAnalysis.bicepsExercises.join(', ')}
                </span>
              </div>
            )}

            {analysis.bicepsAnalysis.indirectBicepsExercises.length > 0 && (
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Indirect Exercises: </span>
                <span className="text-gray-900 dark:text-white text-sm font-medium">
                  {analysis.bicepsAnalysis.indirectBicepsExercises.join(', ')}
                </span>
              </div>
            )}

            {/* Suggested Exercises */}
            {analysis.bicepsAnalysis.recommendation === 'add' &&
             analysis.bicepsAnalysis.suggestedExercises.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  💡 Suggested Dumbbell Biceps Exercises:
                </h4>
                <div className="space-y-2">
                  {analysis.bicepsAnalysis.suggestedExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {ex.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {ex.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
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
    </div>
  )
}

