'use client'

import { useMemo } from 'react'
import type { WorkoutLog } from '@/types/workout'
import { getExerciseById } from '@/lib/exerciseDatabase'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ProgressiveOverloadChartProps {
  workoutLogs: WorkoutLog[]
  exerciseId: string
}

export default function ProgressiveOverloadChart({ workoutLogs, exerciseId }: ProgressiveOverloadChartProps) {
  const chartData = useMemo(() => {
    const exercise = getExerciseById(exerciseId)
    if (!exercise) return []

    // Filter logs that contain this exercise
    const relevantLogs = workoutLogs
      .filter(log => log.exercises.some(ex => ex.exerciseId === exerciseId))
      .sort((a, b) => {
        const dateA = a.endTime ? new Date(a.endTime).getTime() : new Date(a.date).getTime()
        const dateB = b.endTime ? new Date(b.endTime).getTime() : new Date(b.date).getTime()
        return dateA - dateB
      })

    return relevantLogs.map(log => {
      const exerciseData = log.exercises.find(ex => ex.exerciseId === exerciseId)
      if (!exerciseData) return null

      const workingSets = exerciseData.sets.filter(set => set.setType === 'working' && set.completed)
      
      if (workingSets.length === 0) return null

      // Calculate average weight and total reps
      const weights = workingSets.map(set => set.weight || 0).filter(w => w > 0)
      const reps = workingSets.map(set => set.reps || 0).filter(r => r > 0)
      
      const avgWeight = weights.length > 0 ? weights.reduce((sum, w) => sum + w, 0) / weights.length : 0
      const totalReps = reps.reduce((sum, r) => sum + r, 0)
      const totalVolume = avgWeight * totalReps
      const maxWeight = weights.length > 0 ? Math.max(...weights) : 0

      const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)

      return {
        date: format(logDate, 'MMM d'),
        fullDate: logDate,
        avgWeight: Math.round(avgWeight * 10) / 10,
        maxWeight: Math.round(maxWeight * 10) / 10,
        totalReps,
        totalVolume: Math.round(totalVolume),
      }
    }).filter(Boolean)
  }, [workoutLogs, exerciseId])

  const exercise = getExerciseById(exerciseId)

  if (!exercise || chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available for {exercise?.name || 'this exercise'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {exercise.name} - Progressive Overload
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your strength progression over time
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
              stroke="#3b82f6"
              tick={{ fill: '#3b82f6' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: 'Volume', angle: 90, position: 'insideRight' }}
              stroke="#10b981"
              tick={{ fill: '#10b981' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgWeight"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Avg Weight (kg)"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="maxWeight"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Max Weight (kg)"
              dot={{ r: 4 }}
              strokeDasharray="5 5"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalVolume"
              stroke="#10b981"
              strokeWidth={2}
              name="Total Volume (kg)"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      {chartData.length >= 2 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Weight Progress</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {chartData[0].avgWeight} → {chartData[chartData.length - 1].avgWeight} kg
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {chartData[chartData.length - 1].avgWeight > chartData[0].avgWeight ? (
                <span className="text-green-600">+{((chartData[chartData.length - 1].avgWeight - chartData[0].avgWeight) / chartData[0].avgWeight * 100).toFixed(1)}%</span>
              ) : (
                <span className="text-red-600">{((chartData[chartData.length - 1].avgWeight - chartData[0].avgWeight) / chartData[0].avgWeight * 100).toFixed(1)}%</span>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Max Weight</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {chartData[chartData.length - 1].maxWeight} kg
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Best: {Math.max(...chartData.map(d => d.maxWeight))} kg
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Volume Progress</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {chartData[0].totalVolume} → {chartData[chartData.length - 1].totalVolume} kg
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {chartData[chartData.length - 1].totalVolume > chartData[0].totalVolume ? (
                <span className="text-green-600">+{((chartData[chartData.length - 1].totalVolume - chartData[0].totalVolume) / chartData[0].totalVolume * 100).toFixed(1)}%</span>
              ) : (
                <span className="text-red-600">{((chartData[chartData.length - 1].totalVolume - chartData[0].totalVolume) / chartData[0].totalVolume * 100).toFixed(1)}%</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

