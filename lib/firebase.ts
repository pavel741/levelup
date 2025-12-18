import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth'
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

// Debug: Log what we have (only in development or if explicitly enabled)
if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || window.location.search.includes('debug=firebase'))) {
  console.log('🔍 Firebase Config Debug:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId,
    apiKeyLength: firebaseConfig.apiKey?.length || 0,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  })
}

// Validate Firebase configuration
// Check the actual config values, not process.env (since values are baked in at build time)
const validateFirebaseConfig = (): { valid: boolean; missing: string[] } => {
  const checks = [
    { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: firebaseConfig.apiKey },
    { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: firebaseConfig.authDomain },
    { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId },
    { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: firebaseConfig.appId },
  ]
  
  const missing = checks.filter(check => !check.value).map(check => check.key)
  
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
let firebaseInitialized = false
let firebaseInitPromise: Promise<void> | null = null

if (typeof window !== 'undefined') {
  // Validate config before initializing
  const validation = validateFirebaseConfig()
  if (!validation.valid) {
    const errorMessage = `Firebase configuration is incomplete. Missing: ${validation.missing.join(', ')}. 

⚠️ IMPORTANT: Environment variables are baked into the build at BUILD TIME.
If you just added these variables to Vercel, you MUST redeploy for them to take effect.

Steps:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click ⋯ on latest deployment → Redeploy
3. Or push a new commit to trigger a new build

The variables must be present BEFORE the build runs.`
    console.error('❌', errorMessage)
    // Store error for ErrorDisplay component
    try {
      localStorage.setItem('firebase_error', JSON.stringify({
        code: 'firebase_config_missing',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        source: 'firebase_init',
        missing: validation.missing,
        requiresRedeploy: true,
      }))
    } catch (e) {
      console.error('Failed to store error:', e)
    }
  } else {
    // Create initialization promise to avoid race conditions
    firebaseInitPromise = (async () => {
      try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
        auth = getAuth(app)
        
        // Explicitly set persistence to local storage (persists across browser sessions)
        // This ensures users stay logged in after page refresh
        try {
          await setPersistence(auth, browserLocalPersistence)
          console.log('✅ Auth persistence set to local storage')
        } catch (persistenceError) {
          console.warn('⚠️ Could not set auth persistence (may already be set):', persistenceError)
        }
        
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
        
        firebaseInitialized = true
        
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
        throw error
      }
    })()
    
    // Start initialization immediately
    firebaseInitPromise.catch(() => {
      // Error already logged above
    })
  }
}

// Helper function to wait for Firebase initialization
export const waitForFirebaseInit = async (): Promise<void> => {
  if (firebaseInitialized) return
  if (firebaseInitPromise) {
    await firebaseInitPromise
  } else if (typeof window !== 'undefined') {
    // If promise doesn't exist, wait a bit and check again
    await new Promise(resolve => setTimeout(resolve, 100))
    if (!firebaseInitialized && !firebaseInitPromise) {
      throw new Error('Firebase initialization failed or was not started')
    }
    if (firebaseInitPromise) {
      await firebaseInitPromise
    }
  }
}

// Export with type assertions - these will only be used client-side
export { auth, db, analytics }
export default app!

