/**
 * Pre-built Routine Templates
 * Popular workout splits for 3-4 times per week
 */

import type { Routine } from '@/types/workout'

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
    isTemplate: true,
    isPublic: true,
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
    isTemplate: true,
    isPublic: true,
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
    isTemplate: true,
    isPublic: true,
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
    isTemplate: true,
    isPublic: true,
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
