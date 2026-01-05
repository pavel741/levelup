import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth'
import { auth } from './firebase'
import { getUserData, createUserData } from './firestore'
import { User } from '@/types'

export const getErrorMessage = (error: any): string => {
  const code = error?.code || ''
  
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.'
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.'
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.'
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.'
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.'
    default:
      return error?.message || 'An error occurred. Please try again.'
  }
}

/**
 * Initialize encryption key for a user (non-blocking)
 * This is called after user creation to set up client-side encryption
 * Only runs in the browser (client-side)
 */
async function initializeUserEncryption(userId: string): Promise<void> {
  // Only initialize encryption in the browser (client-side)
  if (typeof window === 'undefined') {
    return // Skip on server-side
  }
  
  try {
    // Direct import - webpack alias only affects server-side builds
    const encryptionModule = await import('@/lib/utils/encryption/keyManager')
    await encryptionModule.initializeUserEncryptionKey(userId)
    console.log('✅ Encryption key initialized for user:', userId)
  } catch (encryptionError: any) {
    // Silently fail - encryption is optional and shouldn't block user signup
    // The error might be due to SSR, missing browser APIs, or module not found during build
    if (typeof window !== 'undefined' && encryptionError?.code !== 'MODULE_NOT_FOUND') {
      console.warn('⚠️ Failed to initialize encryption key (non-critical):', encryptionError)
    }
  }
}

export const signUp = async (email: string, password: string, name: string): Promise<User | null> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized')
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    const user: User = {
      id: firebaseUser.uid,
      name,
      email: firebaseUser.email || email,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 0,
      longestStreak: 0,
      achievements: [],
      joinedAt: new Date(),
    }

    await createUserData(user)
    await initializeUserEncryption(user.id)
    return user
  } catch (error: any) {
    console.error('Error signing up:', error)
    
    // If email already in use, check if it's a Google account
    if (error.code === 'auth/email-already-in-use') {
      try {
        // Try to sign in with the provided credentials
        await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = auth.currentUser
        if (firebaseUser) {
          let user = await getUserData(firebaseUser.uid)
          
          // If user doesn't exist in Firestore, create it
          if (!user) {
            user = {
              id: firebaseUser.uid,
              name,
              email: firebaseUser.email || email,
              level: 1,
              xp: 0,
              xpToNextLevel: 100,
              streak: 0,
              longestStreak: 0,
              achievements: [],
              joinedAt: new Date(),
            }
            await createUserData(user)
            await initializeUserEncryption(user.id)
            return user
          }
          
          // User exists in both Auth and Firestore
          throw new Error('This email is already registered. Please sign in instead.')
        }
      } catch (signInError: any) {
        // If sign-in fails, it's likely a Google account (no password) or wrong password
        if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
          // Check if there's a current user (might be signed in via Google)
          const currentUser = auth.currentUser
          if (currentUser && currentUser.email === email) {
            // User is signed in via Google, create Firestore doc
            let user = await getUserData(currentUser.uid)
            if (!user) {
              user = {
                id: currentUser.uid,
                name: currentUser.displayName || name,
                email: currentUser.email || email,
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                streak: 0,
                longestStreak: 0,
                achievements: [],
                joinedAt: new Date(),
              }
              await createUserData(user)
              return user
            }
            return user
          }
          // Password is wrong or account was created with Google
          // Since sign-in with password failed, it's likely a Google account (no password)
          throw new Error('This email is already registered with Google. Please use "Sign in with Google" or "Sign up with Google" instead.')
        }
        // Other errors - re-throw original
        throw new Error(getErrorMessage(error))
      }
    }
    
    const friendlyError = new Error(getErrorMessage(error))
    throw friendlyError
  }
}

export const signIn = async (email: string, password: string): Promise<User | null> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized')
  }
  
  try {
    await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      let user = await getUserData(firebaseUser.uid)
      
      // If user exists in Auth but not in Firestore, create Firestore document
      if (!user) {
        user = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email || email,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          streak: 0,
          longestStreak: 0,
          achievements: [],
          joinedAt: new Date(),
        }
        await createUserData(user)
        await initializeUserEncryption(user.id)
      }
      
      return user
    }
    return null
  } catch (error: any) {
    console.error('Error signing in:', error)
    const friendlyError = new Error(getErrorMessage(error))
    throw friendlyError
  }
}

export const signInWithGoogle = async (): Promise<void> => {
  if (!auth) {
    const error = new Error('Firebase Auth is not initialized')
    console.error('❌ signInWithGoogle error:', error)
    throw error
  }
  
  try {
    
    const provider = new GoogleAuthProvider()
    // Add custom parameters to ensure redirect works
    provider.addScope('profile')
    provider.addScope('email')
    
    // Set the redirect URL explicitly if needed
    // Firebase will use the current page URL as the redirect target
    
    // Use redirect instead of popup to avoid COOP issues
    await signInWithRedirect(auth, provider)
    // Note: This will redirect the page, so the function won't return here
  } catch (error: any) {
    console.error('❌ Error initiating Google sign-in:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Full error:', JSON.stringify(error, null, 2))
    
    // Store error for ErrorDisplay component
    try {
      localStorage.setItem('firebase_error', JSON.stringify({
        code: error.code || 'unknown',
        message: error.message || 'Failed to initiate Google sign-in',
        timestamp: new Date().toISOString(),
        source: 'google_signin_init',
        fullError: error,
      }))
    } catch (e) {}
    
    throw error
  }
}

export const handleGoogleRedirect = async (): Promise<User | null> => {
  // Wait for Firebase to initialize if it hasn't yet
  try {
    const { waitForFirebaseInit } = await import('./firebase')
    await waitForFirebaseInit()
  } catch (error) {
    console.error('❌ Failed to wait for Firebase initialization:', error)
  }
  
  if (!auth) {
    const error = 'Firebase Auth is not initialized'
    console.error('❌', error)
    console.error('❌ Firebase config present but auth not initialized. This may be a timing issue.')
    // Store error
    try {
      localStorage.setItem('firebase_error', JSON.stringify({
        code: 'auth_not_initialized',
        message: error,
        timestamp: new Date().toISOString(),
        source: 'handleGoogleRedirect',
      }))
    } catch (e) {}
    return null
  }
  
  try {
    const result = await getRedirectResult(auth)
    
    if (!result) {
      // No redirect result - this is normal if user hasn't been redirected
      return null
    }

    const firebaseUser = result.user
    if (!firebaseUser) {
      const error = 'No user in redirect result'
      console.error('❌', error)
      // Store error
      try {
        localStorage.setItem('firebase_error', JSON.stringify({
          code: 'no_user_in_result',
          message: error,
          timestamp: new Date().toISOString(),
          source: 'handleGoogleRedirect',
        }))
      } catch (e) {}
      return null
    }

    
    // Check if user exists in Firestore
    let user = await getUserData(firebaseUser.uid)
    
    if (!user) {
      // Create new user if doesn't exist
      user = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        longestStreak: 0,
        achievements: [],
        joinedAt: new Date(),
      }
      
      try {
        await createUserData(user)
        await initializeUserEncryption(user.id)
      } catch (createError: any) {
        console.error('❌ Failed to create user data in Firestore:', createError)
        console.error('Create error code:', createError.code)
        console.error('Create error message:', createError.message)
        
        // Store error
        try {
          localStorage.setItem('firebase_error', JSON.stringify({
            code: createError.code || 'firestore_create_failed',
            message: createError.message || 'Failed to create user in Firestore',
            timestamp: new Date().toISOString(),
            source: 'handleGoogleRedirect_createUser',
            fullError: createError,
          }))
        } catch (e) {}
        
        // Still return the user object even if Firestore creation fails
        // The AuthGuard will try to create it again
      }
    } else {
    }

    return user
  } catch (error: any) {
    console.error('❌ Error handling Google redirect:', error)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    console.error('Error name:', error?.name)
    console.error('Full error object:', error)
    console.error('Full error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    // Store error for ErrorDisplay component
    try {
      localStorage.setItem('firebase_error', JSON.stringify({
        code: error?.code || 'unknown',
        message: error?.message || 'Unknown error',
        name: error?.name,
        timestamp: new Date().toISOString(),
        source: 'handleGoogleRedirect',
        fullError: error,
        stack: error?.stack,
      }))
    } catch (e) {
      console.error('Failed to store error in localStorage:', e)
    }
    
    // Re-throw the error so the UI can handle it
    throw new Error(getErrorMessage(error))
  }
}

export const logout = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized')
  }
  
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export const getCurrentUser = (): FirebaseUser | null => {
  if (!auth) {
    return null
  }
  return auth.currentUser
}

export const onAuthChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  if (!auth) {
    console.error('❌ Firebase Auth is not initialized. Please check your environment variables.')
    // Return a no-op unsubscribe function instead of throwing
    // This prevents crashes when Firebase isn't configured
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

