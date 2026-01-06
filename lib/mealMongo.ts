/**
 * MongoDB functions for meal plans and recipes
 */

import { getDatabase } from './mongodb'
import type { MealPlan, Recipe, ShoppingList } from '@/types/nutrition'

// ---------- Collection helpers ----------

const getMealPlansCollection = async () => {
  const db = await getDatabase()
  return db.collection('meal_plans')
}

const getRecipesCollection = async () => {
  const db = await getDatabase()
  return db.collection('recipes')
}

const getShoppingListsCollection = async () => {
  const db = await getDatabase()
  return db.collection('shopping_lists')
}

// ---------- Meal Plans ----------

export const getMealPlansByUserId = async (userId: string): Promise<MealPlan[]> => {
  try {
    const collection = await getMealPlansCollection()
    const mealPlans = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()
    
    return mealPlans.map(plan => {
      const { _id, ...planData } = plan
      return {
        ...planData,
        id: planData.id || _id?.toString() || '',
        startDate: planData.startDate instanceof Date ? planData.startDate : new Date(planData.startDate),
        endDate: planData.endDate instanceof Date ? planData.endDate : new Date(planData.endDate),
        createdAt: planData.createdAt instanceof Date ? planData.createdAt : new Date(planData.createdAt),
        updatedAt: planData.updatedAt instanceof Date ? planData.updatedAt : new Date(planData.updatedAt),
        days: (planData.days || []).map((day: any) => ({
          ...day,
          date: day.date instanceof Date ? day.date : new Date(day.date),
          meals: day.meals || [],
          totalNutrition: day.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        })),
      } as MealPlan
    })
  } catch (error) {
    console.error('Error fetching meal plans:', error)
    throw error
  }
}

export const getMealPlanById = async (mealPlanId: string, userId: string): Promise<MealPlan | null> => {
  try {
    const collection = await getMealPlansCollection()
    const mealPlan = await collection.findOne({ id: mealPlanId, userId })
    
    if (!mealPlan) return null
    
    const { _id, ...planData } = mealPlan
    return {
      ...planData,
      id: planData.id || _id?.toString() || '',
      startDate: planData.startDate instanceof Date ? planData.startDate : new Date(planData.startDate),
      endDate: planData.endDate instanceof Date ? planData.endDate : new Date(planData.endDate),
      createdAt: planData.createdAt instanceof Date ? planData.createdAt : new Date(planData.createdAt),
      updatedAt: planData.updatedAt instanceof Date ? planData.updatedAt : new Date(planData.updatedAt),
      days: (planData.days || []).map((day: any) => ({
        ...day,
        date: day.date instanceof Date ? day.date : new Date(day.date),
        meals: day.meals || [],
        totalNutrition: day.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      })),
    } as MealPlan
  } catch (error) {
    console.error('Error fetching meal plan:', error)
    throw error
  }
}

export const saveMealPlan = async (mealPlan: MealPlan): Promise<void> => {
  try {
    const collection = await getMealPlansCollection()
    await collection.updateOne(
      { id: mealPlan.id },
      { $set: { ...mealPlan, updatedAt: new Date() } },
      { upsert: true }
    )
  } catch (error: any) {
    console.error('Error saving meal plan:', error)
    // Provide more specific error messages
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      throw new Error('Database connection timeout. MongoDB may be blocked in your network environment.')
    }
    if (error.message?.includes('Server selection timed out')) {
      throw new Error('MongoDB server selection timed out. Please check your network connection or try again later.')
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
    const collection = await getMealPlansCollection()
    await collection.updateOne(
      { id: mealPlanId, userId },
      { $set: { ...updates, updatedAt: new Date() } }
    )
  } catch (error) {
    console.error('Error updating meal plan:', error)
    throw error
  }
}

export const deleteMealPlan = async (mealPlanId: string, userId: string): Promise<void> => {
  try {
    const collection = await getMealPlansCollection()
    const result = await collection.deleteOne({ id: mealPlanId, userId })
    
    if (result.deletedCount === 0) {
      // Try deleting by id only (in case userId wasn't saved correctly)
      const resultById = await collection.deleteOne({ id: mealPlanId })
      if (resultById.deletedCount === 0) {
        throw new Error(`Meal plan with id "${mealPlanId}" not found`)
      }
    }
  } catch (error) {
    console.error('Error deleting meal plan:', error)
    throw error
  }
}

// ---------- Recipes ----------

export const getRecipesByUserId = async (userId?: string): Promise<Recipe[]> => {
  try {
    const collection = await getRecipesCollection()
    const query = userId ? { userId } : { isPublic: true }
    const recipes = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
    
    return recipes.map(recipe => {
      const { _id, ...recipeData } = recipe
      return {
        ...recipeData,
        id: recipeData.id || _id?.toString() || '',
        createdAt: recipeData.createdAt instanceof Date ? recipeData.createdAt : new Date(recipeData.createdAt),
        updatedAt: recipeData.updatedAt instanceof Date ? recipeData.updatedAt : new Date(recipeData.updatedAt),
        ingredients: recipeData.ingredients || [],
        tags: recipeData.tags || [],
      } as Recipe
    })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    throw error
  }
}

export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  try {
    const collection = await getRecipesCollection()
    const recipe = await collection.findOne({ id: recipeId })
    
    if (!recipe) return null
    
    const { _id, ...recipeData } = recipe
    return {
      ...recipeData,
      id: recipeData.id || _id?.toString() || '',
      createdAt: recipeData.createdAt instanceof Date ? recipeData.createdAt : new Date(recipeData.createdAt),
      updatedAt: recipeData.updatedAt instanceof Date ? recipeData.updatedAt : new Date(recipeData.updatedAt),
      ingredients: recipeData.ingredients || [],
      tags: recipeData.tags || [],
    } as Recipe
  } catch (error) {
    console.error('Error fetching recipe:', error)
    throw error
  }
}

export const saveRecipe = async (recipe: Recipe): Promise<void> => {
  try {
    const collection = await getRecipesCollection()
    await collection.updateOne(
      { id: recipe.id },
      { $set: { ...recipe, updatedAt: new Date() } },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error saving recipe:', error)
    throw error
  }
}

export const deleteRecipe = async (recipeId: string, userId: string): Promise<void> => {
  try {
    const collection = await getRecipesCollection()
    await collection.deleteOne({ id: recipeId, userId })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    throw error
  }
}

// ---------- Shopping Lists ----------

export const getShoppingListsByUserId = async (userId: string): Promise<ShoppingList[]> => {
  try {
    const collection = await getShoppingListsCollection()
    const lists = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()
    
    return lists.map(list => {
      const { _id, ...listData } = list
      return {
        ...listData,
        id: listData.id || _id?.toString() || '',
        createdAt: listData.createdAt instanceof Date ? listData.createdAt : new Date(listData.createdAt),
        updatedAt: listData.updatedAt instanceof Date ? listData.updatedAt : new Date(listData.updatedAt),
        items: listData.items || [],
      } as ShoppingList
    })
  } catch (error) {
    console.error('Error fetching shopping lists:', error)
    throw error
  }
}

export const saveShoppingList = async (shoppingList: ShoppingList): Promise<void> => {
  try {
    const collection = await getShoppingListsCollection()
    await collection.updateOne(
      { id: shoppingList.id },
      { $set: { ...shoppingList, updatedAt: new Date() } },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error saving shopping list:', error)
    throw error
  }
}

