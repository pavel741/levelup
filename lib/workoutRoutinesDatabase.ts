/**
 * Professional Workout Routines Database
 * Based on well-known, proven training programs
 * These are templates that users can copy and customize
 */

import type { Routine, RoutineSession } from '@/types/workout'

export interface RoutineTemplate {
  id: string
  name: string
  description: string
  goal: Routine['goal']
  difficulty: Routine['difficulty']
  estimatedDuration: number
  sessions: RoutineSession[]
  tags: string[]
  source: string // Where this routine is based on
  notes?: string
}

export const PROFESSIONAL_ROUTINE_TEMPLATES: RoutineTemplate[] = [
  // Starting Strength - Classic beginner strength program
  {
    id: 'starting-strength',
    name: 'Starting Strength',
    description: 'A simple, effective 3-day per week program focusing on compound movements. Perfect for beginners looking to build strength.',
    goal: 'strength',
    difficulty: 'medium',
    estimatedDuration: 60,
    sessions: [
      {
        id: 'session-a',
        name: 'Workout A',
        order: 1,
        estimatedDuration: 60,
        exercises: [
          {
            exerciseId: 'squat',
            order: 1,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 180 }],
            notes: '3 sets of 5 reps'
          },
          {
            exerciseId: 'bench-press',
            order: 2,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 180 }],
            notes: '3 sets of 5 reps'
          },
          {
            exerciseId: 'barbell-row',
            order: 3,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 180 }],
            notes: '3 sets of 5 reps'
          }
        ]
      },
      {
        id: 'session-b',
        name: 'Workout B',
        order: 2,
        estimatedDuration: 60,
        exercises: [
          {
            exerciseId: 'squat',
            order: 1,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 180 }],
            notes: '3 sets of 5 reps'
          },
          {
            exerciseId: 'overhead-press',
            order: 2,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 180 }],
            notes: '3 sets of 5 reps'
          },
          {
            exerciseId: 'deadlift',
            order: 3,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 300 }],
            notes: '1 set of 5 reps'
          }
        ]
      }
    ],
    tags: ['beginner', 'strength', 'compound', '3-day'],
    source: 'Starting Strength by Mark Rippetoe',
    notes: 'Alternate between Workout A and B. Add weight each session. Rest 1 day between workouts.'
  },

  // Push/Pull/Legs Split - Popular intermediate program
  {
    id: 'push-pull-legs',
    name: 'Push/Pull/Legs (PPL)',
    description: 'A 6-day split focusing on pushing movements, pulling movements, and legs. Great for intermediate lifters.',
    goal: 'bulking',
    difficulty: 'hard',
    estimatedDuration: 75,
    sessions: [
      {
        id: 'push-day',
        name: 'Push Day',
        order: 1,
        estimatedDuration: 75,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 1,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 180 }],
            notes: '4 sets of 8 reps'
          },
          {
            exerciseId: 'overhead-press',
            order: 2,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 120 }],
            notes: '3 sets of 8 reps'
          },
          {
            exerciseId: 'incline-dumbbell-press',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'dumbbell-lateral-raise',
            order: 4,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'tricep-dips',
            order: 5,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'tricep-pushdown',
            order: 6,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          }
        ]
      },
      {
        id: 'pull-day',
        name: 'Pull Day',
        order: 2,
        estimatedDuration: 75,
        exercises: [
          {
            exerciseId: 'deadlift',
            order: 1,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 240 }],
            notes: '3 sets of 5 reps'
          },
          {
            exerciseId: 'pull-ups',
            order: 2,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 120 }],
            notes: '4 sets of 8 reps'
          },
          {
            exerciseId: 'barbell-row',
            order: 3,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 120 }],
            notes: '4 sets of 8 reps'
          },
          {
            exerciseId: 'cable-row',
            order: 4,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'face-pulls',
            order: 5,
            sets: [{ setType: 'working', targetReps: 15, restAfter: 90 }],
            notes: '3 sets of 15 reps'
          },
          {
            exerciseId: 'barbell-curl',
            order: 6,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'hammer-curl',
            order: 7,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '3 sets of 10 reps'
          }
        ]
      },
      {
        id: 'legs-day',
        name: 'Legs Day',
        order: 3,
        estimatedDuration: 75,
        exercises: [
          {
            exerciseId: 'squat',
            order: 1,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 180 }],
            notes: '4 sets of 8 reps'
          },
          {
            exerciseId: 'romanian-deadlift',
            order: 2,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 180 }],
            notes: '3 sets of 8 reps'
          },
          {
            exerciseId: 'leg-press',
            order: 3,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 120 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'leg-curls',
            order: 4,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'calf-raise',
            order: 5,
            sets: [{ setType: 'working', targetReps: 15, restAfter: 90 }],
            notes: '4 sets of 15 reps'
          }
        ]
      }
    ],
    tags: ['intermediate', 'bulking', '6-day', 'split'],
    source: 'Popular bodybuilding split',
    notes: 'Train 6 days per week: Push, Pull, Legs, Rest, Push, Pull, Legs. Focus on progressive overload.'
  },

  // Upper/Lower Split - 4-day program
  {
    id: 'upper-lower-split',
    name: 'Upper/Lower Split',
    description: 'A balanced 4-day program alternating between upper and lower body workouts. Perfect for intermediate lifters.',
    goal: 'maintenance',
    difficulty: 'medium',
    estimatedDuration: 70,
    sessions: [
      {
        id: 'upper-day-1',
        name: 'Upper Body Day 1',
        order: 1,
        estimatedDuration: 70,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 1,
            sets: [{ setType: 'working', targetReps: 6, restAfter: 180 }],
            notes: '4 sets of 6 reps'
          },
          {
            exerciseId: 'barbell-row',
            order: 2,
            sets: [{ setType: 'working', targetReps: 6, restAfter: 180 }],
            notes: '4 sets of 6 reps'
          },
          {
            exerciseId: 'overhead-press',
            order: 3,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 120 }],
            notes: '3 sets of 8 reps'
          },
          {
            exerciseId: 'pull-ups',
            order: 4,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 120 }],
            notes: '3 sets of 8 reps'
          },
          {
            exerciseId: 'dumbbell-lateral-raise',
            order: 5,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'barbell-curl',
            order: 6,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '3 sets of 10 reps'
          }
        ]
      },
      {
        id: 'lower-day-1',
        name: 'Lower Body Day 1',
        order: 2,
        estimatedDuration: 70,
        exercises: [
          {
            exerciseId: 'squat',
            order: 1,
            sets: [{ setType: 'working', targetReps: 6, restAfter: 180 }],
            notes: '4 sets of 6 reps'
          },
          {
            exerciseId: 'romanian-deadlift',
            order: 2,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 180 }],
            notes: '3 sets of 8 reps'
          },
          {
            exerciseId: 'leg-press',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'leg-curls',
            order: 4,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'calf-raise',
            order: 5,
            sets: [{ setType: 'working', targetReps: 15, restAfter: 90 }],
            notes: '3 sets of 15 reps'
          }
        ]
      },
      {
        id: 'upper-day-2',
        name: 'Upper Body Day 2',
        order: 3,
        estimatedDuration: 70,
        exercises: [
          {
            exerciseId: 'incline-dumbbell-press',
            order: 1,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 120 }],
            notes: '4 sets of 8 reps'
          },
          {
            exerciseId: 'cable-row',
            order: 2,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 120 }],
            notes: '4 sets of 8 reps'
          },
          {
            exerciseId: 'dumbbell-flyes',
            order: 3,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'lat-pulldown',
            order: 4,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'tricep-pushdown',
            order: 5,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'hammer-curl',
            order: 6,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '3 sets of 10 reps'
          }
        ]
      },
      {
        id: 'lower-day-2',
        name: 'Lower Body Day 2',
        order: 4,
        estimatedDuration: 70,
        exercises: [
          {
            exerciseId: 'deadlift',
            order: 1,
            sets: [{ setType: 'working', targetReps: 5, restAfter: 240 }],
            notes: '3 sets of 5 reps'
          },
          {
            exerciseId: 'front-squat',
            order: 2,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 180 }],
            notes: '3 sets of 8 reps'
          },
          {
            exerciseId: 'bulgarian-split-squat',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '3 sets of 10 reps per leg'
          },
          {
            exerciseId: 'leg-curls',
            order: 4,
            sets: [{ setType: 'working', targetReps: 12, restAfter: 90 }],
            notes: '3 sets of 12 reps'
          },
          {
            exerciseId: 'calf-raise',
            order: 5,
            sets: [{ setType: 'working', targetReps: 15, restAfter: 90 }],
            notes: '3 sets of 15 reps'
          }
        ]
      }
    ],
    tags: ['intermediate', '4-day', 'balanced', 'strength'],
    source: 'Popular strength training split',
    notes: 'Train 4 days per week: Upper, Lower, Rest, Upper, Lower, Rest, Rest. Focus on progressive overload.'
  },

  // Full Body 3x per week - Great for beginners
  {
    id: 'full-body-3x',
    name: 'Full Body 3x Per Week',
    description: 'A complete full-body workout performed 3 times per week. Perfect for beginners or those with limited time.',
    goal: 'strength',
    difficulty: 'easy',
    estimatedDuration: 60,
    sessions: [
      {
        id: 'full-body',
        name: 'Full Body Workout',
        order: 1,
        estimatedDuration: 60,
        exercises: [
          {
            exerciseId: 'squat',
            order: 1,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'bench-press',
            order: 2,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'barbell-row',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '3 sets of 10 reps'
          },
          {
            exerciseId: 'overhead-press',
            order: 4,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 90 }],
            notes: '3 sets of 8 reps'
          },
          {
            exerciseId: 'deadlift',
            order: 5,
            sets: [{ setType: 'working', targetReps: 8, restAfter: 180 }],
            notes: '2 sets of 8 reps'
          },
          {
            exerciseId: 'plank',
            order: 6,
            sets: [{ setType: 'working', targetDuration: 60, restAfter: 60 }],
            notes: '3 sets of 60 seconds'
          }
        ]
      }
    ],
    tags: ['beginner', 'full-body', '3-day', 'time-efficient'],
    source: 'Classic full-body program',
    notes: 'Train 3 days per week with at least one rest day between sessions. Focus on form and progressive overload.'
  },

  // 5/3/1 Program - Advanced strength program
  {
    id: '531-boring-but-big',
    name: '5/3/1 Boring But Big',
    description: 'Jim Wendler\'s 5/3/1 program with Boring But Big assistance work. Focuses on the big 4 lifts with high volume assistance.',
    goal: 'strength',
    difficulty: 'hard',
    estimatedDuration: 90,
    sessions: [
      {
        id: '531-squat',
        name: '5/3/1 Squat Day',
        order: 1,
        estimatedDuration: 90,
        exercises: [
          {
            exerciseId: 'squat',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 5, restAfter: 180 },
              { setType: 'working', targetReps: 5, restAfter: 180 },
              { setType: 'working', targetReps: 5, restAfter: 240 }
            ],
            notes: 'Week 1: 65%x5, 75%x5, 85%x5+ | Week 2: 70%x3, 80%x3, 90%x3+ | Week 3: 75%x5, 85%x3, 95%x1+'
          },
          {
            exerciseId: 'squat',
            order: 2,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '5 sets of 10 reps at 50-60% of training max (BBB)'
          },
          {
            exerciseId: 'leg-curls',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '5 sets of 10 reps'
          },
          {
            exerciseId: 'calf-raise',
            order: 4,
            sets: [{ setType: 'working', targetReps: 15, restAfter: 90 }],
            notes: '5 sets of 15 reps'
          }
        ]
      },
      {
        id: '531-bench',
        name: '5/3/1 Bench Press Day',
        order: 2,
        estimatedDuration: 90,
        exercises: [
          {
            exerciseId: 'bench-press',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 5, restAfter: 180 },
              { setType: 'working', targetReps: 5, restAfter: 180 },
              { setType: 'working', targetReps: 5, restAfter: 240 }
            ],
            notes: 'Week 1: 65%x5, 75%x5, 85%x5+ | Week 2: 70%x3, 80%x3, 90%x3+ | Week 3: 75%x5, 85%x3, 95%x1+'
          },
          {
            exerciseId: 'bench-press',
            order: 2,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '5 sets of 10 reps at 50-60% of training max (BBB)'
          },
          {
            exerciseId: 'dumbbell-flyes',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '5 sets of 10 reps'
          },
          {
            exerciseId: 'tricep-pushdown',
            order: 4,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '5 sets of 10 reps'
          }
        ]
      },
      {
        id: '531-deadlift',
        name: '5/3/1 Deadlift Day',
        order: 3,
        estimatedDuration: 90,
        exercises: [
          {
            exerciseId: 'deadlift',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 5, restAfter: 240 },
              { setType: 'working', targetReps: 5, restAfter: 240 },
              { setType: 'working', targetReps: 5, restAfter: 300 }
            ],
            notes: 'Week 1: 65%x5, 75%x5, 85%x5+ | Week 2: 70%x3, 80%x3, 90%x3+ | Week 3: 75%x5, 85%x3, 95%x1+'
          },
          {
            exerciseId: 'deadlift',
            order: 2,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 180 }],
            notes: '5 sets of 10 reps at 50-60% of training max (BBB)'
          },
          {
            exerciseId: 'barbell-row',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '5 sets of 10 reps'
          },
          {
            exerciseId: 'lat-pulldown',
            order: 4,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '5 sets of 10 reps'
          }
        ]
      },
      {
        id: '531-ohp',
        name: '5/3/1 Overhead Press Day',
        order: 4,
        estimatedDuration: 90,
        exercises: [
          {
            exerciseId: 'overhead-press',
            order: 1,
            sets: [
              { setType: 'working', targetReps: 5, restAfter: 180 },
              { setType: 'working', targetReps: 5, restAfter: 180 },
              { setType: 'working', targetReps: 5, restAfter: 240 }
            ],
            notes: 'Week 1: 65%x5, 75%x5, 85%x5+ | Week 2: 70%x3, 80%x3, 90%x3+ | Week 3: 75%x5, 85%x3, 95%x1+'
          },
          {
            exerciseId: 'overhead-press',
            order: 2,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 120 }],
            notes: '5 sets of 10 reps at 50-60% of training max (BBB)'
          },
          {
            exerciseId: 'dumbbell-lateral-raise',
            order: 3,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '5 sets of 10 reps'
          },
          {
            exerciseId: 'barbell-curl',
            order: 4,
            sets: [{ setType: 'working', targetReps: 10, restAfter: 90 }],
            notes: '5 sets of 10 reps'
          }
        ]
      }
    ],
    tags: ['advanced', 'strength', '4-day', 'periodized'],
    source: '5/3/1 by Jim Wendler',
    notes: '4-week cycles. Calculate 90% of your 1RM as training max. Add 5-10 lbs to upper body and 10-15 lbs to lower body after each cycle.'
  }
]

/**
 * Convert a template to a Routine that can be saved
 */
export function templateToRoutine(
  template: RoutineTemplate,
  userId: string,
  customName?: string
): Omit<Routine, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    name: customName || template.name,
    description: template.description,
    goal: template.goal,
    exercises: [], // Deprecated, use sessions
    sessions: template.sessions,
    estimatedDuration: template.estimatedDuration,
    difficulty: template.difficulty,
    isTemplate: false,
    isPublic: false,
    createdBy: userId,
    tags: template.tags,
    schedule: {
      enabled: false,
      reminderEnabled: false,
      workoutDays: [],
      restDayReminders: false
    }
  }
}

