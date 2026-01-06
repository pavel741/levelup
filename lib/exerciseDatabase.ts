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
    ],
    videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg' // Example YouTube embed URL
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
    ],
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/eozdVDA78K0'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/op9kVnSso6Q' // Example YouTube embed URL
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
    ],
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/paCfxQvJx0s'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM' // Example YouTube embed URL
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
    ],
    videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/3XDriUn0udo'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/_kGESn8ArrU'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/McRfQ-Xz5qY'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/1fbU_MkV7NE'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw'
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
    ],
    videoUrl: 'https://www.youtube.com/embed/MKmrqcoCZ-M'
  },

  // More Chest Exercises
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    description: 'Upper chest focused bench press variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Set bench to 30-45 degree incline',
      'Lie back with bar at upper chest',
      'Press bar up and slightly forward',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/8iP4v8nQ1vk'
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Press',
    description: 'Chest exercise with dumbbells for better range of motion.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on bench holding dumbbells',
      'Press weights up until arms extended',
      'Lower with control',
      'Feel stretch in chest'
    ],
    videoUrl: 'https://www.youtube.com/embed/VmB1G1K7v94'
  },
  {
    id: 'cable-flyes',
    name: 'Cable Flyes',
    description: 'Chest isolation exercise using cables.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders']
    },
    equipment: ['cable'],
    difficulty: 'intermediate',
    instructions: [
      'Set cables at chest height',
      'Pull handles together in arc motion',
      'Squeeze chest at center',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/2g811Eo7K8U'
  },
  {
    id: 'dips',
    name: 'Dips',
    description: 'Bodyweight exercise for chest and triceps.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest', 'triceps'],
      secondary: ['shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Support body on parallel bars',
      'Lower body by bending arms',
      'Push back up to starting position',
      'Lean forward for more chest emphasis'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },

  // More Back Exercises
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    description: 'Machine exercise targeting latissimus dorsi.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps']
    },
    equipment: ['machine', 'cable'],
    difficulty: 'beginner',
    instructions: [
      'Sit at lat pulldown machine',
      'Grip bar wider than shoulder-width',
      'Pull bar to upper chest',
      'Squeeze lats at bottom',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc'
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    description: 'Compound back exercise using T-bar.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'rear-delts']
    },
    equipment: ['barbell', 'machine'],
    difficulty: 'intermediate',
    instructions: [
      'Straddle T-bar with feet on platform',
      'Bend at hips, grip handles',
      'Pull weight to chest',
      'Squeeze back muscles',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/j3Igk5nyZE4'
  },
  {
    id: 'seated-row',
    name: 'Seated Cable Row',
    description: 'Back exercise using cable machine.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'rear-delts']
    },
    equipment: ['cable', 'machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit at cable row machine',
      'Grip handle with feet on platform',
      'Pull handle to lower chest',
      'Squeeze shoulder blades together',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/GZbfZ1f4l8w'
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    description: 'Rear deltoid and upper back exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['rear-delts', 'traps'],
      secondary: ['rhomboids']
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cable at face height',
      'Pull rope to face level',
      'Separate handles at end',
      'Squeeze rear delts',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk'
  },
  {
    id: 'shrugs',
    name: 'Barbell Shrugs',
    description: 'Trap-focused exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['traps'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Hold weights at sides',
      'Shrug shoulders up',
      'Hold at top for 1-2 seconds',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/nRgXiYX4J2Y'
  },

  // More Leg Exercises
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    description: 'Hamstring and glute focused deadlift variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['hamstrings', 'glutes'],
      secondary: ['back', 'core']
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Hold bar with slight knee bend',
      'Hinge at hips, lower bar',
      'Feel stretch in hamstrings',
      'Drive hips forward to return',
      'Keep back straight'
    ],
    videoUrl: 'https://www.youtube.com/embed/JyqE5W2Bdhs'
  },
  {
    id: 'leg-curls',
    name: 'Leg Curls',
    description: 'Hamstring isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['hamstrings'],
      secondary: []
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Lie face down on leg curl machine',
      'Curl weight up by bending knees',
      'Squeeze hamstrings at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/1Tq3QdYUuHs'
  },
  {
    id: 'leg-extensions',
    name: 'Leg Extensions',
    description: 'Quadriceps isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads'],
      secondary: []
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit in leg extension machine',
      'Extend legs to lift weight',
      'Squeeze quads at top',
      'Lower with control',
      'Don\'t lock knees'
    ],
    videoUrl: 'https://www.youtube.com/embed/YyvSfVjQeL0'
  },
  {
    id: 'calf-raises',
    name: 'Calf Raises',
    description: 'Calf muscle exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['calves'],
      secondary: []
    },
    equipment: ['bodyweight', 'dumbbells', 'machine'],
    difficulty: 'beginner',
    instructions: [
      'Stand on balls of feet',
      'Raise heels as high as possible',
      'Squeeze calves at top',
      'Lower with control',
      'Full range of motion'
    ],
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo'
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    description: 'Unilateral leg exercise with rear foot elevated.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings']
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Place rear foot on bench',
      'Lower body by bending front knee',
      'Keep front knee over ankle',
      'Drive through front heel to return'
    ],
    videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE'
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    description: 'Squat variation holding weight at chest.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['core']
    },
    equipment: ['dumbbells', 'kettlebell'],
    difficulty: 'beginner',
    instructions: [
      'Hold weight at chest level',
      'Squat down keeping chest up',
      'Lower until thighs parallel',
      'Drive through heels to stand'
    ],
    videoUrl: 'https://www.youtube.com/embed/MVMNk0HiTMg'
  },

  // More Shoulder Exercises
  {
    id: 'dumbbell-press-shoulders',
    name: 'Dumbbell Shoulder Press',
    description: 'Overhead press with dumbbells.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['triceps', 'core']
    },
    equipment: ['dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Sit or stand holding dumbbells at shoulders',
      'Press weights overhead',
      'Lower with control',
      'Keep core engaged'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'front-raises',
    name: 'Front Raises',
    description: 'Anterior deltoid isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: []
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Hold weights at sides',
      'Raise arms forward to shoulder height',
      'Lower with control',
      'Slight bend in elbows'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'rear-delt-flyes',
    name: 'Rear Delt Flyes',
    description: 'Rear deltoid isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['rear-delts'],
      secondary: ['traps']
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Bend forward at hips',
      'Raise arms out to sides',
      'Squeeze rear delts',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk'
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    description: 'Shoulder press with rotation.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['triceps']
    },
    equipment: ['dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Start with palms facing you',
      'Rotate and press overhead',
      'Reverse rotation on way down',
      'Full range of motion'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },

  // More Arm Exercises
  {
    id: 'hammer-curls',
    name: 'Hammer Curls',
    description: 'Bicep exercise with neutral grip.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: ['forearms']
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Hold weights with neutral grip',
      'Curl weights up',
      'Squeeze biceps at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    description: 'Tricep isolation using cable machine.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: []
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cable at upper height',
      'Push handle down until arms extended',
      'Squeeze triceps at bottom',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    description: 'Tricep exercise with arm overhead.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: []
    },
    equipment: ['dumbbells', 'cable'],
    difficulty: 'beginner',
    instructions: [
      'Hold weight overhead',
      'Lower behind head by bending elbows',
      'Extend arms back up',
      'Keep elbows close to head'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'preacher-curls',
    name: 'Preacher Curls',
    description: 'Bicep isolation with arm support.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells', 'machine'],
    difficulty: 'intermediate',
    instructions: [
      'Rest arms on preacher bench',
      'Curl weight up',
      'Squeeze biceps at top',
      'Lower with full extension'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },

  // More Core Exercises
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    description: 'Rotational core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: []
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Sit with knees bent, lean back',
      'Rotate torso side to side',
      'Keep core engaged',
      'Can hold weight for resistance'
    ],
    videoUrl: 'https://www.youtube.com/embed/wkD8rjkodUI'
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    description: 'Dynamic core and cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['core'],
      secondary: ['legs', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start in plank position',
      'Alternate bringing knees to chest',
      'Keep hips level',
      'Maintain steady pace'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    description: 'Core stability exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: []
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, arms and legs up',
      'Lower opposite arm and leg',
      'Return to start',
      'Alternate sides',
      'Keep lower back pressed to floor'
    ],
    videoUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws'
  },
  {
    id: 'hanging-leg-raises',
    name: 'Hanging Leg Raises',
    description: 'Advanced core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['hip-flexors']
    },
    equipment: ['pull-up-bar'],
    difficulty: 'advanced',
    instructions: [
      'Hang from pull-up bar',
      'Raise legs up',
      'Lower with control',
      'Keep body stable'
    ],
    videoUrl: 'https://www.youtube.com/embed/79B1kZt8XUY'
  },

  // More Cardio Exercises
  {
    id: 'burpees',
    name: 'Burpees',
    description: 'Full-body cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['chest', 'shoulders', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Squat down and place hands on floor',
      'Jump feet back to plank',
      'Do a push-up (optional)',
      'Jump feet forward',
      'Jump up with arms overhead'
    ],
    videoUrl: 'https://www.youtube.com/embed/TU8QYVW0gDU'
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    description: 'High-intensity cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs', 'calves'],
      secondary: ['shoulders', 'core']
    },
    equipment: ['jump-rope'],
    difficulty: 'beginner',
    instructions: [
      'Hold rope handles at sides',
      'Jump over rope as it passes',
      'Land on balls of feet',
      'Maintain steady rhythm'
    ],
    videoUrl: 'https://www.youtube.com/embed/u3zgHI8QnqE'
  },
  {
    id: 'rowing',
    name: 'Rowing Machine',
    description: 'Full-body cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs', 'back'],
      secondary: ['shoulders', 'core']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Push with legs first',
      'Lean back slightly',
      'Pull handle to chest',
      'Return in reverse order'
    ],
    videoUrl: 'https://www.youtube.com/embed/1fbU_MkV7NE'
  },

  // Additional Exercises
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    description: 'Glute-focused exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['glutes'],
      secondary: ['hamstrings', 'core']
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Sit with upper back on bench',
      'Place weight on hips',
      'Drive hips up',
      'Squeeze glutes at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/wrwwXE_x-pQ'
  },
  {
    id: 'good-mornings',
    name: 'Good Mornings',
    description: 'Posterior chain exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['hamstrings', 'glutes'],
      secondary: ['back', 'core']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Bar on upper back',
      'Hinge at hips',
      'Lower torso until parallel',
      'Drive hips forward to return'
    ],
    videoUrl: 'https://www.youtube.com/embed/JyqE5W2Bdhs'
  },
  {
    id: 'pistol-squat',
    name: 'Pistol Squat',
    description: 'Advanced single-leg squat.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['core', 'calves']
    },
    equipment: ['bodyweight'],
    difficulty: 'advanced',
    instructions: [
      'Stand on one leg',
      'Extend other leg forward',
      'Squat down on standing leg',
      'Drive up to standing position'
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'wall-sit',
    name: 'Wall Sit',
    description: 'Isometric leg exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: []
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Back against wall',
      'Slide down until knees at 90 degrees',
      'Hold position',
      'Keep core engaged'
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'farmer-walk',
    name: 'Farmer\'s Walk',
    description: 'Full-body strength and conditioning.',
    category: 'strength',
    muscleGroups: {
      primary: ['traps', 'core'],
      secondary: ['legs', 'forearms']
    },
    equipment: ['dumbbells', 'kettlebell'],
    difficulty: 'intermediate',
    instructions: [
      'Hold heavy weights at sides',
      'Walk forward maintaining posture',
      'Keep core tight',
      'Don\'t lean forward'
    ],
    videoUrl: 'https://www.youtube.com/embed/nRgXiYX4J2Y'
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    description: 'Explosive hip hinge exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['glutes', 'hamstrings'],
      secondary: ['core', 'shoulders']
    },
    equipment: ['kettlebell'],
    difficulty: 'intermediate',
    instructions: [
      'Hinge at hips, swing KB between legs',
      'Drive hips forward explosively',
      'Swing KB to chest height',
      'Control descent'
    ],
    videoUrl: 'https://www.youtube.com/embed/YSxHifyI6s8'
  },

  // Additional Chest Exercises
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    description: 'Lower chest focused bench press variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Set bench to decline position',
      'Secure feet in footrests',
      'Press bar from lower chest',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/8iP4v8nQ1vk'
  },
  {
    id: 'chest-dips',
    name: 'Chest Dips',
    description: 'Bodyweight exercise emphasizing chest.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['triceps', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Support body on parallel bars',
      'Lean forward significantly',
      'Lower body by bending arms',
      'Push up focusing on chest'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck',
    description: 'Machine chest isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit at pec deck machine',
      'Place forearms on pads',
      'Bring arms together',
      'Squeeze chest at center',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/2g811Eo7K8U'
  },
  {
    id: 'push-up-variations',
    name: 'Diamond Push-Ups',
    description: 'Tricep-focused push-up variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps', 'chest'],
      secondary: ['shoulders', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Form diamond shape with hands',
      'Lower body keeping elbows close',
      'Push back up',
      'Focus on triceps'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'wide-grip-push-ups',
    name: 'Wide Grip Push-Ups',
    description: 'Chest-focused push-up variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Place hands wider than shoulders',
      'Lower body to ground',
      'Push back up',
      'Feel stretch in chest'
    ],
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4'
  },

  // Additional Back Exercises
  {
    id: 'chin-ups',
    name: 'Chin-Ups',
    description: 'Bicep-focused pull-up variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps', 'back'],
      secondary: ['shoulders']
    },
    equipment: ['bodyweight', 'pull-up-bar'],
    difficulty: 'intermediate',
    instructions: [
      'Hang from bar with palms facing you',
      'Pull body up until chin clears bar',
      'Lower with control',
      'Focus on biceps'
    ],
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g'
  },
  {
    id: 'one-arm-dumbbell-row',
    name: 'One-Arm Dumbbell Row',
    description: 'Unilateral back exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps']
    },
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Place knee and hand on bench',
      'Pull dumbbell to hip',
      'Squeeze back muscle',
      'Lower with control',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/paCfxQvJx0s'
  },
  {
    id: 'wide-grip-pull-ups',
    name: 'Wide Grip Pull-Ups',
    description: 'Lat-focused pull-up variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'shoulders']
    },
    equipment: ['bodyweight', 'pull-up-bar'],
    difficulty: 'advanced',
    instructions: [
      'Grip bar wider than shoulder-width',
      'Pull body up',
      'Focus on lats',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g'
  },
  {
    id: 'reverse-flyes',
    name: 'Reverse Flyes',
    description: 'Rear deltoid and upper back exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['rear-delts', 'traps'],
      secondary: ['rhomboids']
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Bend forward at hips',
      'Raise arms out to sides',
      'Squeeze shoulder blades',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk'
  },
  {
    id: 'rack-pulls',
    name: 'Rack Pulls',
    description: 'Partial deadlift from elevated position.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'traps'],
      secondary: ['glutes', 'hamstrings']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Set bar in power rack at knee height',
      'Grip bar and stand up',
      'Squeeze traps at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk'
  },

  // Additional Leg Exercises
  {
    id: 'front-squat',
    name: 'Front Squat',
    description: 'Quad-focused squat variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['core']
    },
    equipment: ['barbell'],
    difficulty: 'advanced',
    instructions: [
      'Rest bar on front deltoids',
      'Cross arms or use clean grip',
      'Squat down keeping torso upright',
      'Drive through heels to stand'
    ],
    videoUrl: 'https://www.youtube.com/embed/vcBig7373DM'
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    description: 'Machine squat variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Position back against pad',
      'Place feet on platform',
      'Lower by bending knees',
      'Drive through heels to stand'
    ],
    videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ'
  },
  {
    id: 'walking-lunges',
    name: 'Walking Lunges',
    description: 'Dynamic lunge variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings', 'calves']
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Step forward into lunge',
      'Lower back knee toward ground',
      'Push through front heel',
      'Step forward with back leg',
      'Continue alternating'
    ],
    videoUrl: 'https://www.youtube.com/embed/3XDriUn0udo'
  },
  {
    id: 'step-ups',
    name: 'Step-Ups',
    description: 'Unilateral leg exercise using platform.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings']
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Place foot on platform',
      'Step up driving through heel',
      'Bring other foot up',
      'Step down with control',
      'Alternate legs'
    ],
    videoUrl: 'https://www.youtube.com/embed/3XDriUn0udo'
  },
  {
    id: 'leg-press-narrow',
    name: 'Narrow Stance Leg Press',
    description: 'Quad-focused leg press variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads'],
      secondary: ['glutes']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Place feet close together on platform',
      'Lower weight by bending knees',
      'Press back up',
      'Focus on quads'
    ],
    videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ'
  },
  {
    id: 'sumo-squat',
    name: 'Sumo Squat',
    description: 'Wide-stance squat variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes', 'inner-thighs'],
      secondary: ['hamstrings']
    },
    equipment: ['bodyweight', 'dumbbells', 'kettlebell'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet wider than shoulders',
      'Toes pointed out',
      'Squat down keeping knees out',
      'Drive through heels to stand'
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'stiff-leg-deadlift',
    name: 'Stiff-Leg Deadlift',
    description: 'Hamstring-focused deadlift variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['hamstrings', 'glutes'],
      secondary: ['back', 'core']
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Hold bar with slight knee bend',
      'Hinge at hips, lower bar',
      'Feel stretch in hamstrings',
      'Drive hips forward to return'
    ],
    videoUrl: 'https://www.youtube.com/embed/JyqE5W2Bdhs'
  },
  {
    id: 'single-leg-deadlift',
    name: 'Single-Leg Deadlift',
    description: 'Unilateral posterior chain exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['hamstrings', 'glutes'],
      secondary: ['core', 'back']
    },
    equipment: ['bodyweight', 'dumbbells', 'kettlebell'],
    difficulty: 'intermediate',
    instructions: [
      'Stand on one leg',
      'Hinge at hip, extend other leg back',
      'Lower torso while keeping back straight',
      'Return to standing',
      'Alternate legs'
    ],
    videoUrl: 'https://www.youtube.com/embed/JyqE5W2Bdhs'
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    description: 'Calf exercise with knee flexion.',
    category: 'strength',
    muscleGroups: {
      primary: ['calves'],
      secondary: []
    },
    equipment: ['machine', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Sit with weight on thighs',
      'Raise heels as high as possible',
      'Squeeze calves at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo'
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    description: 'Calf exercise with straight legs.',
    category: 'strength',
    muscleGroups: {
      primary: ['calves'],
      secondary: []
    },
    equipment: ['bodyweight', 'dumbbells', 'machine'],
    difficulty: 'beginner',
    instructions: [
      'Stand on balls of feet',
      'Raise heels as high as possible',
      'Squeeze calves at top',
      'Lower with full stretch'
    ],
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo'
  },

  // Additional Shoulder Exercises
  {
    id: 'upright-row',
    name: 'Upright Row',
    description: 'Trap and shoulder exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['traps', 'shoulders'],
      secondary: ['biceps']
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Hold bar with narrow grip',
      'Pull bar up to chest level',
      'Keep elbows high',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'pike-push-ups',
    name: 'Pike Push-Ups',
    description: 'Bodyweight shoulder exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['triceps', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Start in downward dog position',
      'Lower head toward ground',
      'Push back up',
      'Keep body in inverted V'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'handstand-push-ups',
    name: 'Handstand Push-Ups',
    description: 'Advanced bodyweight shoulder exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['triceps', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'advanced',
    instructions: [
      'Kick up into handstand against wall',
      'Lower head toward ground',
      'Push back up',
      'Keep body straight'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    description: 'Side deltoid exercise using cables.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: []
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cable at low position',
      'Raise arm out to side',
      'Keep slight bend in elbow',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo'
  },
  {
    id: 'bent-over-lateral-raise',
    name: 'Bent-Over Lateral Raise',
    description: 'Rear deltoid exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['rear-delts'],
      secondary: ['traps']
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Bend forward at hips',
      'Raise arms out to sides',
      'Squeeze rear delts',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk'
  },

  // Additional Arm Exercises
  {
    id: 'concentration-curls',
    name: 'Concentration Curls',
    description: 'Bicep isolation with arm support.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: []
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Sit with arm resting on thigh',
      'Curl weight up',
      'Squeeze bicep at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: 'cable-curls',
    name: 'Cable Curls',
    description: 'Bicep exercise with constant tension.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: []
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cable at low position',
      'Curl handle up',
      'Squeeze biceps at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    description: 'Tricep-focused bench press variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: ['chest', 'shoulders']
    },
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Grip bar with hands close together',
      'Lower bar to lower chest',
      'Press up focusing on triceps',
      'Keep elbows close to body'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    description: 'Tricep extension exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on bench holding weight overhead',
      'Lower weight toward forehead',
      'Extend arms back up',
      'Keep elbows stationary'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'diamond-push-ups-tricep',
    name: 'Diamond Push-Ups (Tricep)',
    description: 'Tricep-focused push-up variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: ['chest', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Form diamond with hands',
      'Lower body keeping elbows close',
      'Push up focusing on triceps',
      'Keep body straight'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'reverse-curls',
    name: 'Reverse Curls',
    description: 'Forearm and brachialis exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['forearms', 'biceps'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Hold bar with overhand grip',
      'Curl bar up',
      'Focus on forearms',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: 'wrist-curls',
    name: 'Wrist Curls',
    description: 'Forearm flexion exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['forearms'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Rest forearms on bench',
      'Curl wrists up',
      'Squeeze forearms',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },

  // Additional Core Exercises
  {
    id: 'bicycle-crunches',
    name: 'Bicycle Crunches',
    description: 'Rotational core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: []
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, hands behind head',
      'Bring knee to opposite elbow',
      'Alternate sides',
      'Keep core engaged'
    ],
    videoUrl: 'https://www.youtube.com/embed/MKmrqcoCZ-M'
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    description: 'Lateral core stability exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on side, prop up on elbow',
      'Lift hips off ground',
      'Keep body in straight line',
      'Hold position',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw'
  },
  {
    id: 'flutter-kicks',
    name: 'Flutter Kicks',
    description: 'Lower ab and hip flexor exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, legs straight',
      'Alternate lifting legs',
      'Keep lower back pressed down',
      'Maintain steady pace'
    ],
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw'
  },
  {
    id: 'v-ups',
    name: 'V-Ups',
    description: 'Advanced core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on back, arms overhead',
      'Lift legs and torso simultaneously',
      'Touch hands to feet',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/MKmrqcoCZ-M'
  },
  {
    id: 'hollow-body-hold',
    name: 'Hollow Body Hold',
    description: 'Isometric core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: []
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on back, arms overhead',
      'Lift shoulders and legs off ground',
      'Hold position',
      'Keep lower back pressed down'
    ],
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw'
  },
  {
    id: 'leg-raises',
    name: 'Leg Raises',
    description: 'Lower ab exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, legs straight',
      'Raise legs to 90 degrees',
      'Lower with control',
      'Keep lower back down'
    ],
    videoUrl: 'https://www.youtube.com/embed/MKmrqcoCZ-M'
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    description: 'Advanced core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['shoulders']
    },
    equipment: ['ab-wheel'],
    difficulty: 'advanced',
    instructions: [
      'Kneel holding ab wheel',
      'Roll forward keeping core tight',
      'Extend as far as possible',
      'Roll back to start'
    ],
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw'
  },

  // Additional Cardio Exercises
  {
    id: 'high-knees',
    name: 'High Knees',
    description: 'Dynamic cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['core', 'hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Run in place',
      'Bring knees up high',
      'Pump arms',
      'Maintain steady pace'
    ],
    videoUrl: 'https://www.youtube.com/embed/1fbU_MkV7NE'
  },
  {
    id: 'sprint-intervals',
    name: 'Sprint Intervals',
    description: 'High-intensity interval training.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['core']
    },
    equipment: [],
    difficulty: 'advanced',
    instructions: [
      'Sprint at maximum effort',
      'Rest or walk between sprints',
      'Repeat for desired rounds',
      'Maintain form'
    ],
    videoUrl: 'https://www.youtube.com/embed/_kGESn8ArrU'
  },
  {
    id: 'elliptical',
    name: 'Elliptical Machine',
    description: 'Low-impact cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['glutes', 'core']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Step onto elliptical',
      'Maintain steady pace',
      'Use handles for upper body',
      'Keep posture upright'
    ],
    videoUrl: 'https://www.youtube.com/embed/McRfQ-Xz5qY'
  },
  {
    id: 'stair-climber',
    name: 'Stair Climber',
    description: 'Lower body cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['quads', 'glutes', 'calves'],
      secondary: ['core']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: [
      'Step onto stair climber',
      'Maintain steady pace',
      'Keep posture upright',
      'Use handrails for balance only'
    ],
    videoUrl: 'https://www.youtube.com/embed/McRfQ-Xz5qY'
  },
  {
    id: 'box-jumps',
    name: 'Box Jumps',
    description: 'Explosive plyometric exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['calves', 'core']
    },
    equipment: ['box'],
    difficulty: 'intermediate',
    instructions: [
      'Stand facing box',
      'Jump onto box landing softly',
      'Step down',
      'Repeat',
      'Focus on landing technique'
    ],
    videoUrl: 'https://www.youtube.com/embed/TU8QYVW0gDU'
  },

  // Functional & Compound Movements
  {
    id: 'thruster',
    name: 'Thruster',
    description: 'Combination squat and overhead press.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes', 'shoulders'],
      secondary: ['core', 'triceps']
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Hold weight at shoulders',
      'Squat down',
      'Drive up explosively',
      'Press weight overhead',
      'Return to start'
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'clean-and-press',
    name: 'Clean and Press',
    description: 'Olympic lift variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['legs', 'back', 'shoulders'],
      secondary: ['core', 'traps']
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'advanced',
    instructions: [
      'Lift bar from floor to shoulders',
      'Explosively drive hips forward',
      'Catch bar on shoulders',
      'Press overhead',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'battle-ropes',
    name: 'Battle Ropes',
    description: 'Full-body conditioning exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['shoulders', 'core'],
      secondary: ['legs', 'back']
    },
    equipment: ['battle-ropes'],
    difficulty: 'intermediate',
    instructions: [
      'Hold rope ends',
      'Alternate slamming ropes down',
      'Keep core engaged',
      'Maintain steady rhythm'
    ],
    videoUrl: 'https://www.youtube.com/embed/1fbU_MkV7NE'
  },
  {
    id: 'turkish-get-up',
    name: 'Turkish Get-Up',
    description: 'Complex full-body movement.',
    category: 'strength',
    muscleGroups: {
      primary: ['core', 'shoulders'],
      secondary: ['legs', 'glutes']
    },
    equipment: ['kettlebell', 'dumbbells'],
    difficulty: 'advanced',
    instructions: [
      'Lie holding weight overhead',
      'Sit up supporting with free hand',
      'Stand up keeping weight overhead',
      'Reverse movement to return',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/0bWRPC49-KI'
  },
  {
    id: 'bear-crawl',
    name: 'Bear Crawl',
    description: 'Full-body movement pattern.',
    category: 'cardio',
    muscleGroups: {
      primary: ['core', 'shoulders'],
      secondary: ['legs', 'glutes']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and feet',
      'Crawl forward',
      'Keep hips level',
      'Move opposite hand and foot',
      'Maintain steady pace'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },
  {
    id: 'crab-walk',
    name: 'Crab Walk',
    description: 'Posterior chain movement.',
    category: 'cardio',
    muscleGroups: {
      primary: ['glutes', 'shoulders', 'triceps'],
      secondary: ['core']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Sit with hands behind you',
      'Lift hips off ground',
      'Walk forward or backward',
      'Keep hips elevated'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },
  {
    id: 'man-makers',
    name: 'Man Makers',
    description: 'Full-body conditioning exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['chest', 'shoulders', 'legs'],
      secondary: ['core']
    },
    equipment: ['dumbbells'],
    difficulty: 'advanced',
    instructions: [
      'Start in plank with dumbbells',
      'Do renegade row',
      'Do push-up',
      'Jump feet forward',
      'Clean and press dumbbells',
      'Return to start'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },

  // Additional Chest Variations
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    description: 'Chest isolation using cable machine.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders']
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cables at high position',
      'Pull handles together in arc',
      'Squeeze chest at center',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/2g811Eo7K8U'
  },
  {
    id: 'incline-dumbbell-flyes',
    name: 'Incline Dumbbell Flyes',
    description: 'Upper chest focused flye variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders']
    },
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Set bench to incline',
      'Lie back holding dumbbells',
      'Lower weights in wide arc',
      'Bring together above chest'
    ],
    videoUrl: 'https://www.youtube.com/embed/eozdVDA78K0'
  },
  {
    id: 'decline-dumbbell-press',
    name: 'Decline Dumbbell Press',
    description: 'Lower chest focused press.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Set bench to decline',
      'Press dumbbells from lower chest',
      'Lower with control',
      'Feel stretch in lower chest'
    ],
    videoUrl: 'https://www.youtube.com/embed/VmB1G1K7v94'
  },
  {
    id: 'push-up-plus',
    name: 'Push-Up Plus',
    description: 'Push-up with serratus anterior emphasis.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest', 'serratus'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Perform standard push-up',
      'At top, push shoulders forward',
      'Feel stretch in serratus',
      'Return to start'
    ],
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4'
  },
  {
    id: 'landmine-press',
    name: 'Landmine Press',
    description: 'Unilateral chest and shoulder exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['chest', 'shoulders'],
      secondary: ['triceps', 'core']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Anchor bar in corner',
      'Hold end at chest level',
      'Press forward and up',
      'Return with control',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/8iP4v8nQ1vk'
  },

  // Additional Back Variations
  {
    id: 'meadows-row',
    name: 'Meadows Row',
    description: 'Unilateral back exercise with landmine.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'rear-delts']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Anchor bar in corner',
      'Bend at hips, pull bar to hip',
      'Squeeze back muscle',
      'Lower with control',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/paCfxQvJx0s'
  },
  {
    id: 'chest-supported-row',
    name: 'Chest Supported Row',
    description: 'Back exercise with chest support.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'rear-delts']
    },
    equipment: ['dumbbells', 'bench'],
    difficulty: 'beginner',
    instructions: [
      'Lie face down on incline bench',
      'Pull dumbbells to sides',
      'Squeeze shoulder blades',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/paCfxQvJx0s'
  },
  {
    id: 'wide-grip-lat-pulldown',
    name: 'Wide Grip Lat Pulldown',
    description: 'Lat-focused pulldown variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps']
    },
    equipment: ['machine', 'cable'],
    difficulty: 'beginner',
    instructions: [
      'Grip bar wider than shoulder-width',
      'Pull bar to upper chest',
      'Focus on lats',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc'
  },
  {
    id: 'close-grip-lat-pulldown',
    name: 'Close Grip Lat Pulldown',
    description: 'Bicep-focused pulldown variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats', 'biceps'],
      secondary: []
    },
    equipment: ['machine', 'cable'],
    difficulty: 'beginner',
    instructions: [
      'Grip bar with narrow grip',
      'Pull bar to chest',
      'Focus on biceps',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc'
  },
  {
    id: 'straight-arm-pulldown',
    name: 'Straight Arm Pulldown',
    description: 'Lat isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['lats'],
      secondary: ['triceps']
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cable at high position',
      'Pull bar down with straight arms',
      'Focus on lats',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc'
  },
  {
    id: 'inverted-row',
    name: 'Inverted Row',
    description: 'Bodyweight back exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'lats'],
      secondary: ['biceps', 'rear-delts']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie under bar',
      'Pull body up to bar',
      'Keep body straight',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g'
  },

  // Additional Leg Variations
  {
    id: 'zercher-squat',
    name: 'Zercher Squat',
    description: 'Front-loaded squat variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['core', 'back']
    },
    equipment: ['barbell'],
    difficulty: 'advanced',
    instructions: [
      'Hold bar in crook of elbows',
      'Squat down keeping torso upright',
      'Drive through heels to stand',
      'Keep core tight'
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'paused-squat',
    name: 'Paused Squat',
    description: 'Squat with pause at bottom.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings', 'core']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Perform standard squat',
      'Pause at bottom for 2-3 seconds',
      'Drive up explosively',
      'Builds strength from bottom'
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'box-squat',
    name: 'Box Squat',
    description: 'Squat to box for depth control.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings', 'core']
    },
    equipment: ['barbell', 'box'],
    difficulty: 'intermediate',
    instructions: [
      'Set box at parallel height',
      'Squat down to box',
      'Sit back on box briefly',
      'Drive up from box'
    ],
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'reverse-lunges',
    name: 'Reverse Lunges',
    description: 'Lunge variation stepping backward.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings']
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Step backward into lunge',
      'Lower back knee toward ground',
      'Push through front heel',
      'Return to start',
      'Alternate legs'
    ],
    videoUrl: 'https://www.youtube.com/embed/3XDriUn0udo'
  },
  {
    id: 'lateral-lunges',
    name: 'Lateral Lunges',
    description: 'Side-to-side lunge variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes', 'inner-thighs'],
      secondary: ['hamstrings']
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Step to side into lunge',
      'Keep other leg straight',
      'Push through heel to return',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/3XDriUn0udo'
  },
  {
    id: 'curtsy-lunges',
    name: 'Curtsy Lunges',
    description: 'Cross-body lunge variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['inner-thighs']
    },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Step back and across body',
      'Lower into lunge position',
      'Push through front heel',
      'Return to start',
      'Alternate legs'
    ],
    videoUrl: 'https://www.youtube.com/embed/3XDriUn0udo'
  },
  {
    id: 'romanian-deadlift-single-leg',
    name: 'Single-Leg Romanian Deadlift',
    description: 'Unilateral posterior chain exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['hamstrings', 'glutes'],
      secondary: ['core', 'back']
    },
    equipment: ['bodyweight', 'dumbbells', 'kettlebell'],
    difficulty: 'intermediate',
    instructions: [
      'Stand on one leg',
      'Hinge at hip, extend other leg back',
      'Lower weight toward ground',
      'Return to standing',
      'Alternate legs'
    ],
    videoUrl: 'https://www.youtube.com/embed/JyqE5W2Bdhs'
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    description: 'Glute-focused hip thrust variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['glutes'],
      secondary: ['hamstrings', 'core']
    },
    equipment: ['bodyweight', 'barbell', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, knees bent',
      'Lift hips up',
      'Squeeze glutes at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/wrwwXE_x-pQ'
  },
  {
    id: 'donkey-kicks',
    name: 'Donkey Kicks',
    description: 'Glute isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['glutes'],
      secondary: ['hamstrings']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and knees',
      'Kick leg back and up',
      'Squeeze glute at top',
      'Lower with control',
      'Alternate legs'
    ],
    videoUrl: 'https://www.youtube.com/embed/wrwwXE_x-pQ'
  },
  {
    id: 'fire-hydrants',
    name: 'Fire Hydrants',
    description: 'Hip abductor exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['glutes', 'hip-abductors'],
      secondary: []
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and knees',
      'Lift leg out to side',
      'Keep knee bent',
      'Lower with control',
      'Alternate legs'
    ],
    videoUrl: 'https://www.youtube.com/embed/wrwwXE_x-pQ'
  },

  // Additional Shoulder Variations
  {
    id: 'pike-push-ups-elevated',
    name: 'Elevated Pike Push-Ups',
    description: 'Shoulder exercise with feet elevated.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['triceps', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Place feet on elevated surface',
      'Form inverted V position',
      'Lower head toward ground',
      'Push back up'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'cable-front-raise',
    name: 'Cable Front Raise',
    description: 'Anterior deltoid exercise using cables.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: []
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cable at low position',
      'Raise arm forward to shoulder height',
      'Lower with control',
      'Alternate arms'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'barbell-front-raise',
    name: 'Barbell Front Raise',
    description: 'Anterior deltoid exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: []
    },
    equipment: ['barbell'],
    difficulty: 'beginner',
    instructions: [
      'Hold bar with overhand grip',
      'Raise bar forward to shoulder height',
      'Lower with control',
      'Keep slight bend in elbows'
    ],
    videoUrl: 'https://www.youtube.com/embed/F3QY5voMzqo'
  },
  {
    id: 'scarecrows',
    name: 'Scarecrows',
    description: 'Rear deltoid and external rotation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['rear-delts'],
      secondary: ['rotator-cuff']
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Bend forward at hips',
      'Raise arms to sides with elbows bent',
      'Rotate arms externally',
      'Squeeze rear delts',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk'
  },
  {
    id: 'band-pull-aparts',
    name: 'Band Pull-Aparts',
    description: 'Rear deltoid and upper back exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['rear-delts', 'traps'],
      secondary: ['rhomboids']
    },
    equipment: ['resistance_bands'],
    difficulty: 'beginner',
    instructions: [
      'Hold band with arms extended',
      'Pull band apart',
      'Squeeze shoulder blades',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk'
  },

  // Additional Arm Variations
  {
    id: 'spider-curls',
    name: 'Spider Curls',
    description: 'Bicep isolation with arm support.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie face down on incline bench',
      'Curl weight up',
      'Squeeze biceps at top',
      'Lower with full extension'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: 'drag-curls',
    name: 'Drag Curls',
    description: 'Bicep exercise keeping bar close to body.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: []
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Hold bar at sides',
      'Curl bar up keeping it close to body',
      'Drag bar up torso',
      'Squeeze biceps at top',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: '21s',
    name: '21s (Bicep Curls)',
    description: 'Bicep training method with partial reps.',
    category: 'strength',
    muscleGroups: {
      primary: ['biceps'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Do 7 reps bottom to middle',
      'Do 7 reps middle to top',
      'Do 7 full reps',
      'Total 21 reps per set'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: 'close-grip-push-ups',
    name: 'Close-Grip Push-Ups',
    description: 'Tricep-focused push-up variation.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: ['chest', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Place hands close together',
      'Lower body keeping elbows close',
      'Push up focusing on triceps',
      'Keep body straight'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'diamond-push-ups-tricep-focused',
    name: 'Diamond Push-Ups',
    description: 'Tricep-focused push-up with diamond hand position.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: ['chest', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Form diamond shape with hands',
      'Lower body keeping elbows close',
      'Push up focusing on triceps',
      'Keep body straight'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'tricep-kickbacks',
    name: 'Tricep Kickbacks',
    description: 'Tricep isolation exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: []
    },
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Bend forward supporting on bench',
      'Extend arm back',
      'Squeeze tricep at top',
      'Lower with control',
      'Alternate arms'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'rope-tricep-pushdown',
    name: 'Rope Tricep Pushdown',
    description: 'Tricep exercise with rope attachment.',
    category: 'strength',
    muscleGroups: {
      primary: ['triceps'],
      secondary: []
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    instructions: [
      'Set cable at upper height',
      'Push rope down',
      'Separate handles at bottom',
      'Squeeze triceps',
      'Return with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc'
  },
  {
    id: 'forearm-curls-reverse',
    name: 'Reverse Wrist Curls',
    description: 'Forearm extension exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['forearms'],
      secondary: []
    },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Rest forearms on bench',
      'Extend wrists up',
      'Squeeze forearms',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },

  // Additional Core Variations
  {
    id: 'reverse-crunches',
    name: 'Reverse Crunches',
    description: 'Lower ab exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, legs up',
      'Lift hips off ground',
      'Bring knees toward chest',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/MKmrqcoCZ-M'
  },
  {
    id: 'toe-touches',
    name: 'Toe Touches',
    description: 'Core exercise reaching for toes.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, legs up',
      'Reach hands toward toes',
      'Lift shoulders off ground',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/MKmrqcoCZ-M'
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    description: 'Core stability exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['glutes', 'back']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and knees',
      'Extend opposite arm and leg',
      'Hold position',
      'Return to start',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws'
  },
  {
    id: 'superman',
    name: 'Superman',
    description: 'Lower back and glute exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['back', 'glutes'],
      secondary: ['core']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie face down',
      'Lift arms and legs simultaneously',
      'Squeeze glutes and back',
      'Hold briefly',
      'Lower with control'
    ],
    videoUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws'
  },
  {
    id: 'windshield-wipers',
    name: 'Windshield Wipers',
    description: 'Rotational core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['obliques']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Hang from pull-up bar',
      'Rotate legs side to side',
      'Keep core engaged',
      'Control the movement'
    ],
    videoUrl: 'https://www.youtube.com/embed/79B1kZt8XUY'
  },
  {
    id: 'knee-raises',
    name: 'Knee Raises',
    description: 'Core and hip flexor exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['hip-flexors']
    },
    equipment: ['bodyweight', 'pull-up-bar'],
    difficulty: 'beginner',
    instructions: [
      'Hang from pull-up bar',
      'Bring knees up',
      'Lower with control',
      'Keep body stable'
    ],
    videoUrl: 'https://www.youtube.com/embed/79B1kZt8XUY'
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    description: 'Anti-rotation core exercise.',
    category: 'strength',
    muscleGroups: {
      primary: ['core'],
      secondary: ['shoulders']
    },
    equipment: ['cable'],
    difficulty: 'intermediate',
    instructions: [
      'Set cable at chest height',
      'Hold handle at chest',
      'Press forward',
      'Resist rotation',
      'Return with control',
      'Alternate sides'
    ],
    videoUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws'
  },

  // Additional Cardio & Functional
  {
    id: 'jumping-squats',
    name: 'Jumping Squats',
    description: 'Explosive plyometric exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['calves', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Squat down',
      'Jump up explosively',
      'Land softly',
      'Immediately go into next rep'
    ],
    videoUrl: 'https://www.youtube.com/embed/TU8QYVW0gDU'
  },
  {
    id: 'mountain-climber-twists',
    name: 'Mountain Climber Twists',
    description: 'Rotational cardio exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['core'],
      secondary: ['legs', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Start in plank position',
      'Bring knee to opposite elbow',
      'Alternate sides',
      'Maintain steady pace'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },
  {
    id: 'star-jumps',
    name: 'Star Jumps',
    description: 'Full-body jumping exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['shoulders', 'core']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Jump up spreading arms and legs',
      'Form star shape',
      'Land with feet together',
      'Repeat'
    ],
    videoUrl: 'https://www.youtube.com/embed/1fbU_MkV7NE'
  },
  {
    id: 'squat-jumps',
    name: 'Squat Jumps',
    description: 'Explosive lower body exercise.',
    category: 'cardio',
    muscleGroups: {
      primary: ['quads', 'glutes'],
      secondary: ['calves']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Squat down',
      'Jump up as high as possible',
      'Land softly',
      'Repeat immediately'
    ],
    videoUrl: 'https://www.youtube.com/embed/TU8QYVW0gDU'
  },
  {
    id: 'plank-jacks',
    name: 'Plank Jacks',
    description: 'Cardio plank variation.',
    category: 'cardio',
    muscleGroups: {
      primary: ['core'],
      secondary: ['legs', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Start in plank position',
      'Jump feet apart',
      'Jump feet back together',
      'Keep core engaged',
      'Maintain steady pace'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },
  {
    id: 'bear-crawl-forward',
    name: 'Bear Crawl Forward',
    description: 'Full-body movement pattern.',
    category: 'cardio',
    muscleGroups: {
      primary: ['core', 'shoulders'],
      secondary: ['legs', 'glutes']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and feet',
      'Crawl forward',
      'Keep hips level',
      'Move opposite hand and foot',
      'Maintain steady pace'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },
  {
    id: 'inchworms',
    name: 'Inchworms',
    description: 'Full-body dynamic movement.',
    category: 'cardio',
    muscleGroups: {
      primary: ['core', 'shoulders'],
      secondary: ['legs', 'hamstrings']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Stand, bend forward',
      'Walk hands out to plank',
      'Walk feet back to hands',
      'Return to standing',
      'Repeat'
    ],
    videoUrl: 'https://www.youtube.com/embed/cnyTQDSE884'
  },
  {
    id: 'sprint-drills',
    name: 'Sprint Drills',
    description: 'Speed and agility training.',
    category: 'cardio',
    muscleGroups: {
      primary: ['legs'],
      secondary: ['core']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'High knees for 20 meters',
      'Butt kicks for 20 meters',
      'A-skips for 20 meters',
      'B-skips for 20 meters',
      'Repeat'
    ],
    videoUrl: 'https://www.youtube.com/embed/_kGESn8ArrU'
  },

  // Stretching & Flexibility Exercises
  {
    id: 'neck-stretch',
    name: 'Neck Stretch',
    description: 'Gentle neck mobility stretch to relieve tension.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['neck'],
      secondary: ['shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Sit or stand tall',
      'Slowly tilt head to one side',
      'Hold for 15-30 seconds',
      'Return to center',
      'Repeat on other side'
    ],
    tips: [
      'Move slowly and gently',
      'Don\'t force the stretch',
      'Breathe deeply'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'shoulder-stretch',
    name: 'Shoulder Stretch',
    description: 'Stretches the shoulders and upper back.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['back', 'chest']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Bring one arm across your chest',
      'Use other arm to gently pull',
      'Hold for 20-30 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep shoulders relaxed',
      'Don\'t pull too hard',
      'Feel stretch in shoulder'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'chest-stretch',
    name: 'Chest Stretch',
    description: 'Opens up the chest and front shoulders.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Stand in doorway or corner',
      'Place forearm on wall',
      'Lean forward gently',
      'Hold for 20-30 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep back straight',
      'Feel stretch in chest',
      'Don\'t overstretch'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'tricep-stretch',
    name: 'Tricep Stretch',
    description: 'Stretches the back of the upper arm.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['triceps'],
      secondary: ['shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Raise one arm overhead',
      'Bend elbow, hand behind head',
      'Use other hand to gently pull elbow',
      'Hold for 20-30 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep head straight',
      'Feel stretch in tricep',
      'Don\'t force it'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'standing-forward-fold',
    name: 'Standing Forward Fold',
    description: 'Stretches hamstrings, calves, and lower back.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['hamstrings'],
      secondary: ['back', 'calves']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet hip-width apart',
      'Hinge at hips and fold forward',
      'Let arms hang or grab opposite elbows',
      'Hold for 30-60 seconds',
      'Slowly return to standing'
    ],
    tips: [
      'Bend knees slightly if needed',
      'Let gravity do the work',
      'Breathe deeply'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'quad-stretch',
    name: 'Quad Stretch',
    description: 'Stretches the front of the thigh.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['quadriceps'],
      secondary: ['hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Stand and hold onto wall for balance',
      'Bend one knee, bring heel to glute',
      'Hold ankle with hand',
      'Keep knees together',
      'Hold for 20-30 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep standing leg slightly bent',
      'Don\'t arch back',
      'Feel stretch in front of thigh'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'hamstring-stretch',
    name: 'Hamstring Stretch',
    description: 'Stretches the back of the thigh.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['hamstrings'],
      secondary: ['glutes']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Sit on floor with one leg extended',
      'Other leg bent, foot against inner thigh',
      'Reach forward toward extended foot',
      'Hold for 30-45 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep back straight',
      'Don\'t round shoulders',
      'Feel stretch in back of leg'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'hip-flexor-stretch',
    name: 'Hip Flexor Stretch',
    description: 'Stretches the front of the hip.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['hip-flexors'],
      secondary: ['quadriceps']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Step into lunge position',
      'Back knee on ground',
      'Push hips forward',
      'Keep front knee over ankle',
      'Hold for 30-45 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep torso upright',
      'Feel stretch in front of hip',
      'Don\'t let front knee go past toes'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'calf-stretch',
    name: 'Calf Stretch',
    description: 'Stretches the calf muscles.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['calves'],
      secondary: []
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Step one foot forward',
      'Keep back leg straight',
      'Lean forward, bending front knee',
      'Feel stretch in back calf',
      'Hold for 30 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep back heel on ground',
      'Don\'t bounce',
      'Feel stretch in calf'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'spinal-twist',
    name: 'Seated Spinal Twist',
    description: 'Rotational stretch for the spine and core.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['back'],
      secondary: ['core', 'obliques']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Sit with legs extended',
      'Cross one leg over the other',
      'Twist torso toward bent knee',
      'Use opposite arm to deepen stretch',
      'Hold for 30-45 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep spine tall',
      'Breathe deeply',
      'Don\'t force the twist'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'childs-pose',
    name: 'Child\'s Pose',
    description: 'Restorative stretch for back and hips.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['back'],
      secondary: ['hips', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and knees',
      'Sit back on heels',
      'Reach arms forward',
      'Rest forehead on ground',
      'Hold for 60 seconds',
      'Breathe deeply'
    ],
    tips: [
      'Relax completely',
      'Let gravity do the work',
      'Great for stress relief'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'cat-cow',
    name: 'Cat-Cow Stretch',
    description: 'Dynamic spinal mobility exercise.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['back'],
      secondary: ['core']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and knees',
      'Arch back, look up (cow)',
      'Round back, tuck chin (cat)',
      'Move slowly between positions',
      'Repeat 10-15 times'
    ],
    tips: [
      'Move with breath',
      'Feel movement in entire spine',
      'Go slowly and smoothly'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'figure-four-stretch',
    name: 'Figure Four Stretch',
    description: 'Stretches glutes and hip rotators.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['glutes'],
      secondary: ['hips']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back',
      'Cross one ankle over opposite knee',
      'Pull thigh toward chest',
      'Hold for 30-45 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep head on ground',
      'Feel stretch in glute',
      'Don\'t force it'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'knee-to-chest',
    name: 'Knee to Chest Stretch',
    description: 'Stretches lower back and glutes.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['back'],
      secondary: ['glutes']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back',
      'Bring one knee to chest',
      'Hold with hands',
      'Keep other leg extended',
      'Hold for 30-45 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Relax shoulders',
      'Feel stretch in lower back',
      'Breathe deeply'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'butterfly-stretch',
    name: 'Butterfly Stretch',
    description: 'Stretches inner thighs and hips.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['hips'],
      secondary: ['inner-thighs']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Sit on floor',
      'Bring soles of feet together',
      'Let knees fall to sides',
      'Gently press knees down',
      'Hold for 30-60 seconds'
    ],
    tips: [
      'Keep back straight',
      'Don\'t bounce',
      'Feel stretch in inner thighs'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'pigeon-pose',
    name: 'Pigeon Pose',
    description: 'Deep hip and glute stretch.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['hips'],
      secondary: ['glutes', 'hip-flexors']
    },
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      'Start in plank position',
      'Bring one knee forward to wrist',
      'Extend back leg straight',
      'Square hips forward',
      'Hold for 30-60 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Use props if needed',
      'Don\'t force the stretch',
      'Feel stretch in hip'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'standing-side-stretch',
    name: 'Standing Side Stretch',
    description: 'Stretches the side body and obliques.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['obliques'],
      secondary: ['back', 'shoulders']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet hip-width apart',
      'Raise one arm overhead',
      'Lean to opposite side',
      'Feel stretch in side body',
      'Hold for 20-30 seconds',
      'Repeat on other side'
    ],
    tips: [
      'Keep hips centered',
      'Don\'t lean forward or back',
      'Breathe deeply'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
  },
  {
    id: 'wrist-stretch',
    name: 'Wrist Stretch',
    description: 'Stretches wrists and forearms.',
    category: 'flexibility',
    muscleGroups: {
      primary: ['forearms'],
      secondary: ['wrists']
    },
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      'Extend one arm forward',
      'Point fingers down',
      'Use other hand to gently pull fingers',
      'Hold for 20-30 seconds',
      'Flip hand and repeat',
      'Repeat on other side'
    ],
    tips: [
      'Be gentle',
      'Great for desk workers',
      'Feel stretch in forearm'
    ],
    videoUrl: 'https://www.youtube.com/embed/2NOsE-VPpkE'
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
 * Find similar exercises to a given exercise
 * Returns exercises with similar muscle groups, equipment, and difficulty
 */
export function findSimilarExercises(exerciseId: string, limit: number = 5): Exercise[] {
  const exercise = getExerciseById(exerciseId)
  if (!exercise) return []

  // Score each exercise based on similarity
  const scoredExercises = EXERCISE_DATABASE.map(ex => {
    if (ex.id === exerciseId) return null // Exclude the original exercise

    let score = 0

    // Primary muscle groups match (high weight)
    const primaryMatches = exercise.muscleGroups.primary.filter(mg =>
      ex.muscleGroups.primary.includes(mg)
    ).length
    score += primaryMatches * 10

    // Secondary muscle groups match (medium weight)
    const secondaryMatches = exercise.muscleGroups.secondary.filter(mg =>
      ex.muscleGroups.secondary.includes(mg)
    ).length
    score += secondaryMatches * 5

    // Cross-match (primary matches secondary or vice versa)
    const crossMatches = exercise.muscleGroups.primary.filter(mg =>
      ex.muscleGroups.secondary.includes(mg)
    ).length + exercise.muscleGroups.secondary.filter(mg =>
      ex.muscleGroups.primary.includes(mg)
    ).length
    score += crossMatches * 3

    // Same category
    if (ex.category === exercise.category) {
      score += 5
    }

    // Same difficulty
    if (ex.difficulty === exercise.difficulty) {
      score += 3
    }

    // Equipment overlap
    const equipmentOverlap = exercise.equipment.filter(eq =>
      ex.equipment.includes(eq)
    ).length
    score += equipmentOverlap * 2

    // Prefer same equipment type if available
    if (equipmentOverlap > 0) {
      score += 5
    }

    return { exercise: ex, score }
  }).filter((item): item is { exercise: Exercise; score: number } => item !== null)

  // Sort by score descending and return top results
  return scoredExercises
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.exercise)
}

