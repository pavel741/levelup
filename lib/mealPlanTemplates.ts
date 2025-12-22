/**
 * Meal Plan Templates
 * Pre-built meal plans for common fitness goals
 */

import type { MealPlan, PlannedMeal, NutritionInfo } from '@/types/nutrition'

const createMeal = (
  name: string,
  category: PlannedMeal['category'],
  nutrition: NutritionInfo,
  time?: string
): PlannedMeal => ({
  mealName: name,
  category,
  servings: 1,
  nutrition,
  time,
})

// High-protein breakfast
const highProteinBreakfast = createMeal(
  'High-Protein Breakfast',
  'breakfast',
  { calories: 450, protein: 35, carbs: 40, fat: 15 },
  '08:00'
)

// Balanced lunch
const balancedLunch = createMeal(
  'Balanced Lunch',
  'lunch',
  { calories: 600, protein: 40, carbs: 60, fat: 20 },
  '12:30'
)

// High-protein dinner
const highProteinDinner = createMeal(
  'High-Protein Dinner',
  'dinner',
  { calories: 650, protein: 50, carbs: 50, fat: 25 },
  '18:30'
)

// Pre-workout snack
const preWorkoutSnack = createMeal(
  'Pre-Workout Snack',
  'pre-workout',
  { calories: 200, protein: 10, carbs: 30, fat: 5 },
  '16:00'
)

// Post-workout meal
const postWorkoutMeal = createMeal(
  'Post-Workout Meal',
  'post-workout',
  { calories: 500, protein: 40, carbs: 60, fat: 10 },
  '19:30'
)

// Healthy snack
const healthySnack = createMeal(
  'Healthy Snack',
  'snack',
  { calories: 150, protein: 10, carbs: 15, fat: 8 },
  '15:00'
)

// Muscle Gain / Bulking Templates
export const MUSCLE_GAIN_TEMPLATES: Partial<MealPlan>[] = [
  {
    name: 'High-Protein Bulking Plan',
    description: 'Designed for muscle gain with high protein and calorie surplus. ~3000 calories/day',
    nutritionGoals: {
      dailyCalories: 3000,
      dailyProtein: 180,
      dailyCarbs: 350,
      dailyFat: 100,
    },
  },
  {
    name: 'Lean Bulking Plan',
    description: 'Moderate calorie surplus for lean muscle gain. ~2800 calories/day',
    nutritionGoals: {
      dailyCalories: 2800,
      dailyProtein: 170,
      dailyCarbs: 320,
      dailyFat: 90,
    },
  },
  {
    name: 'Aggressive Bulking Plan',
    description: 'High calorie surplus for maximum muscle gain. ~3500 calories/day',
    nutritionGoals: {
      dailyCalories: 3500,
      dailyProtein: 200,
      dailyCarbs: 400,
      dailyFat: 120,
    },
  },
]

// Cutting / Weight Loss Templates
export const CUTTING_TEMPLATES: Partial<MealPlan>[] = [
  {
    name: 'Moderate Cut Plan',
    description: 'Moderate calorie deficit for steady fat loss. ~2000 calories/day',
    nutritionGoals: {
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 200,
      dailyFat: 60,
    },
  },
  {
    name: 'Aggressive Cut Plan',
    description: 'Higher calorie deficit for faster fat loss. ~1700 calories/day',
    nutritionGoals: {
      dailyCalories: 1700,
      dailyProtein: 140,
      dailyCarbs: 150,
      dailyFat: 50,
    },
  },
  {
    name: 'High-Protein Cut Plan',
    description: 'High protein to preserve muscle during cut. ~1900 calories/day',
    nutritionGoals: {
      dailyCalories: 1900,
      dailyProtein: 160,
      dailyCarbs: 180,
      dailyFat: 55,
    },
  },
]

// Maintenance Templates
export const MAINTENANCE_TEMPLATES: Partial<MealPlan>[] = [
  {
    name: 'Balanced Maintenance Plan',
    description: 'Maintain current weight with balanced macros. ~2400 calories/day',
    nutritionGoals: {
      dailyCalories: 2400,
      dailyProtein: 150,
      dailyCarbs: 280,
      dailyFat: 75,
    },
  },
  {
    name: 'High-Protein Maintenance',
    description: 'Maintenance with higher protein for muscle preservation. ~2500 calories/day',
    nutritionGoals: {
      dailyCalories: 2500,
      dailyProtein: 180,
      dailyCarbs: 270,
      dailyFat: 80,
    },
  },
]

/**
 * Generate a meal plan from a template
 */
export function generateMealPlanFromTemplate(
  template: Partial<MealPlan>,
  userId: string,
  startDate: Date,
  duration: number = 7
): MealPlan {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + duration - 1)

  // Generate daily meals based on template goals
  const dailyCalories = template.nutritionGoals?.dailyCalories || 2400
  const dailyProtein = template.nutritionGoals?.dailyProtein || 150
  const dailyCarbs = template.nutritionGoals?.dailyCarbs || 280
  const dailyFat = template.nutritionGoals?.dailyFat || 75

  // Determine meal distribution based on goal
  const isBulking = dailyCalories >= 2800
  const isCutting = dailyCalories <= 2000

  const generateDayMeals = (): PlannedMeal[] => {
    const meals: PlannedMeal[] = []

    if (isBulking) {
      // Bulking: 4-5 meals per day
      meals.push({
        ...highProteinBreakfast,
        nutrition: {
          calories: Math.round(dailyCalories * 0.25),
          protein: Math.round(dailyProtein * 0.25),
          carbs: Math.round(dailyCarbs * 0.25),
          fat: Math.round(dailyFat * 0.25),
        },
      })
      meals.push({
        ...healthySnack,
        nutrition: {
          calories: Math.round(dailyCalories * 0.10),
          protein: Math.round(dailyProtein * 0.10),
          carbs: Math.round(dailyCarbs * 0.10),
          fat: Math.round(dailyFat * 0.10),
        },
        time: '10:30',
      })
      meals.push({
        ...balancedLunch,
        nutrition: {
          calories: Math.round(dailyCalories * 0.30),
          protein: Math.round(dailyProtein * 0.30),
          carbs: Math.round(dailyCarbs * 0.30),
          fat: Math.round(dailyFat * 0.30),
        },
      })
      meals.push({
        ...preWorkoutSnack,
        nutrition: {
          calories: Math.round(dailyCalories * 0.15),
          protein: Math.round(dailyProtein * 0.15),
          carbs: Math.round(dailyCarbs * 0.20),
          fat: Math.round(dailyFat * 0.10),
        },
      })
      meals.push({
        ...postWorkoutMeal,
        nutrition: {
          calories: Math.round(dailyCalories * 0.20),
          protein: Math.round(dailyProtein * 0.20),
          carbs: Math.round(dailyCarbs * 0.15),
          fat: Math.round(dailyFat * 0.25),
        },
      })
    } else if (isCutting) {
      // Cutting: 3-4 meals per day, higher protein
      meals.push({
        ...highProteinBreakfast,
        nutrition: {
          calories: Math.round(dailyCalories * 0.30),
          protein: Math.round(dailyProtein * 0.30),
          carbs: Math.round(dailyCarbs * 0.25),
          fat: Math.round(dailyFat * 0.30),
        },
      })
      meals.push({
        ...balancedLunch,
        nutrition: {
          calories: Math.round(dailyCalories * 0.35),
          protein: Math.round(dailyProtein * 0.35),
          carbs: Math.round(dailyCarbs * 0.35),
          fat: Math.round(dailyFat * 0.35),
        },
      })
      meals.push({
        ...healthySnack,
        nutrition: {
          calories: Math.round(dailyCalories * 0.10),
          protein: Math.round(dailyProtein * 0.15),
          carbs: Math.round(dailyCarbs * 0.10),
          fat: Math.round(dailyFat * 0.10),
        },
        time: '15:00',
      })
      meals.push({
        ...highProteinDinner,
        nutrition: {
          calories: Math.round(dailyCalories * 0.25),
          protein: Math.round(dailyProtein * 0.20),
          carbs: Math.round(dailyCarbs * 0.30),
          fat: Math.round(dailyFat * 0.25),
        },
      })
    } else {
      // Maintenance: Balanced 3-4 meals
      meals.push({
        ...highProteinBreakfast,
        nutrition: {
          calories: Math.round(dailyCalories * 0.25),
          protein: Math.round(dailyProtein * 0.25),
          carbs: Math.round(dailyCarbs * 0.25),
          fat: Math.round(dailyFat * 0.25),
        },
      })
      meals.push({
        ...balancedLunch,
        nutrition: {
          calories: Math.round(dailyCalories * 0.35),
          protein: Math.round(dailyProtein * 0.35),
          carbs: Math.round(dailyCarbs * 0.35),
          fat: Math.round(dailyFat * 0.35),
        },
      })
      meals.push({
        ...healthySnack,
        nutrition: {
          calories: Math.round(dailyCalories * 0.15),
          protein: Math.round(dailyProtein * 0.15),
          carbs: Math.round(dailyCarbs * 0.15),
          fat: Math.round(dailyFat * 0.15),
        },
        time: '15:00',
      })
      meals.push({
        ...highProteinDinner,
        nutrition: {
          calories: Math.round(dailyCalories * 0.25),
          protein: Math.round(dailyProtein * 0.25),
          carbs: Math.round(dailyCarbs * 0.25),
          fat: Math.round(dailyFat * 0.25),
        },
      })
    }

    return meals
  }

  // Generate days
  const days = []
  for (let i = 0; i < duration; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    const dayMeals = generateDayMeals()
    const totalNutrition = dayMeals.reduce(
      (total, meal) => ({
        calories: total.calories + meal.nutrition.calories,
        protein: total.protein + meal.nutrition.protein,
        carbs: total.carbs + meal.nutrition.carbs,
        fat: total.fat + meal.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    days.push({
      date,
      meals: dayMeals,
      totalNutrition,
    })
  }

  return {
    id: `mealplan_${Date.now()}`,
    userId,
    name: template.name || 'Meal Plan',
    description: template.description,
    startDate,
    endDate,
    days,
    nutritionGoals: template.nutritionGoals,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Get all available templates grouped by category
 */
export function getAllMealPlanTemplates(): {
  category: string
  templates: Partial<MealPlan>[]
}[] {
  return [
    {
      category: 'Muscle Gain / Bulking',
      templates: MUSCLE_GAIN_TEMPLATES,
    },
    {
      category: 'Cutting / Weight Loss',
      templates: CUTTING_TEMPLATES,
    },
    {
      category: 'Maintenance',
      templates: MAINTENANCE_TEMPLATES,
    },
  ]
}

