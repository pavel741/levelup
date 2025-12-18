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
    return user
  } catch (error: any) {
    console.error('Error signing up:', error)
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
      return await getUserData(firebaseUser.uid)
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
    throw new Error('Firebase Auth is not initialized')
  }
  
  try {
    const provider = new GoogleAuthProvider()
    // Use redirect instead of popup to avoid COOP issues
    await signInWithRedirect(auth, provider)
    // Note: This will redirect the page, so the function won't return here
  } catch (error: any) {
    console.error('Error initiating Google sign-in:', error)
    throw error
  }
}

export const handleGoogleRedirect = async (): Promise<User | null> => {
  if (!auth) {
    return null
  }
  
  try {
    const result = await getRedirectResult(auth)
    if (!result) {
      return null
    }

    const firebaseUser = result.user
    let user = await getUserData(firebaseUser.uid)
    
    if (!user) {
      // Create new user if doesn't exist
      user = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        longestStreak: 0,
        achievements: [],
        joinedAt: new Date(),
      }
      await createUserData(user)
    }

    return user
  } catch (error: any) {
    console.error('Error handling Google redirect:', error)
    return null
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
    throw new Error('Firebase Auth is not initialized')
  }
  return onAuthStateChanged(auth, callback)
}

