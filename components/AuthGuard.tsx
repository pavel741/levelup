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
    // Don't check auth on auth pages - let them handle redirects
    if (pathname?.startsWith('/auth')) {
      setChecking(false)
      // Still set up auth listener for redirect handling
      const unsubscribe = onAuthChange(async (firebaseUser) => {
        if (firebaseUser && pathname?.startsWith('/auth')) {
          // User authenticated via redirect, let the auth page handle it
          const userData = await getUserData(firebaseUser.uid)
          if (userData) {
            setUser(userData)
            await syncUser(firebaseUser.uid)
          }
        }
      })
      return () => unsubscribe()
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
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
        router.push('/auth/login')
      }
      setChecking(false)
    })

    // Check current user immediately
    const currentUser = getCurrentUser()
    if (!currentUser && !pathname?.startsWith('/auth')) {
      router.push('/auth/login')
      setChecking(false)
    } else if (currentUser) {
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
    }

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

