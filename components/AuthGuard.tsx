'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { onAuthChange, getCurrentUser } from '@/lib/auth'
import { getUserData } from '@/lib/firestore'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, setUser, syncUser } = useFirestoreStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Note: We can't check process.env at runtime for NEXT_PUBLIC_* vars
    // They're baked in at build time. If they're missing, Firebase init will fail
    // and we'll handle it there.

    // Check for URL error parameters (from Google OAuth redirect)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')
      if (error) {
        console.error('❌ AuthGuard: Error in URL params:', error, errorDescription)
        // Store error for ErrorDisplay component
        try {
          localStorage.setItem('firebase_error', JSON.stringify({
            code: error,
            message: errorDescription || error,
            timestamp: new Date().toISOString(),
            source: 'google_oauth_redirect_url',
            url: window.location.href,
          }))
        } catch (e) {
          console.error('Failed to store error in localStorage:', e)
        }
      }
    }

    // Don't check auth on auth pages - let them handle redirects
    if (pathname?.startsWith('/auth')) {
      setChecking(false)
      // Still set up auth listener for redirect handling
      const unsubscribe = onAuthChange(async (firebaseUser) => {
        if (firebaseUser && pathname?.startsWith('/auth')) {
          console.log('🔵 AuthGuard: User authenticated on auth page:', firebaseUser.uid)
          // User authenticated via redirect, ensure Firestore document exists
          let userData = await getUserData(firebaseUser.uid)
          
          // If user doesn't exist in Firestore, create it (backup in case handleGoogleRedirect failed)
          if (!userData) {
            console.log('AuthGuard: Creating missing Firestore document for authenticated user')
            const { createUserData } = await import('@/lib/firestore')
            userData = {
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
              await createUserData(userData)
              console.log('✅ AuthGuard: Created missing Firestore document:', userData.id)
            } catch (error: any) {
              console.error('❌ AuthGuard: Failed to create Firestore document:', error)
              // Store error
              try {
                localStorage.setItem('firebase_error', JSON.stringify({
                  code: error.code || 'firestore_create_failed',
                  message: error.message || 'Failed to create user in Firestore',
                  timestamp: new Date().toISOString(),
                  source: 'authguard_firestore_create',
                  fullError: error,
                }))
              } catch (e) {}
            }
          }
          
          if (userData) {
            console.log('✅ AuthGuard: Setting user and syncing:', userData.id)
            setUser(userData)
            await syncUser(firebaseUser.uid)
            // Clear URL error params if present
            if (typeof window !== 'undefined' && window.location.search) {
              window.history.replaceState({}, '', window.location.pathname)
            }
          }
        }
      })
      return () => unsubscribe()
    }

    let authChecked = false
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      authChecked = true
      
      if (firebaseUser) {
        console.log('✅ AuthGuard: User authenticated:', firebaseUser.uid)
        let userData = await getUserData(firebaseUser.uid)
        
        // If user exists in Auth but not in Firestore, create Firestore document
        if (!userData) {
          console.log('User exists in Auth but not in Firestore, creating document')
          const { createUserData } = await import('@/lib/firestore')
          userData = {
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
          await createUserData(userData)
          console.log('Created missing Firestore document:', userData.id)
        }
        
        if (userData) {
          setUser(userData)
          await syncUser(firebaseUser.uid)
        }
      } else {
        // Only redirect to login if we're not already on an auth page
        if (!pathname?.startsWith('/auth')) {
          console.log('AuthGuard: No user found, redirecting to login')
          router.push('/auth/login')
        }
      }
      setChecking(false)
    })

    // Wait a bit for auth state to restore, then check if still no user
    // This gives Firebase time to restore the session from localStorage
    setTimeout(() => {
      if (!authChecked) {
        const currentUser = getCurrentUser()
        if (!currentUser && !pathname?.startsWith('/auth')) {
          console.log('AuthGuard: Timeout - no user found, redirecting to login')
          router.push('/auth/login')
          setChecking(false)
        } else if (currentUser) {
          // User found, but listener hasn't fired yet - load user data
          getUserData(currentUser.uid).then(async (userData) => {
            // If user exists in Auth but not in Firestore, create Firestore document
            if (!userData) {
              console.log('User exists in Auth but not in Firestore, creating document')
              const { createUserData } = await import('@/lib/firestore')
              userData = {
                id: currentUser.uid,
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                email: currentUser.email || '',
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                streak: 0,
                longestStreak: 0,
                achievements: [],
                joinedAt: new Date(),
              }
              await createUserData(userData)
              console.log('Created missing Firestore document:', userData.id)
            }
            
            if (userData) {
              setUser(userData)
              syncUser(currentUser.uid)
            }
            setChecking(false)
          })
        } else {
          setChecking(false)
        }
      }
    }, 1000) // Wait 1 second for auth state to restore

    return () => unsubscribe()
  }, [router, setUser, syncUser, pathname])

  if (checking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!pathname?.startsWith('/auth') && !user) {
    return null
  }

  return <>{children}</>
}

