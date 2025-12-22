/**
 * Meal Planner & Nutrition Types
 */

export interface Meal {
  id: string
  name: string
  description?: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout'
  ingredients: Ingredient[]
  instructions?: string[]
  prepTime?: number // minutes
  cookTime?: number // minutes
  servings: number
  nutrition: NutritionInfo
  tags: string[] // e.g., 'high-protein', 'vegetarian', 'quick', 'meal-prep'
  imageUrl?: string
  source?: string // Recipe source URL or name
  createdAt: Date
  updatedAt: Date
}

export interface Ingredient {
  name: string
  amount: number
  unit: 'g' | 'kg' | 'ml' | 'l' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'serving'
  notes?: string // e.g., "chopped", "diced"
}

export interface NutritionInfo {
  calories: number
  protein: number // grams
  carbs: number // grams
  fat: number // grams
  fiber?: number // grams
  sugar?: number // grams
  sodium?: number // mg
}

export interface MealPlan {
  id: string
  userId: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  days: MealPlanDay[]
  nutritionGoals?: NutritionGoals
  linkedRoutineId?: string // Optional: link to workout routine
  createdAt: Date
  updatedAt: Date
}

export interface MealPlanDay {
  date: Date
  meals: PlannedMeal[]
  totalNutrition: NutritionInfo
  notes?: string
  workoutDay?: boolean // If linked to workout routine
}

export interface PlannedMeal {
  mealId?: string // Reference to Meal if using existing meal
  mealName: string // Name if custom meal
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout'
  servings: number
  nutrition: NutritionInfo
  ingredients?: Ingredient[] // If custom meal
  time?: string // e.g., "08:00", "12:30"
  notes?: string
}

export interface NutritionGoals {
  dailyCalories?: number
  dailyProtein?: number // grams
  dailyCarbs?: number // grams
  dailyFat?: number // grams
  weeklyCalories?: number
}

export interface Recipe {
  id: string
  userId?: string // If user-created, otherwise system recipe
  name: string
  description?: string
  ingredients: Ingredient[]
  instructions: string[]
  prepTime?: number
  cookTime?: number
  servings: number
  nutrition: NutritionInfo
  tags: string[]
  imageUrl?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ShoppingList {
  id: string
  userId: string
  mealPlanId?: string
  items: ShoppingListItem[]
  createdAt: Date
  updatedAt: Date
}

export interface ShoppingListItem {
  ingredient: string
  totalAmount: number
  unit: 'g' | 'kg' | 'ml' | 'l' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'serving'
  category?: string // e.g., "produce", "meat", "dairy", "pantry"
  checked: boolean
  notes?: string
}

