/**
 * Client-side API wrapper for meal plans (calls server-side MongoDB via API routes)
 */

import type { MealPlan, Recipe, ShoppingList } from '@/types/nutrition'

const API_BASE = '/api/meals'

// ---------- Meal Plans ----------

export const subscribeToMealPlans = (
  userId: string,
  callback: (mealPlans: MealPlan[]) => void
): (() => void) => {
  // Polling-based subscription (can be upgraded to WebSocket later)
  let isActive = true
  
  const fetchMealPlans = async () => {
    if (!isActive) return
    
    try {
      const response = await fetch(`${API_BASE}/plans?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        callback(data)
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error)
    }
  }
  
  fetchMealPlans()
  const interval = setInterval(fetchMealPlans, 30000) // Poll every 30 seconds (reduced frequency)
  
  return () => {
    isActive = false
    clearInterval(interval)
  }
}

export const getMealPlans = async (userId: string): Promise<MealPlan[]> => {
  const response = await fetch(`${API_BASE}/plans?userId=${userId}`)
  if (!response.ok) throw new Error('Failed to fetch meal plans')
  return response.json()
}

export const getMealPlan = async (mealPlanId: string, userId: string): Promise<MealPlan> => {
  const response = await fetch(`${API_BASE}/plans/${mealPlanId}?userId=${userId}`)
  if (!response.ok) throw new Error('Failed to fetch meal plan')
  return response.json()
}

export const saveMealPlan = async (mealPlan: MealPlan): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mealPlan),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `Failed to save meal plan (${response.status})`
      throw new Error(errorMessage)
    }
  } catch (error: any) {
    // Provide more helpful error messages
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      throw new Error('Database connection timeout. MongoDB may be blocked in your network. Please try again later or use a different network.')
    }
    throw error
  }
}

export const updateMealPlan = async (
  mealPlanId: string,
  userId: string,
  updates: Partial<MealPlan>
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/plans/${mealPlanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `Failed to update meal plan (${response.status})`
      throw new Error(errorMessage)
    }
  } catch (error: any) {
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      throw new Error('Database connection timeout. MongoDB may be blocked in your network.')
    }
    throw error
  }
}

export const deleteMealPlan = async (mealPlanId: string, userId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/plans/${mealPlanId}?userId=${userId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `Failed to delete meal plan (${response.status})`
      throw new Error(errorMessage)
    }
  } catch (error: any) {
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      throw new Error('Database connection timeout. MongoDB may be blocked in your network.')
    }
    throw error
  }
}

// ---------- Recipes ----------

export const getRecipes = async (userId?: string): Promise<Recipe[]> => {
  const url = userId ? `${API_BASE}/recipes?userId=${userId}` : `${API_BASE}/recipes`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch recipes')
  return response.json()
}

export const saveRecipe = async (recipe: Recipe): Promise<void> => {
  const response = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe),
  })
  if (!response.ok) throw new Error('Failed to save recipe')
}

export const deleteRecipe = async (recipeId: string, userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/recipes/${recipeId}?userId=${userId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete recipe')
}

// ---------- Shopping Lists ----------

export const getShoppingLists = async (userId: string): Promise<ShoppingList[]> => {
  const response = await fetch(`${API_BASE}/shopping-lists?userId=${userId}`)
  if (!response.ok) throw new Error('Failed to fetch shopping lists')
  return response.json()
}

export const saveShoppingList = async (shoppingList: ShoppingList): Promise<void> => {
  const response = await fetch(`${API_BASE}/shopping-lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shoppingList),
  })
  if (!response.ok) throw new Error('Failed to save shopping list')
}

export const deleteShoppingList = async (listId: string, userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/shopping-lists/${listId}?userId=${userId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete shopping list')
}

