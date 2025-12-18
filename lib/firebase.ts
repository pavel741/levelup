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
const validateFirebaseConfig = (): { valid: boolean; missing: string[] } => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missing.join(', '))
    console.error('❌ Please add these environment variables to your Vercel project settings')
    return { valid: false, missing }
  }
  
  return { valid: true, missing: [] }
}

// Initialize Firebase only in browser
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let analytics: Analytics | null = null

if (typeof window !== 'undefined') {
  // Validate config before initializing
  const validation = validateFirebaseConfig()
  if (!validation.valid) {
    const errorMessage = `Firebase configuration is incomplete. Missing: ${validation.missing.join(', ')}. Please add these environment variables to your Vercel project settings.`
    console.error('❌', errorMessage)
    // Store error for ErrorDisplay component
    try {
      localStorage.setItem('firebase_error', JSON.stringify({
        code: 'firebase_config_missing',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        source: 'firebase_init',
        missing: validation.missing,
      }))
    } catch (e) {
      console.error('Failed to store error:', e)
    }
  } else {
    try {
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
      
      // Suppress firebase-init.json 404 errors (harmless - Firebase SDK tries to fetch this but it's not required)
      // Do this after initialization to avoid interfering with the init process
      const originalFetch = window.fetch
      let firebaseInitWarningShown = false
      
      window.fetch = function(...args) {
        const url = args[0]?.toString() || ''
        // Suppress firebase-init.json 404 errors
        if (url.includes('firebase-init.json')) {
          if (!firebaseInitWarningShown) {
            console.info('ℹ️ Note: firebase-init.json 404 errors are harmless and can be ignored')
            firebaseInitWarningShown = true
          }
          // Return a rejected promise to suppress the error
          return Promise.reject(new Error('firebase-init.json not found (this is normal)'))
        }
        return originalFetch.apply(this, args)
      }
      
      // Restore original fetch after a delay
      setTimeout(() => {
        window.fetch = originalFetch
      }, 5000)
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

