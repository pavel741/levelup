import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missing.join(', '))
    return false
  }
  
  return true
}

// Initialize Firebase only in browser
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let analytics: Analytics | null = null

if (typeof window !== 'undefined') {
  // Validate config before initializing
  if (!validateFirebaseConfig()) {
    console.error('❌ Firebase configuration is incomplete. Please check your environment variables.')
    // Store error for ErrorDisplay component
    try {
      localStorage.setItem('firebase_error', JSON.stringify({
        code: 'firebase_config_missing',
        message: 'Firebase configuration is incomplete. Please check your environment variables.',
        timestamp: new Date().toISOString(),
        source: 'firebase_init',
      }))
    } catch (e) {}
  } else {
    try {
      // Suppress console errors for firebase-init.json (harmless - Firebase SDK tries to fetch this but it's not required)
      const originalError = console.error
      const suppressedErrors: string[] = []
      
      console.error = function(...args: any[]) {
        const errorStr = args.join(' ')
        // Suppress firebase-init.json errors (these are harmless)
        if (errorStr.includes('firebase-init.json') || errorStr.includes('404') && errorStr.includes('firebase')) {
          suppressedErrors.push(errorStr)
          // Only log once to avoid spam
          if (suppressedErrors.length === 1) {
            console.info('ℹ️ Note: firebase-init.json 404 errors are harmless and can be ignored')
          }
          return
        }
        originalError.apply(console, args)
      }
      
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
      auth = getAuth(app)
      db = getFirestore(app)
      
      console.log('✅ Firebase initialized successfully')
      console.log('Project ID:', firebaseConfig.projectId)
      console.log('Auth Domain:', firebaseConfig.authDomain)
      
      // Initialize Analytics only in browser and if measurementId is provided
      if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
        try {
          analytics = getAnalytics(app)
          console.log('✅ Firebase Analytics initialized')
        } catch (error) {
          console.warn('⚠️ Firebase Analytics initialization failed:', error)
        }
      }
      
      // Restore original console.error after initialization
      setTimeout(() => {
        console.error = originalError
      }, 2000)
    } catch (error: any) {
      console.error('❌ Firebase initialization failed:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // Store error for ErrorDisplay component
      try {
        localStorage.setItem('firebase_error', JSON.stringify({
          code: error.code || 'firebase_init_failed',
          message: error.message || 'Failed to initialize Firebase',
          timestamp: new Date().toISOString(),
          source: 'firebase_init',
          fullError: error,
        }))
      } catch (e) {
        console.error('Failed to store error in localStorage:', e)
      }
    }
  }
}

// Export with type assertions - these will only be used client-side
export { auth, db, analytics }
export default app!

