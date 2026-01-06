'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import type { PlannedMeal } from '@/types/nutrition'
import { showWarning } from '@/lib/utils'

interface MealEditorProps {
  dayDate: Date
  existingMeals: PlannedMeal[]
  onSave: (meals: PlannedMeal[]) => void
  onClose: () => void
}

export default function MealEditor({ dayDate, existingMeals, onSave, onClose }: MealEditorProps) {
  const [meals, setMeals] = useState<PlannedMeal[]>(existingMeals || [])
  
  // Update meals when existingMeals prop changes (e.g., after saving and reopening)
  useEffect(() => {
    setMeals(existingMeals || [])
  }, [existingMeals])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  
  const [mealName, setMealName] = useState('')
  const [mealCategory, setMealCategory] = useState<PlannedMeal['category']>('breakfast')
  const [mealTime, setMealTime] = useState('')
  const [servings, setServings] = useState(1)
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs] = useState(0)
  const [fat, setFat] = useState(0)
  const [notes, setNotes] = useState('')

  const handleAddMeal = () => {
    if (!mealName.trim()) {
      showWarning('Please enter a meal name')
      return
    }

    const newMeal: PlannedMeal = {
      mealName: mealName.trim(),
      category: mealCategory,
      servings,
      nutrition: {
        calories: calories * servings,
        protein: protein * servings,
        carbs: carbs * servings,
        fat: fat * servings,
      },
      time: mealTime || undefined,
      notes: notes.trim() || undefined,
    }

    if (editingIndex !== null) {
      const updated = [...meals]
      updated[editingIndex] = newMeal
      setMeals(updated)
      setEditingIndex(null)
    } else {
      setMeals([...meals, newMeal])
    }

    // Reset form
    setMealName('')
    setMealCategory('breakfast')
    setMealTime('')
    setServings(1)
    setCalories(0)
    setProtein(0)
    setCarbs(0)
    setFat(0)
    setNotes('')
  }

  const handleEditMeal = (index: number) => {
    const meal = meals[index]
    setMealName(meal.mealName)
    setMealCategory(meal.category)
    setMealTime(meal.time || '')
    setServings(meal.servings)
    setCalories(meal.nutrition.calories / meal.servings)
    setProtein(meal.nutrition.protein / meal.servings)
    setCarbs(meal.nutrition.carbs / meal.servings)
    setFat(meal.nutrition.fat / meal.servings)
    setNotes(meal.notes || '')
    setEditingIndex(index)
  }

  const handleDeleteMeal = (index: number) => {
    if (confirm('Delete this meal?')) {
      setMeals(meals.filter((_, i) => i !== index))
    }
  }

  const handleSave = () => {
    onSave(meals)
    onClose()
  }

  const totalNutrition = meals.reduce((total, meal) => ({
    calories: total.calories + meal.nutrition.calories,
    protein: total.protein + meal.nutrition.protein,
    carbs: total.carbs + meal.nutrition.carbs,
    fat: total.fat + meal.nutrition.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Meals - {dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Meals List */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Meals ({meals.length})</h4>
            {meals.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No meals added yet</p>
            ) : (
              <div className="space-y-2">
                {meals.map((meal, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded capitalize">
                          {meal.category}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{meal.mealName}</span>
                        {meal.time && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{meal.time}</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {meal.nutrition.calories} kcal • {meal.nutrition.protein}g P • {meal.nutrition.carbs}g C • {meal.nutrition.fat}g F
                        {meal.servings > 1 && ` • ${meal.servings} servings`}
                      </div>
                      {meal.notes && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">{meal.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditMeal(index)}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(index)}
                        className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Nutrition Summary */}
          {meals.length > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Daily Total</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                  <span className="ml-2 font-bold text-orange-600 dark:text-orange-400">{totalNutrition.calories}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                  <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{totalNutrition.protein}g</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                  <span className="ml-2 font-bold text-green-600 dark:text-green-400">{totalNutrition.carbs}g</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                  <span className="ml-2 font-bold text-purple-600 dark:text-purple-400">{totalNutrition.fat}g</span>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Meal Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              {editingIndex !== null ? 'Edit Meal' : 'Add Meal'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meal Name *
                </label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={mealCategory}
                  onChange={(e) => setMealCategory(e.target.value as PlannedMeal['category'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="pre-workout">Pre-Workout</option>
                  <option value="post-workout">Post-Workout</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
                  min={0.5}
                  step={0.5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Calories (per serving)
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Protein (g per serving)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Carbs (g per serving)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fat (g per serving)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddMeal}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                {editingIndex !== null ? 'Update Meal' : 'Add Meal'}
              </button>
              {editingIndex !== null && (
                <button
                  onClick={() => {
                    setEditingIndex(null)
                    setMealName('')
                    setMealCategory('breakfast')
                    setMealTime('')
                    setServings(1)
                    setCalories(0)
                    setProtein(0)
                    setCarbs(0)
                    setFat(0)
                    setNotes('')
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

