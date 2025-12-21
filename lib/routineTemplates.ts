/**
 * Pre-built Routine Templates
 * Popular workout splits for 3-4 times per week
 */

import type { Routine, RoutineSession } from '@/types/workout'

export const ROUTINE_TEMPLATES: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isTemplate' | 'isPublic' | 'rating' | 'timesUsed'>[] = [
  // Push/Pull/Legs (3 days per week)
  {
    name: 'Push/Pull/Legs (3-Day Split)',
    description: 'Classic 3-day split focusing on push movements (chest, shoulders, triceps), pull movements (back, biceps), and legs. Perfect for 3 workouts per week.',
    goal: 'strength',
    exercises: [], // Deprecated - using sessions instead
    sessions: [
      {
        id: 'push-day',
        name: 'Push Day',
        order: 0,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Main compound movement'
          },
          {
            exerciseId: 'overhead-press',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'dumbbell-flyes',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'lateral-raises',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 45 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 45 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 45 }
            ],
            restTime: 45
          },
          {
            exerciseId: 'tricep-dips',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 75
      },
      {
        id: 'pull-day',
        name: 'Pull Day',
        order: 1,
        exercises: [
          {
            exerciseId: 'deadlift',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120,
            notes: 'Main compound movement - focus on form'
          },
          {
            exerciseId: 'pull-ups',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Use assistance if needed'
          },
          {
            exerciseId: 'barbell-row',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'bicep-curls',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 80
      },
      {
        id: 'leg-day',
        name: 'Leg Day',
        order: 2,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120,
            notes: 'Main compound movement'
          },
          {
            exerciseId: 'lunges',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Each leg'
          },
          {
            exerciseId: 'leg-press',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'plank',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 45, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Hold for duration'
          }
        ],
        estimatedDuration: 70
      }
    ],
    estimatedDuration: 75,
    difficulty: 'medium',
    tags: ['push-pull-legs', '3-day', 'strength', 'barbell', 'dumbbell', 'bodyweight']
  },

  // Upper/Lower Split (4 days per week)
  {
    name: 'Upper/Lower Split (4-Day)',
    description: '4-day split alternating upper body and lower body workouts. Great for balanced development and 4 workouts per week.',
    goal: 'strength',
    exercises: [],
    sessions: [
      {
        id: 'upper-day-1',
        name: 'Upper Body Day 1',
        order: 0,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'barbell-row',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'overhead-press',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'pull-ups',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'bicep-curls',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'tricep-dips',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 70
      },
      {
        id: 'lower-day-1',
        name: 'Lower Body Day 1',
        order: 1,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'deadlift',
            order: 1,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'lunges',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Each leg'
          },
          {
            exerciseId: 'plank',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 45, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 75
      },
      {
        id: 'upper-day-2',
        name: 'Upper Body Day 2',
        order: 2,
        exercises: [
          {
            exerciseId: 'overhead-press',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'pull-ups',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'dumbbell-flyes',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'barbell-row',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          }
        ],
        estimatedDuration: 65
      },
      {
        id: 'lower-day-2',
        name: 'Lower Body Day 2',
        order: 3,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'leg-press',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'lunges',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Each leg'
          }
        ],
        estimatedDuration: 70
      }
    ],
    estimatedDuration: 70,
    difficulty: 'medium',
    tags: ['upper-lower', '4-day', 'strength', 'barbell', 'bodyweight']
  },

  // Full Body (3-4 days per week)
  {
    name: 'Full Body Workout (3-4 Day)',
    description: 'Complete full-body workout hitting all major muscle groups. Perfect for 3-4 workouts per week. Great for beginners and those short on time.',
    goal: 'maintenance',
    exercises: [],
    sessions: [
      {
        id: 'full-body-day',
        name: 'Full Body Day',
        order: 0,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Start with legs'
          },
          {
            exerciseId: 'bench-press',
            order: 1,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'barbell-row',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'overhead-press',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'deadlift',
            order: 4,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120,
            notes: 'Focus on form'
          },
          {
            exerciseId: 'pull-ups',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'push-ups',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'plank',
            order: 7,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 60, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 80
      }
    ],
    estimatedDuration: 80,
    difficulty: 'medium',
    tags: ['full-body', '3-4-day', 'strength', 'barbell', 'bodyweight']
  },

  // Bodyweight Focus (3-4 days per week)
  {
    name: 'Bodyweight Strength (3-4 Day)',
    description: 'No equipment needed! Bodyweight-focused routine perfect for home workouts. 3-4 times per week.',
    goal: 'strength',
    exercises: [],
    sessions: [
      {
        id: 'bodyweight-day',
        name: 'Bodyweight Day',
        order: 0,
        exercises: [
          {
            exerciseId: 'push-ups',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'pull-ups',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Use assistance if needed'
          },
          {
            exerciseId: 'squat',
            order: 2,
            sets: [
              { setType: 'warmup', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 20, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 20, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Bodyweight squats'
          },
          {
            exerciseId: 'lunges',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Each leg'
          },
          {
            exerciseId: 'tricep-dips',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'plank',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 45, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'crunches',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 20, targetWeight: undefined, restAfter: 45 },
              { setType: 'working', targetReps: 20, targetWeight: undefined, restAfter: 45 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 45 }
            ],
            restTime: 45
          },
          {
            exerciseId: 'jumping-jacks',
            order: 7,
            sets: [
              { setType: 'working', targetReps: 30, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 30, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 25, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Cardio finisher'
          }
        ],
        estimatedDuration: 50
      }
    ],
    estimatedDuration: 50,
    difficulty: 'easy',
    tags: ['bodyweight', 'home-workout', '3-4-day', 'no-equipment']
  }
]

/**
 * Get template by name
 */
export function getTemplateByName(name: string) {
  return ROUTINE_TEMPLATES.find(t => t.name === name)
}

/**
 * Get all templates
 */
export function getAllTemplates() {
  return ROUTINE_TEMPLATES
}

/**
 * Get templates by goal
 */
export function getTemplatesByGoal(goal: Routine['goal']) {
  return ROUTINE_TEMPLATES.filter(t => t.goal === goal)
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(difficulty: Routine['difficulty']) {
  return ROUTINE_TEMPLATES.filter(t => t.difficulty === difficulty)
}
