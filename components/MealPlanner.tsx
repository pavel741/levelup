'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, UtensilsCrossed, Plus, Trash2, Edit2, ShoppingCart, ChefHat, Target, Sparkles, X } from 'lucide-react'
import { subscribeToMealPlans, getMealPlans, saveMealPlan, deleteMealPlan, updateMealPlan } from '@/lib/mealApi'
import type { MealPlan, MealPlanDay, PlannedMeal, NutritionInfo } from '@/types/nutrition'
import { formatDate, formatDisplayDate } from '@/lib/utils/formatting'
import { addDays, eachDayOfInterval, startOfWeek, endOfWeek, format, isSameDay } from 'date-fns'
import { getAllMealPlanTemplates, generateMealPlanFromTemplate } from '@/lib/mealPlanTemplates'
import MealEditor from './MealEditor'

interface MealPlannerProps {
  userId: string
}

export default function MealPlanner({ userId }: MealPlannerProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [showNewPlanModal, setShowNewPlanModal] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanDescription, setNewPlanDescription] = useState('')
  const [newPlanStartDate, setNewPlanStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newPlanDuration, setNewPlanDuration] = useState(7) // days
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<MealPlan> | null>(null)
  const [editingDay, setEditingDay] = useState<Date | null>(null)

  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToMealPlans(userId, (plans) => {
      setMealPlans(plans)
    })

    return unsubscribe
  }, [userId])

  const handleCreatePlan = async () => {
    if (!newPlanName.trim() || !userId) return

    const startDate = new Date(newPlanStartDate)
    
    // Use template if selected, otherwise create empty plan
    let mealPlan: MealPlan
    if (selectedTemplate) {
      mealPlan = generateMealPlanFromTemplate(
        { ...selectedTemplate, name: newPlanName, description: newPlanDescription || selectedTemplate.description },
        userId,
        startDate,
        newPlanDuration
      )
    } else {
      const endDate = addDays(startDate, newPlanDuration - 1)
      const days: MealPlanDay[] = eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
        date,
        meals: [],
        totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      }))

      mealPlan = {
        id: Date.now().toString(),
        userId,
        name: newPlanName,
        description: newPlanDescription || undefined,
        startDate,
        endDate,
        days,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    try {
      await saveMealPlan(mealPlan)
      setShowNewPlanModal(false)
      setShowTemplates(false)
      setNewPlanName('')
      setNewPlanDescription('')
      setNewPlanStartDate(format(new Date(), 'yyyy-MM-dd'))
      setNewPlanDuration(7)
      setSelectedTemplate(null)
      setSelectedPlan(mealPlan)
    } catch (error: any) {
      console.error('Error saving meal plan:', error)
      alert(`Failed to save meal plan: ${error.message || 'Unknown error'}\n\nIf MongoDB is blocked, meal plans won't be available until you're on a network that allows MongoDB access.`)
    }
  }

  const handleSelectTemplate = (template: Partial<MealPlan>) => {
    setSelectedTemplate(template)
    setNewPlanName(template.name || '')
    setNewPlanDescription(template.description || '')
    setShowTemplates(false)
    setShowNewPlanModal(true)
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this meal plan?')) return
    
    try {
      // Optimistically update local state immediately
      setMealPlans(prevPlans => prevPlans.filter(plan => plan.id !== planId))
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null)
      }
      
      // Then delete from database
      await deleteMealPlan(planId, userId)
    } catch (error: any) {
      // If deletion fails, reload plans from server
      console.error('Error deleting meal plan:', error)
      alert(`Failed to delete meal plan: ${error.message || 'Unknown error'}`)
      // Reload plans to restore state
      const plans = await getMealPlans(userId)
      setMealPlans(plans)
    }
  }

  const currentWeekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd })
  }, [currentWeekStart])

  const selectedPlanDays = useMemo(() => {
    if (!selectedPlan) return []
    return selectedPlan.days.filter(day => 
      currentWeekDays.some(weekDay => isSameDay(weekDay, day.date))
    )
  }, [selectedPlan, currentWeekDays])

  const calculateDayNutrition = (meals: PlannedMeal[]): NutritionInfo => {
    return meals.reduce((total, meal) => ({
      calories: total.calories + meal.nutrition.calories,
      protein: total.protein + meal.nutrition.protein,
      carbs: total.carbs + meal.nutrition.carbs,
      fat: total.fat + meal.nutrition.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const handleSaveDayMeals = async (dayDate: Date, meals: PlannedMeal[]) => {
    if (!selectedPlan) return

    const totalNutrition = calculateDayNutrition(meals)
    const updatedDays = selectedPlan.days.map(day => {
      if (isSameDay(day.date, dayDate)) {
        return {
          ...day,
          meals,
          totalNutrition,
        }
      }
      return day
    })

    const updatedPlan: MealPlan = {
      ...selectedPlan,
      days: updatedDays,
      updatedAt: new Date(),
    }

    try {
      await updateMealPlan(selectedPlan.id, userId, updatedPlan)
      setSelectedPlan(updatedPlan)
      setEditingDay(null)
    } catch (error: any) {
      console.error('Error updating meal plan:', error)
      alert(`Failed to update meals: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            Meal Planner
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Plan your meals and track nutrition
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Templates
          </button>
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Plan
          </button>
        </div>
      </div>

      {/* Meal Plans List */}
      {mealPlans.length === 0 && !selectedPlan && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No meal plans yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first meal plan to get started
          </p>
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Create Meal Plan
          </button>
        </div>
      )}

      {/* Plans Sidebar */}
      {mealPlans.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">My Plans</h3>
              <div className="space-y-2">
                {mealPlans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{plan.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDisplayDate(plan.startDate)} - {formatDisplayDate(plan.endDate)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePlan(plan.id)
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meal Plan View */}
          <div className="lg:col-span-3">
            {selectedPlan ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedPlan.name}
                      </h3>
                      {selectedPlan.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {selectedPlan.description}
                        </p>
                      )}
                      {selectedPlan.nutritionGoals && (
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          {selectedPlan.nutritionGoals.dailyCalories && (
                            <span className="text-gray-600 dark:text-gray-400">
                              Goal: <span className="font-medium text-orange-600 dark:text-orange-400">{selectedPlan.nutritionGoals.dailyCalories} kcal/day</span>
                            </span>
                          )}
                          {selectedPlan.nutritionGoals.dailyProtein && (
                            <span className="text-gray-600 dark:text-gray-400">
                              Protein: <span className="font-medium">{selectedPlan.nutritionGoals.dailyProtein}g/day</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Next →
                      </button>
                    </div>
                  </div>

                  {/* Week View */}
                  <div className="grid grid-cols-7 gap-2">
                    {currentWeekDays.map((day, index) => {
                      const planDay = selectedPlan.days.find(d => isSameDay(d.date, day))
                      const dayNutrition = planDay ? calculateDayNutrition(planDay.meals) : null

                      return (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50"
                        >
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {format(day, 'EEE')}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white mb-2">
                            {format(day, 'MMM d')}
                          </div>
                          {planDay && (
                            <div className="space-y-1 text-xs">
                              {planDay.meals.length > 0 ? (
                                <>
                                  <div className="text-gray-600 dark:text-gray-400 mb-2">
                                    {planDay.meals.length} meal{planDay.meals.length !== 1 ? 's' : ''}
                                  </div>
                                  <div className="space-y-1 mb-2">
                                    {planDay.meals.slice(0, 2).map((meal, idx) => (
                                      <div key={idx} className="text-gray-700 dark:text-gray-300 truncate">
                                        {meal.time && <span className="text-gray-500">{meal.time} </span>}
                                        <span className="capitalize">{meal.category}:</span> {meal.mealName}
                                      </div>
                                    ))}
                                    {planDay.meals.length > 2 && (
                                      <div className="text-gray-500 dark:text-gray-400">
                                        +{planDay.meals.length - 2} more
                                      </div>
                                    )}
                                  </div>
                                  {dayNutrition && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <div className="space-y-1">
                                        {selectedPlan.nutritionGoals?.dailyCalories && (
                                          <div>
                                            <div className="flex justify-between text-xs mb-0.5">
                                              <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                                              <span className="text-orange-600 dark:text-orange-400 font-medium">
                                                {dayNutrition.calories}/{selectedPlan.nutritionGoals.dailyCalories}
                                              </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                              <div
                                                className="bg-orange-500 h-1.5 rounded-full"
                                                style={{
                                                  width: `${Math.min((dayNutrition.calories / selectedPlan.nutritionGoals.dailyCalories) * 100, 100)}%`
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                        {!selectedPlan.nutritionGoals?.dailyCalories && (
                                          <div className="text-orange-600 dark:text-orange-400 font-medium text-xs">
                                            {dayNutrition.calories} kcal
                                          </div>
                                        )}
                                        <div className="text-xs">
                                          <span className="text-blue-600 dark:text-blue-400">P: {dayNutrition.protein}g</span>
                                          {selectedPlan.nutritionGoals?.dailyProtein && (
                                            <span className="text-gray-500">/{selectedPlan.nutritionGoals.dailyProtein}g</span>
                                          )}
                                        </div>
                                        <div className="text-xs">
                                          <span className="text-green-600 dark:text-green-400">C: {dayNutrition.carbs}g</span>
                                          {selectedPlan.nutritionGoals?.dailyCarbs && (
                                            <span className="text-gray-500">/{selectedPlan.nutritionGoals.dailyCarbs}g</span>
                                          )}
                                        </div>
                                        <div className="text-xs">
                                          <span className="text-purple-600 dark:text-purple-400">F: {dayNutrition.fat}g</span>
                                          {selectedPlan.nutritionGoals?.dailyFat && (
                                            <span className="text-gray-500">/{selectedPlan.nutritionGoals.dailyFat}g</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-gray-500 dark:text-gray-400 text-xs">
                                  No meals planned
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => setEditingDay(day)}
                            className="mt-2 w-full text-xs px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                          >
                            {planDay ? 'Edit Meals' : 'Add Meal'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a meal plan
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a plan from the list to view and edit meals
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Meal Plan Templates
              </h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose a template to get started with pre-configured meal plans for your fitness goals
            </p>
            <div className="space-y-6">
              {getAllMealPlanTemplates().map((category) => (
                <div key={category.category}>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {category.category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.templates.map((template, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectTemplate(template)}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 cursor-pointer transition-colors bg-gray-50 dark:bg-gray-900/50"
                      >
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {template.name}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {template.description}
                        </p>
                        {template.nutritionGoals && (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                              <span className="font-medium text-orange-600 dark:text-orange-400">
                                {template.nutritionGoals.dailyCalories} kcal/day
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                {template.nutritionGoals.dailyProtein}g/day
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {template.nutritionGoals.dailyCarbs}g/day
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                              <span className="font-medium text-purple-600 dark:text-purple-400">
                                {template.nutritionGoals.dailyFat}g/day
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowTemplates(false)
                  setShowNewPlanModal(true)
                }}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Create Empty Plan Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedTemplate ? 'Customize Meal Plan Template' : 'Create New Meal Plan'}
            </h3>
            {selectedTemplate && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Template:</strong> {selectedTemplate.name}
                </p>
                {selectedTemplate.description && (
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g., Weekly Meal Plan"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Describe your meal plan..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newPlanStartDate}
                    onChange={(e) => setNewPlanStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newPlanDuration}
                    onChange={(e) => setNewPlanDuration(parseInt(e.target.value) || 7)}
                    min={1}
                    max={30}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreatePlan}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Create Plan
                </button>
                <button
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meal Editor Modal */}
      {editingDay && selectedPlan && (
        <MealEditor
          dayDate={editingDay}
          existingMeals={selectedPlan.days.find(d => isSameDay(d.date, editingDay))?.meals || []}
          onSave={(meals) => handleSaveDayMeals(editingDay, meals)}
          onClose={() => setEditingDay(null)}
        />
      )}
    </div>
  )
}

