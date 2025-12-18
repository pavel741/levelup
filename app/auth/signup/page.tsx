'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signInWithGoogle, handleGoogleRedirect } from '@/lib/auth'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  const router = useRouter()
  const { setUser } = useFirestoreStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle Google redirect callback
  useEffect(() => {
    let mounted = true
    let redirectHandled = false
    
    const handleRedirect = async () => {
      // Only handle redirect once
      if (redirectHandled) return
      
      try {
        console.log('🔵 Signup page: Checking for Google redirect...')
        const user = await handleGoogleRedirect()
        
        if (mounted && user) {
          redirectHandled = true
          console.log('✅ Signup page: Google redirect successful, user:', user.id)
          setUser(user)
          // Small delay to ensure state is set
          setTimeout(() => {
            router.push('/')
          }, 100)
        } else if (mounted) {
          console.log('ℹ️ Signup page: No redirect result (user may not have been redirected yet)')
          // Check if there's an error in the URL params
          const urlParams = new URLSearchParams(window.location.search)
          const error = urlParams.get('error')
          const errorDescription = urlParams.get('error_description')
          if (error) {
            const errorMsg = errorDescription || error || 'Google sign-in failed'
            console.error('❌ Signup page: Error in URL params:', error, errorDescription)
            setError(`Google sign-in failed: ${errorMsg}. Please try again.`)
            // Store error for ErrorDisplay component
            try {
              localStorage.setItem('firebase_error', JSON.stringify({
                code: error,
                message: errorDescription || error,
                timestamp: new Date().toISOString(),
                source: 'google_signup_redirect',
              }))
            } catch (e) {}
          }
        }
      } catch (err: any) {
        console.error('❌ Signup page: Google redirect error:', err)
        console.error('Error code:', err.code)
        console.error('Error message:', err.message)
        console.error('Full error:', JSON.stringify(err, null, 2))
        
        // Store error for ErrorDisplay component
        try {
          localStorage.setItem('firebase_error', JSON.stringify({
            code: err.code || 'unknown',
            message: err.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            source: 'google_signup_redirect',
            fullError: err,
          }))
        } catch (e) {}
        
        if (mounted) {
          const errorMessage = err.message || 'Failed to sign in with Google'
          setError(errorMessage)
        }
      }
    }
    
    // Small delay to ensure Firebase is initialized
    const timeoutId = setTimeout(() => {
      handleRedirect()
    }, 100)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [setUser, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const user = await signUp(email, password, name)
      if (user) {
        setUser(user)
        router.push('/')
      }
    } catch (err: any) {
      console.error('Sign up error:', err)
      const errorMessage = err.message || 'Failed to create account'
      setError(errorMessage)
      // If email already in use, provide helpful guidance
      if (err.message?.includes('already registered') || err.code === 'auth/email-already-in-use') {
        if (err.message?.includes('Google') || err.message?.includes('sign up with Google')) {
          setError(`${errorMessage} Use the "Sign up with Google" button above.`)
        } else {
          setError(`${errorMessage} Click "Sign in" below to access your account.`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      // Wait for Firebase to initialize and add a delay for better UX
      const { waitForFirebaseInit } = await import('@/lib/firebase')
      await waitForFirebaseInit()
      
      // Add a 1 second delay before redirecting to Google
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // This will redirect to Google, so the function won't complete here
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            LevelUp
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Level Up Life</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm block">{error}</span>
                  {error.includes('already registered') && (
                    <Link 
                      href="/auth/login" 
                      className="text-sm underline mt-1 inline-block font-medium hover:text-red-800 dark:hover:text-red-300"
                    >
                      Go to Sign In →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-4 w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign up with Google
                    </>
                  )}
                </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

