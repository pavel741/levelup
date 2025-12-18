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
    console.log('Created new user:', user.id)
    return user
  } catch (error: any) {
    console.error('Error signing up:', error)
    
    // If email already in use, check if it's a Google account
    if (error.code === 'auth/email-already-in-use') {
      console.log('Email already in use, checking if it\'s a Google account')
      try {
        // Try to sign in with the provided credentials
        await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = auth.currentUser
        if (firebaseUser) {
          let user = await getUserData(firebaseUser.uid)
          
          // If user doesn't exist in Firestore, create it
          if (!user) {
            console.log('Creating missing Firestore document for existing Auth user')
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
            console.log('Created missing Firestore document:', user.id)
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
              console.log('Creating missing Firestore document for Google-authenticated user')
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
        console.log('User exists in Auth but not in Firestore, creating Firestore document')
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
        console.log('Created missing Firestore document for user:', user.id)
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
    console.error('Firebase Auth is not initialized')
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
      console.error('No user in redirect result')
      return null
    }

    console.log('Google redirect successful, user:', firebaseUser.uid)
    
    let user = await getUserData(firebaseUser.uid)
    
    if (!user) {
      // Create new user if doesn't exist
      console.log('Creating new user from Google sign-in')
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
      console.log('New user created:', user.id)
    } else {
      console.log('Existing user found:', user.id)
    }

    return user
  } catch (error: any) {
    console.error('Error handling Google redirect:', error)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
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
    throw new Error('Firebase Auth is not initialized')
  }
  return onAuthStateChanged(auth, callback)
}

