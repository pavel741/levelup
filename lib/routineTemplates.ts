/**
 * Pre-built Routine Templates
 * Popular workout splits for 3-4 times per week
 */

import type { Routine } from '@/types/workout'

// Helper function to create sets from rep scheme
// e.g., "4 x 15,12,10,8 reps" -> 4 sets with reps [15, 12, 10, 8]
function createSets(repScheme: string): Array<{ setType: 'working', targetReps: number, restAfter: number }> {
  // Parse patterns like "4 x 15,12,10,8 reps" or "3 x 8 reps"
  const match = repScheme.match(/(\d+)\s*x\s*(.+?)\s*reps/i)
  if (!match) {
    throw new Error(`Invalid rep scheme: ${repScheme}`)
  }
  
  const numSets = parseInt(match[1])
  const repsStr = match[2].trim()
  
  // Check if it's a single rep count or multiple
  if (repsStr.includes(',')) {
    // Multiple rep counts: "15,12,10,8"
    const reps = repsStr.split(',').map(r => parseInt(r.trim()))
    return reps.map((reps) => ({
      setType: 'working' as const,
      targetReps: reps,
      restAfter: 90 // Default 90 seconds rest
    }))
  } else {
    // Single rep count: "8"
    const reps = parseInt(repsStr)
    return Array(numSets).fill(null).map(() => ({
      setType: 'working' as const,
      targetReps: reps,
      restAfter: 90
    }))
  }
}

export const ROUTINE_TEMPLATES: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isTemplate' | 'isPublic' | 'rating' | 'timesUsed'>[] = [
  // Morning Stretch Routines
  {
    name: 'Quick Morning Stretch (5 min)',
    description: 'A quick 5-minute morning stretch routine to wake up your body and improve flexibility. Perfect for starting your day.',
    goal: 'custom',
    exercises: [],
    sessions: [
      {
        id: 'morning-stretch-quick',
        name: 'Morning Stretch',
        order: 0,
        exercises: [
          {
            exerciseId: 'neck-stretch',
            order: 0,
            sets: [
              { setType: 'working', targetDuration: 15, restAfter: 0 },
              { setType: 'working', targetDuration: 15, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'shoulder-stretch',
            order: 1,
            sets: [
              { setType: 'working', targetDuration: 20, restAfter: 0 },
              { setType: 'working', targetDuration: 20, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'standing-forward-fold',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'quad-stretch',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 20, restAfter: 0 },
              { setType: 'working', targetDuration: 20, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'cat-cow',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 10, restAfter: 10 }
            ],
            restTime: 10
          }
        ],
        estimatedDuration: 5
      }
    ],
    estimatedDuration: 5,
    difficulty: 'easy',
    tags: ['morning', 'stretch', 'flexibility', 'quick', 'daily']
  },
  {
    name: 'Full Body Morning Stretch (10 min)',
    description: 'A comprehensive 10-minute morning stretch routine targeting all major muscle groups. Great for improving flexibility and mobility.',
    goal: 'custom',
    exercises: [],
    sessions: [
      {
        id: 'morning-stretch-full',
        name: 'Full Body Stretch',
        order: 0,
        exercises: [
          {
            exerciseId: 'neck-stretch',
            order: 0,
            sets: [
              { setType: 'working', targetDuration: 20, restAfter: 0 },
              { setType: 'working', targetDuration: 20, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'shoulder-stretch',
            order: 1,
            sets: [
              { setType: 'working', targetDuration: 25, restAfter: 0 },
              { setType: 'working', targetDuration: 25, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'chest-stretch',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 25, restAfter: 0 },
              { setType: 'working', targetDuration: 25, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'tricep-stretch',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 25, restAfter: 0 },
              { setType: 'working', targetDuration: 25, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'standing-forward-fold',
            order: 4,
            sets: [
              { setType: 'working', targetDuration: 45, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'quad-stretch',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 25, restAfter: 0 },
              { setType: 'working', targetDuration: 25, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'hamstring-stretch',
            order: 6,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'hip-flexor-stretch',
            order: 7,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'calf-stretch',
            order: 8,
            sets: [
              { setType: 'working', targetDuration: 25, restAfter: 0 },
              { setType: 'working', targetDuration: 25, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'spinal-twist',
            order: 9,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'childs-pose',
            order: 10,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 0 }
            ],
            restTime: 0
          }
        ],
        estimatedDuration: 10
      }
    ],
    estimatedDuration: 10,
    difficulty: 'easy',
    tags: ['morning', 'stretch', 'flexibility', 'full-body', 'mobility']
  },
  {
    name: 'Yoga-Inspired Morning Flow (15 min)',
    description: 'A gentle yoga-inspired morning routine combining stretching and mobility. Perfect for flexibility, balance, and mental clarity.',
    goal: 'custom',
    exercises: [],
    sessions: [
      {
        id: 'morning-yoga-flow',
        name: 'Morning Yoga Flow',
        order: 0,
        exercises: [
          {
            exerciseId: 'cat-cow',
            order: 0,
            sets: [
              { setType: 'working', targetReps: 12, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'childs-pose',
            order: 1,
            sets: [
              { setType: 'working', targetDuration: 45, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'standing-forward-fold',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'standing-side-stretch',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 25, restAfter: 0 },
              { setType: 'working', targetDuration: 25, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'quad-stretch',
            order: 4,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'hip-flexor-stretch',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 40, restAfter: 0 },
              { setType: 'working', targetDuration: 40, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'pigeon-pose',
            order: 6,
            sets: [
              { setType: 'working', targetDuration: 45, restAfter: 0 },
              { setType: 'working', targetDuration: 45, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'figure-four-stretch',
            order: 7,
            sets: [
              { setType: 'working', targetDuration: 40, restAfter: 0 },
              { setType: 'working', targetDuration: 40, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'spinal-twist',
            order: 8,
            sets: [
              { setType: 'working', targetDuration: 45, restAfter: 0 },
              { setType: 'working', targetDuration: 45, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'butterfly-stretch',
            order: 9,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'childs-pose',
            order: 10,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 0 }
            ],
            restTime: 0
          }
        ],
        estimatedDuration: 15
      }
    ],
    estimatedDuration: 15,
    difficulty: 'easy',
    tags: ['morning', 'yoga', 'stretch', 'flexibility', 'mobility', 'mindfulness']
  },
  {
    name: 'Desk Worker Morning Stretch (7 min)',
    description: 'Targeted stretches for people who sit at a desk. Focuses on neck, shoulders, back, and hips.',
    goal: 'custom',
    exercises: [],
    sessions: [
      {
        id: 'desk-worker-stretch',
        name: 'Desk Worker Stretch',
        order: 0,
        exercises: [
          {
            exerciseId: 'neck-stretch',
            order: 0,
            sets: [
              { setType: 'working', targetDuration: 25, restAfter: 0 },
              { setType: 'working', targetDuration: 25, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'shoulder-stretch',
            order: 1,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'chest-stretch',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'wrist-stretch',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 20, restAfter: 0 },
              { setType: 'working', targetDuration: 20, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'spinal-twist',
            order: 4,
            sets: [
              { setType: 'working', targetDuration: 40, restAfter: 0 },
              { setType: 'working', targetDuration: 40, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'hip-flexor-stretch',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 35, restAfter: 0 },
              { setType: 'working', targetDuration: 35, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'knee-to-chest',
            order: 6,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 10 }
            ],
            restTime: 10
          },
          {
            exerciseId: 'standing-forward-fold',
            order: 7,
            sets: [
              { setType: 'working', targetDuration: 45, restAfter: 0 }
            ],
            restTime: 0
          }
        ],
        estimatedDuration: 7
      }
    ],
    estimatedDuration: 7,
    difficulty: 'easy',
    tags: ['morning', 'stretch', 'desk-worker', 'office', 'posture', 'flexibility']
  },
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
  },

  // PHUL (Power Hypertrophy Upper Lower) - 4 days
  {
    name: 'PHUL (Power Hypertrophy Upper Lower)',
    description: 'Popular 4-day program combining power and hypertrophy training. Upper Power, Lower Power, Upper Hypertrophy, Lower Hypertrophy.',
    goal: 'bulking',
    exercises: [],
    sessions: [
      {
        id: 'upper-power',
        name: 'Upper Power',
        order: 0,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180,
            notes: 'Focus on strength - heavy weight'
          },
          {
            exerciseId: 'barbell-row',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          },
          {
            exerciseId: 'overhead-press',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'lat-pulldown',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'bicep-curls',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'tricep-pushdown',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          }
        ],
        estimatedDuration: 85
      },
      {
        id: 'lower-power',
        name: 'Lower Power',
        order: 1,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180,
            notes: 'Heavy weight, focus on power'
          },
          {
            exerciseId: 'deadlift',
            order: 1,
            sets: [
              { setType: 'warmup', targetReps: 5, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          },
          {
            exerciseId: 'leg-press',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'calf-raises',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 90
      },
      {
        id: 'upper-hypertrophy',
        name: 'Upper Hypertrophy',
        order: 2,
        exercises: [
          {
            exerciseId: 'incline-bench-press',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'dumbbell-flyes',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'seated-row',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'lat-pulldown',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'dumbbell-press-shoulders',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'lateral-raises',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'hammer-curls',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'tricep-pushdown',
            order: 7,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 95
      },
      {
        id: 'lower-hypertrophy',
        name: 'Lower Hypertrophy',
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
            exerciseId: 'romanian-deadlift',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'leg-press',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'leg-curls',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'leg-extensions',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'calf-raises',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 90
      }
    ],
    estimatedDuration: 90,
    difficulty: 'hard',
    tags: ['phul', '4-day', 'bulking', 'power', 'hypertrophy', 'barbell', 'dumbbell']
  },

  // StrongLifts 5x5 - Beginner Strength (3 days)
  {
    name: 'StrongLifts 5x5',
    description: 'Simple and effective 3-day beginner strength program. Focus on 5 compound lifts: Squat, Bench Press, Barbell Row, Overhead Press, Deadlift. 5 sets of 5 reps.',
    goal: 'strength',
    exercises: [],
    sessions: [
      {
        id: 'workout-a',
        name: 'Workout A',
        order: 0,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 5, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180,
            notes: 'Every workout starts with squats'
          },
          {
            exerciseId: 'bench-press',
            order: 1,
            sets: [
              { setType: 'warmup', targetReps: 5, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          },
          {
            exerciseId: 'barbell-row',
            order: 2,
            sets: [
              { setType: 'warmup', targetReps: 5, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          }
        ],
        estimatedDuration: 75
      },
      {
        id: 'workout-b',
        name: 'Workout B',
        order: 1,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 5, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          },
          {
            exerciseId: 'overhead-press',
            order: 1,
            sets: [
              { setType: 'warmup', targetReps: 5, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          },
          {
            exerciseId: 'deadlift',
            order: 2,
            sets: [
              { setType: 'warmup', targetReps: 5, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180,
            notes: 'Only 1 set of 5 reps in original program, but 5x5 for consistency'
          }
        ],
        estimatedDuration: 75
      }
    ],
    estimatedDuration: 75,
    difficulty: 'easy',
    tags: ['stronglifts', '5x5', 'beginner', 'strength', 'barbell', '3-day']
  },

  // Push/Pull/Legs 6-Day (Advanced)
  {
    name: 'Push/Pull/Legs (6-Day Split)',
    description: 'Advanced 6-day program hitting each muscle group twice per week. Push, Pull, Legs, Push, Pull, Legs. High volume for experienced lifters.',
    goal: 'bulking',
    exercises: [],
    sessions: [
      {
        id: 'push-day-1',
        name: 'Push Day 1',
        order: 0,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'incline-bench-press',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'dumbbell-press',
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
            exerciseId: 'lateral-raises',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'tricep-pushdown',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'overhead-tricep-extension',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 85
      },
      {
        id: 'pull-day-1',
        name: 'Pull Day 1',
        order: 1,
        exercises: [
          {
            exerciseId: 'deadlift',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          },
          {
            exerciseId: 'pull-ups',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
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
            exerciseId: 't-bar-row',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'face-pulls',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'bicep-curls',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'hammer-curls',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 90
      },
      {
        id: 'leg-day-1',
        name: 'Leg Day 1',
        order: 2,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180
          },
          {
            exerciseId: 'romanian-deadlift',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
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
            exerciseId: 'leg-curls',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'leg-extensions',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'calf-raises',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 85
      },
      {
        id: 'push-day-2',
        name: 'Push Day 2',
        order: 3,
        exercises: [
          {
            exerciseId: 'overhead-press',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120
          },
          {
            exerciseId: 'dumbbell-press',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'cable-flyes',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'dumbbell-press-shoulders',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'rear-delt-flyes',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'dips',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'tricep-pushdown',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 80
      },
      {
        id: 'pull-day-2',
        name: 'Pull Day 2',
        order: 4,
        exercises: [
          {
            exerciseId: 'pull-ups',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'lat-pulldown',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'seated-row',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'barbell-row',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'shrugs',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'preacher-curls',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'bicep-curls',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 85
      },
      {
        id: 'leg-day-2',
        name: 'Leg Day 2',
        order: 5,
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
            exerciseId: 'bulgarian-split-squat',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Each leg'
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
            exerciseId: 'hip-thrust',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90
          },
          {
            exerciseId: 'leg-curls',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          },
          {
            exerciseId: 'calf-raises',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60
          }
        ],
        estimatedDuration: 80
      }
    ],
    estimatedDuration: 85,
    difficulty: 'hard',
    tags: ['push-pull-legs', '6-day', 'advanced', 'bulking', 'high-volume']
  },

  // Cardio Workouts
  {
    name: 'Hockey Practice Workout',
    description: 'Complete hockey practice routine including warm-up, cardio drills, strength work, and cool-down. Perfect for game day preparation or training sessions.',
    goal: 'endurance',
    exercises: [],
    sessions: [
      {
        id: 'hockey-practice',
        name: 'Hockey Practice',
        order: 0,
        exercises: [
          {
            exerciseId: 'jumping-jacks',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 30, restAfter: 30 },
              { setType: 'warmup', targetReps: 30, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Warm-up - get heart rate up'
          },
          {
            exerciseId: 'high-knees',
            order: 1,
            sets: [
              { setType: 'warmup', targetDuration: 30, restAfter: 30 },
              { setType: 'warmup', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Dynamic warm-up - simulate skating motion'
          },
          {
            exerciseId: 'lunges',
            order: 2,
            sets: [
              { setType: 'warmup', targetReps: 10, restAfter: 0 },
              { setType: 'warmup', targetReps: 10, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Each leg - activate leg muscles'
          },
          {
            exerciseId: 'running',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 300, restAfter: 120 },
              { setType: 'working', targetDuration: 300, restAfter: 120 },
              { setType: 'working', targetDuration: 300, restAfter: 120 }
            ],
            restTime: 120,
            notes: '5 min intervals - simulate shift work'
          },
          {
            exerciseId: 'burpees',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 10, restAfter: 60 },
              { setType: 'working', targetReps: 10, restAfter: 60 },
              { setType: 'working', targetReps: 8, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Explosive power - simulate quick bursts'
          },
          {
            exerciseId: 'mountain-climbers',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Core and cardio - maintain intensity'
          },
          {
            exerciseId: 'squat',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 15, restAfter: 60 },
              { setType: 'working', targetReps: 15, restAfter: 60 },
              { setType: 'working', targetReps: 12, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Leg strength - important for skating'
          },
          {
            exerciseId: 'plank',
            order: 7,
            sets: [
              { setType: 'working', targetDuration: 45, restAfter: 30 },
              { setType: 'working', targetDuration: 45, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Core stability - essential for balance'
          },
          {
            exerciseId: 'jump-rope',
            order: 8,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 30 },
              { setType: 'working', targetDuration: 60, restAfter: 30 },
              { setType: 'working', targetDuration: 60, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Footwork and agility'
          },
          {
            exerciseId: 'quad-stretch',
            order: 9,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Cool-down - each leg'
          },
          {
            exerciseId: 'hamstring-stretch',
            order: 10,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Cool-down - each leg'
          },
          {
            exerciseId: 'hip-flexor-stretch',
            order: 11,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Cool-down - important for hip mobility'
          }
        ],
        estimatedDuration: 45
      }
    ],
    estimatedDuration: 45,
    difficulty: 'medium',
    tags: ['cardio', 'hockey', 'sport-specific', 'endurance', 'agility', 'explosive']
  },
  {
    name: 'HIIT Cardio Blast (20 min)',
    description: 'High-intensity interval training workout. Short bursts of maximum effort followed by brief recovery. Great for improving cardiovascular fitness and burning calories.',
    goal: 'endurance',
    exercises: [],
    sessions: [
      {
        id: 'hiit-cardio',
        name: 'HIIT Cardio',
        order: 0,
        exercises: [
          {
            exerciseId: 'jumping-jacks',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 20, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Warm-up'
          },
          {
            exerciseId: 'burpees',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, restAfter: 30 },
              { setType: 'working', targetReps: 10, restAfter: 30 },
              { setType: 'working', targetReps: 8, restAfter: 30 },
              { setType: 'working', targetReps: 8, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Round 1 - 30 sec work, 30 sec rest'
          },
          {
            exerciseId: 'mountain-climbers',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'high-knees',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'jump-rope',
            order: 4,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'battle-ropes',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'If available, otherwise substitute with burpees'
          },
          {
            exerciseId: 'standing-forward-fold',
            order: 6,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Cool-down stretch'
          }
        ],
        estimatedDuration: 20
      }
    ],
    estimatedDuration: 20,
    difficulty: 'hard',
    tags: ['cardio', 'hiit', 'high-intensity', 'fat-burning', 'quick', 'endurance']
  },
  {
    name: 'Steady State Running (30 min)',
    description: 'Moderate-intensity running workout for building endurance. Maintain a steady pace you can hold for the entire duration. Great for improving cardiovascular health.',
    goal: 'endurance',
    exercises: [],
    sessions: [
      {
        id: 'steady-running',
        name: 'Steady Run',
        order: 0,
        exercises: [
          {
            exerciseId: 'jumping-jacks',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 20, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Warm-up'
          },
          {
            exerciseId: 'quad-stretch',
            order: 1,
            sets: [
              { setType: 'warmup', targetDuration: 20, restAfter: 0 },
              { setType: 'warmup', targetDuration: 20, restAfter: 30 }
            ],
            restTime: 30,
            notes: 'Dynamic stretch - each leg'
          },
          {
            exerciseId: 'running',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 1800, restAfter: 0 }
            ],
            restTime: 0,
            notes: '30 minutes steady pace - conversational pace'
          },
          {
            exerciseId: 'standing-forward-fold',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Cool-down'
          },
          {
            exerciseId: 'quad-stretch',
            order: 4,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Static stretch - each leg'
          },
          {
            exerciseId: 'hamstring-stretch',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Static stretch - each leg'
          }
        ],
        estimatedDuration: 35
      }
    ],
    estimatedDuration: 35,
    difficulty: 'medium',
    tags: ['cardio', 'running', 'endurance', 'steady-state', 'aerobic']
  },
  {
    name: 'Cycling Endurance (45 min)',
    description: 'Long-duration cycling workout for building aerobic capacity. Perfect for outdoor rides or stationary bike sessions. Maintain consistent effort throughout.',
    goal: 'endurance',
    exercises: [],
    sessions: [
      {
        id: 'cycling-endurance',
        name: 'Cycling Session',
        order: 0,
        exercises: [
          {
            exerciseId: 'cycling',
            order: 0,
            sets: [
              { setType: 'warmup', targetDuration: 300, restAfter: 60 },
              { setType: 'working', targetDuration: 1800, restAfter: 60 },
              { setType: 'working', targetDuration: 600, restAfter: 0 }
            ],
            restTime: 60,
            notes: '5 min warm-up, 30 min main, 10 min cool-down'
          },
          {
            exerciseId: 'quad-stretch',
            order: 1,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Post-ride stretch - each leg'
          },
          {
            exerciseId: 'hamstring-stretch',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 0 },
              { setType: 'working', targetDuration: 30, restAfter: 0 }
            ],
            restTime: 0,
            notes: 'Post-ride stretch - each leg'
          }
        ],
        estimatedDuration: 50
      }
    ],
    estimatedDuration: 50,
    difficulty: 'medium',
    tags: ['cardio', 'cycling', 'endurance', 'low-impact', 'aerobic']
  },
  {
    name: 'Quick Cardio Circuit (15 min)',
    description: 'Fast-paced cardio circuit perfect for when you\'re short on time. Full-body movements to get your heart rate up and burn calories efficiently.',
    goal: 'endurance',
    exercises: [],
    sessions: [
      {
        id: 'quick-cardio',
        name: 'Cardio Circuit',
        order: 0,
        exercises: [
          {
            exerciseId: 'jumping-jacks',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 30, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'burpees',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, restAfter: 30 },
              { setType: 'working', targetReps: 10, restAfter: 30 },
              { setType: 'working', targetReps: 8, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'mountain-climbers',
            order: 2,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'high-knees',
            order: 3,
            sets: [
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 },
              { setType: 'working', targetDuration: 30, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'jump-rope',
            order: 4,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 30 },
              { setType: 'working', targetDuration: 60, restAfter: 30 },
              { setType: 'working', targetDuration: 60, restAfter: 30 }
            ],
            restTime: 30
          },
          {
            exerciseId: 'jumping-jacks',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 20, restAfter: 30 },
              { setType: 'working', targetReps: 20, restAfter: 30 },
              { setType: 'working', targetReps: 15, restAfter: 0 }
            ],
            restTime: 30,
            notes: 'Finisher'
          }
        ],
        estimatedDuration: 15
      }
    ],
    estimatedDuration: 15,
    difficulty: 'medium',
    tags: ['cardio', 'quick', 'circuit', 'full-body', 'fat-burning']
  },

  // Muscle Building Plan (3-Days) - From JEFIT
  {
    name: "Pavel's routine",
    description: 'Complete 4-day muscle building split: Day 1 (Chest/Shoulders/Tricep), Day 2 (Back/Bicep), Day 3 (Legs/Core), Day 4 (Arms Focus). Perfect for 4 workouts per week.',
    goal: 'bulking',
    exercises: [],
    sessions: [
      {
        id: 'pavel-day1',
        name: 'Day 1: Chest/Shoulders/Tricep',
        order: 0,
        estimatedDuration: 99,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 0,
            sets: createSets('4 x 15,12,10,8 reps'),
            restTime: 90,
            notes: 'Barbell bench press'
          },
          {
            exerciseId: 'push-ups',
            order: 1,
            sets: createSets('4 x 10 reps'),
            restTime: 60,
            notes: 'Bodyweight push-ups'
          },
          {
            exerciseId: 'overhead-press',
            order: 2,
            sets: createSets('4 x 12,10,8,6 reps'),
            restTime: 90,
            notes: 'Barbell military press (seated)'
          },
          {
            exerciseId: 'lateral-raises',
            order: 3,
            sets: createSets('4 x 15,12,10,8 reps'),
            restTime: 60,
            notes: 'Dumbbell lateral raise'
          },
          {
            exerciseId: 'overhead-tricep-extension',
            order: 4,
            sets: createSets('4 x 14,12,10,8 reps'),
            restTime: 60,
            notes: 'Dumbbell tricep extension'
          },
          {
            exerciseId: 'tricep-dips',
            order: 5,
            sets: createSets('3 x 12,10,8 reps'),
            restTime: 60,
            notes: 'Bench dip'
          },
          {
            exerciseId: 'dumbbell-press-shoulders',
            order: 6,
            sets: createSets('4 x 12,10,8,6 reps'),
            restTime: 90,
            notes: 'Dumbbell seated shoulder press'
          },
          {
            exerciseId: 'dumbbell-flyes',
            order: 7,
            sets: createSets('4 x 12,10,8,6 reps'),
            restTime: 60,
            notes: 'Dumbbell fly'
          },
          {
            exerciseId: 'tricep-kickbacks',
            order: 8,
            sets: createSets('3 x 8 reps'),
            restTime: 60,
            notes: 'Dumbbell one-arm tricep kickback'
          }
        ]
      },
      {
        id: 'pavel-day2',
        name: 'Day 2: Back/Bicep',
        order: 1,
        estimatedDuration: 88,
        exercises: [
          {
            exerciseId: 'barbell-row',
            order: 0,
            sets: createSets('4 x 15,12,10,8 reps'),
            restTime: 90,
            notes: 'Barbell bent-over row'
          },
          {
            exerciseId: 'bicep-curls',
            order: 1,
            sets: createSets('4 x 12,10,8,6 reps'),
            restTime: 60,
            notes: 'Barbell curl'
          },
          {
            exerciseId: 'reverse-curls',
            order: 2,
            sets: createSets('3 x 8 reps'),
            restTime: 60,
            notes: 'Barbell reverse curl'
          },
          {
            exerciseId: 'deadlift',
            order: 3,
            sets: createSets('3 x 15 reps'),
            restTime: 120,
            notes: 'Barbell deadlift'
          },
          {
            exerciseId: 'shrugs',
            order: 4,
            sets: createSets('4 x 15,12,10,8 reps'),
            restTime: 60,
            notes: 'Dumbbell shoulder shrug'
          }
          // Note: 3 more exercises not visible in screenshot (total 8 exercises)
        ]
      },
      {
        id: 'pavel-day3',
        name: 'Day 3: Legs/Core',
        order: 2,
        estimatedDuration: 87,
        exercises: [
          {
            exerciseId: 'squat',
            order: 0,
            sets: createSets('4 x 12,10,8,6 reps'),
            restTime: 120,
            notes: 'Barbell squat'
          },
          {
            exerciseId: 'standing-calf-raise',
            order: 1,
            sets: createSets('4 x 15,12,10,8 reps'),
            restTime: 60,
            notes: 'Barbell standing calf raise'
          },
          {
            exerciseId: 'glute-bridge',
            order: 2,
            sets: createSets('4 x 15,12,10,8 reps'),
            restTime: 90,
            notes: 'Barbell glute bridge'
          },
          {
            exerciseId: 'crunches',
            order: 3,
            sets: createSets('4 x 24,20,18,14 reps'),
            restTime: 60,
            notes: 'Dumbbell side bend (oblique exercise)'
          },
          {
            exerciseId: 'crunches',
            order: 4,
            sets: createSets('4 x 20 reps'),
            restTime: 45,
            notes: 'Weighted crunch'
          },
          {
            exerciseId: 'russian-twists',
            order: 5,
            sets: createSets('4 x 16 reps'),
            restTime: 45,
            notes: 'Weight plate Russian twist'
          }
          // Note: 1 more exercise not visible in screenshot (total 7 exercises)
        ]
      },
      {
        id: 'pavel-day4',
        name: 'Day 4: Arms Focus',
        order: 3,
        estimatedDuration: 41,
        exercises: [
          {
            exerciseId: 'bicep-curls',
            order: 0,
            sets: createSets('4 x 12,10,8,8 reps'),
            restTime: 60,
            notes: 'Dumbbell alternating seated curl'
          },
          {
            exerciseId: 'hammer-curls',
            order: 1,
            sets: createSets('3 x 12,10,8 reps'),
            restTime: 60,
            notes: 'Dumbbell alternating hammer curl'
          },
          {
            exerciseId: 'hammer-curls',
            order: 2,
            sets: createSets('4 x 12,10,8,8 reps'),
            restTime: 60,
            notes: 'Dumbbell hammer curl (cross body)'
          },
          {
            exerciseId: 'concentration-curls',
            order: 3,
            sets: createSets('3 x 12,10,8 reps'),
            restTime: 60,
            notes: 'Dumbbell concentration curl'
          }
        ]
      }
    ],
    estimatedDuration: 315, // Total duration for all 4 days
    difficulty: 'medium',
    tags: ['muscle-building', '4-day-split', 'bulking', 'chest', 'back', 'legs', 'arms']
  },

  // Optimal Routine for Skinny Build (65kg, 176cm) - Muscle Building Focus
  {
    name: 'Skinny to Strong: Complete Muscle Builder',
    description: 'Optimized 4-day routine for building muscle mass. Perfect for skinny individuals (65kg, 176cm) looking to gain size and strength. Designed for home workouts with bench, barbell, and dumbbells only - no pull-up bar needed! Focuses on compound movements with progressive overload structure.',
    goal: 'bulking',
    exercises: [],
    sessions: [
      {
        id: 'skinny-upper-1',
        name: 'Upper Body Day 1: Chest & Back Focus',
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
            notes: 'Main compound movement - focus on form'
          },
          {
            exerciseId: 'barbell-row',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Build back thickness'
          },
          {
            exerciseId: 'dumbbell-press',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Greater range of motion than barbell'
          },
          {
            exerciseId: 'chest-supported-row',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Easier alternative to renegade rows - chest support eliminates core stability challenge while still targeting back and lats'
          },
          {
            exerciseId: 'dumbbell-flyes',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Chest stretch and pump'
          },
          {
            exerciseId: 'dumbbell-row',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Each arm - focus on lat contraction'
          }
        ],
        estimatedDuration: 75
      },
      {
        id: 'skinny-lower-1',
        name: 'Lower Body Day 1: Legs & Glutes',
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
            restTime: 120,
            notes: 'King of leg exercises - go below parallel'
          },
          {
            exerciseId: 'romanian-deadlift',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120,
            notes: 'Hamstring and glute focus - feel the stretch'
          },
          {
            exerciseId: 'dumbbell-lunges',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Each leg - unilateral strength'
          },
          {
            exerciseId: 'barbell-hip-thrust',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Glute builder - use padding on bar'
          },
          {
            exerciseId: 'standing-calf-raise',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Full range of motion - stretch at bottom'
          },
          {
            exerciseId: 'plank',
            order: 5,
            sets: [
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 60, restAfter: 60 },
              { setType: 'working', targetDuration: 45, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Core stability'
          }
        ],
        estimatedDuration: 80
      },
      {
        id: 'skinny-upper-2',
        name: 'Upper Body Day 2: Shoulders & Arms',
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
            restTime: 90,
            notes: 'Standing overhead press - core stability'
          },
          {
            exerciseId: 'dumbbell-press-shoulders',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Seated or standing - full range'
          },
          {
            exerciseId: 'barbell-row',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Use underhand grip for bicep emphasis - great chin-up replacement'
          },
          {
            exerciseId: 'barbell-curl',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Bicep builder'
          },
          {
            exerciseId: 'lateral-raises',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Side delts - control the weight'
          },
          {
            exerciseId: 'close-grip-bench-press',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Tricep focus - narrow grip'
          },
          {
            exerciseId: 'overhead-tricep-extension',
            order: 6,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Tricep isolation'
          },
          {
            exerciseId: 'rear-delt-flyes',
            order: 7,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Posture and rear delts'
          }
        ],
        estimatedDuration: 85
      },
      {
        id: 'skinny-lower-2',
        name: 'Lower Body Day 2: Power & Hypertrophy',
        order: 3,
        exercises: [
          {
            exerciseId: 'deadlift',
            order: 0,
            sets: [
              { setType: 'warmup', targetReps: 8, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 },
              { setType: 'working', targetReps: 5, targetWeight: undefined, restAfter: 180 }
            ],
            restTime: 180,
            notes: 'Full body strength - focus on form'
          },
          {
            exerciseId: 'front-squat',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 8, targetWeight: undefined, restAfter: 120 },
              { setType: 'working', targetReps: 6, targetWeight: undefined, restAfter: 120 }
            ],
            restTime: 120,
            notes: 'Quad and core focus - upright torso'
          },
          {
            exerciseId: 'bulgarian-split-squat',
            order: 2,
            sets: [
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 10, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Each leg - can add dumbbells'
          },
          {
            exerciseId: 'goblet-squat',
            order: 3,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 90 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 90 }
            ],
            restTime: 90,
            notes: 'Form and pump - hold dumbbell at chest'
          },
          {
            exerciseId: 'glute-bridge',
            order: 4,
            sets: [
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 60 },
              { setType: 'working', targetReps: 12, targetWeight: undefined, restAfter: 60 }
            ],
            restTime: 60,
            notes: 'Glute activation - can add weight'
          },
          {
            exerciseId: 'russian-twists',
            order: 5,
            sets: [
              { setType: 'working', targetReps: 20, targetWeight: undefined, restAfter: 45 },
              { setType: 'working', targetReps: 20, targetWeight: undefined, restAfter: 45 },
              { setType: 'working', targetReps: 15, targetWeight: undefined, restAfter: 45 }
            ],
            restTime: 45,
            notes: 'Core rotation - can hold weight'
          }
        ],
        estimatedDuration: 85
      }
    ],
    estimatedDuration: 80,
    difficulty: 'medium',
    tags: ['skinny-to-strong', 'muscle-building', 'bulking', 'beginner-friendly', '4-day', 'barbell', 'dumbbell', 'bodyweight', 'compound-movements', 'progressive-overload']
  }
]

