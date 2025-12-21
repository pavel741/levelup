/**
 * Exercise Database
 * Initial set of common exercises (MVP - will expand later)
 */

import type { Exercise } from '@/types/workout'

export const EXERCISE_DATABASE: Exercise[] = [
  // Chest Exercises
  {
    id: 'bench-press',
    name: 'Bench Press',
    description: 'Classic chest exercise performed lying on a bench, pressing weight upward.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on bench with feet flat on floor',
      'Grip bar slightly wider than shoulder-width',
      'Lower bar to chest with control',
      'Press bar up until arms are fully extended',
      'Repeat for desired reps'
    ],
    tips: [
      'Keep your back flat against the bench',
      'Don\'t bounce the bar off your chest',
      'Control the weight throughout the movement'
    ],
    commonMistakes: [
      'Arching back too much',
      'Flaring elbows too wide',
      'Bouncing the bar'
    ]
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    description: 'Bodyweight exercise targeting chest, shoulders, and triceps.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Lower body until chest nearly touches floor',
      'Push back up to starting position',
      'Keep body in straight line throughout'
    ],
    tips: [
      'Keep core engaged',
      'Don\'t let hips sag',
      'Full range of motion'
    ]
  },
  {
    id: 'dumbbell-flyes',
    name: 'Dumbbell Flyes',
    description: 'Isolation exercise for chest muscles.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders']
    },
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on bench holding dumbbells above chest',
      'Lower weights in wide arc until chest stretch',
      'Bring weights back together above chest',
      'Control the movement throughout'
    ]
  },

  // Back Exercises
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'Compound exercise targeting entire posterior chain.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'glutes', 'hamstrings'],
      secondary: ['core', 'traps']
    },
    equipment: ['barbell'],
    difficulty: 'advanced',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend at hips and knees to grip bar',
      'Keep back straight, chest up',
      'Drive through heels to stand up',
      'Lower bar with control'
    ],
    tips: [
      'Keep bar close to body',
      'Don\'t round your back',
      'Engage core throughout'
    ],
    commonMistakes: [
      'Rounding the back',
      'Bar drifting away from body',
      'Not engaging core'
    ]
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    description: 'Bodyweight exercise for back and biceps.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'shoulders']
    },
    equipment: ['bodyweight', 'pull-up-bar'],
    difficulty: 'intermediate',
    instructions: [
      'Hang from bar with palms facing away',
      'Pull body up until chin clears bar',
      'Lower with control to full extension',
      'Repeat'
    ]
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    description: 'Compound pulling exercise for back muscles.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'rear-delts']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Bend at hips, knees slightly bent',
      'Grip bar shoulder-width apart',
      'Pull bar to lower chest/upper abdomen',
      'Squeeze back muscles at top',
      'Lower with control'
    ]
  },

  // Leg Exercises
  {
    id: 'squat',
    name: 'Barbell Squat',
    description: 'King of leg exercises, targets quads, glutes, and hamstrings.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings', 'core']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Bar on upper back, feet shoulder-width apart',
      'Descend by bending knees and hips',
      'Lower until thighs parallel to floor',
      'Drive through heels to stand up',
      'Keep chest up throughout'
    ],
    tips: [
      'Keep knees tracking over toes',
      'Don\'t let knees cave inward',
      'Full depth for maximum benefit'
    ],
    commonMistakes: [
      'Knees caving inward',
      'Not reaching parallel depth',
      'Leaning too far forward'
    ]
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    description: 'Machine exercise for quadriceps and glutes.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit in machine with feet on platform',
      'Lower weight by bending knees',
      'Press weight back up to starting position',
      'Don\'t lock knees at top'
    ]
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Unilateral leg exercise for quads and glutes.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings', 'calves']
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Step forward into lunge position',
      'Lower back knee toward ground',
      'Push through front heel to return',
      'Alternate legs'
    ]
  },

  // Shoulder Exercises
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    description: 'Standing shoulder press with barbell.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['triceps', 'core']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Grip bar at shoulder width',
      'Press bar overhead until arms extended',
      'Lower with control to shoulders',
      'Keep core tight throughout'
    ]
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    description: 'Isolation exercise for side deltoids.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: []
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Stand holding dumbbells at sides',
      'Raise arms out to sides until parallel',
      'Lower with control',
      'Slight bend in elbows'
    ]
  },

  // Arm Exercises
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    description: 'Isolation exercise for biceps.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: []
    },
    equipment: ['dumbbells', 'barbell'],
    difficulty: 'beginner',
    instructions: [
      'Hold weights at sides, palms forward',
      'Curl weights up to shoulders',
      'Squeeze biceps at top',
      'Lower with control'
    ]
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    description: 'Bodyweight exercise for triceps.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: ['shoulders', 'chest']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Support body on bench or parallel bars',
      'Lower body by bending arms',
      'Push back up to starting position',
      'Keep elbows close to body'
    ]
  },

  // Cardio Exercises
  {
    id: 'running',
    name: 'Running',
    description: 'Cardiovascular exercise improving endurance.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['core']
    },
    equipment: [],
    difficulty: 'beginner',
    instructions: [
      'Start with warm-up walk',
      'Maintain steady pace',
      'Land on mid-foot',
      'Keep posture upright'
    ]
  },
  {
    id: 'cycling',
    name: 'Cycling',
    description: 'Low-impact cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['calves', 'hamstrings']
    },
    equipment: ['bike'],
    difficulty: 'beginner',
    instructions: [
      'Adjust seat height properly',
      'Maintain steady cadence',
      'Keep upper body relaxed',
      'Stay hydrated'
    ]
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    description: 'Full-body cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['shoulders', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start standing with arms at sides',
      'Jump while raising arms overhead',
      'Land with feet apart',
      'Jump back to starting position'
    ]
  },

  // Core Exercises
  {
    id: 'plank',
    name: 'Plank',
    description: 'Isometric core strengthening exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['shoulders', 'glutes']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start in push-up position',
      'Hold body in straight line',
      'Engage core muscles',
      'Breathe normally',
      'Hold for desired duration'
    ],
    tips: [
      'Don\'t let hips sag',
      'Keep head in neutral position',
      'Focus on breathing'
    ]
  },
  {
    id: 'crunches',
    name: 'Crunches',
    description: 'Abdominal exercise targeting rectus abdominis.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: []
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back with knees bent',
      'Place hands behind head',
      'Lift shoulders off ground',
      'Lower with control',
      'Don\'t pull on neck'
    ]
  }
]

/**
 * Get exercise by ID
 */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(ex => ex.id === id)
}

/**
 * Search exercises by name or muscle group
 */
export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase()
  return EXERCISE_DATABASE.filter(ex => 
    ex.name.toLowerCase().includes(lowerQuery) ||
    ex.muscleGroups.primary.some(mg => mg.toLowerCase().includes(lowerQuery)) ||
    ex.muscleGroups.secondary.some(mg => mg.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Filter exercises by category
 */
export function getExercisesByCategory(category: Exercise['category']): Exercise[] {
  return EXERCISE_DATABASE.filter(ex => ex.category === category)
}

/**
 * Filter exercises by muscle group
 */
export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return EXERCISE_DATABASE.filter(ex => 
    ex.muscleGroups.primary.includes(muscleGroup) ||
    ex.muscleGroups.secondary.includes(muscleGroup)
  )
}

/**
 * Filter exercises by equipment
 */
export function getExercisesByEquipment(equipment: string): Exercise[] {
  return EXERCISE_DATABASE.filter(ex => ex.equipment.includes(equipment))
}

