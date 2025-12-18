'use client'

import { useEffect, useState, useRef } from 'react'
import { AlertCircle, X } from 'lucide-react'

export default function ErrorDisplay() {
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const isHandlingError = useRef(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check for stored errors
    const checkStoredError = () => {
      try {
        const stored = localStorage.getItem('firebase_error')
        if (stored) {
          const errorData = JSON.parse(stored)
          setErrorDetails(errorData)
          const errorMsg = errorData.message || 'Unknown error'
          const errorCode = errorData.code || 'Unknown'
          setError(`Firebase Error (${errorCode}): ${errorMsg}`)
        }
      } catch (e) {
        // Ignore
      }
    }

    checkStoredError()
    
    // Check URL for error parameters (from Google OAuth redirect)
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')
      if (error) {
        const errorData = {
          code: error,
          message: errorDescription || error,
          timestamp: new Date().toISOString(),
          source: 'url_params',
        }
        try {
          setErrorDetails(errorData)
          setError(`Google Sign-In Error: ${errorDescription || error}`)
        } catch (e) {
          console.warn('Failed to set error state:', e)
        }
        // Store it
        try {
          localStorage.setItem('firebase_error', JSON.stringify(errorData))
        } catch (e) {
          console.warn('Failed to store error in localStorage:', e)
        }
      }
    } catch (e) {
      console.warn('Failed to check URL params:', e)
    }
    
    // Also listen for console errors (with guard to prevent infinite loops)
    const originalError = console.error
    console.error = (...args: any[]) => {
      originalError.apply(console, args)
      
      // Prevent infinite loops
      if (isHandlingError.current) return
      
      try {
        const errorStr = args.join(' ')
        if (errorStr.includes('Firebase') || errorStr.includes('Firestore') || errorStr.includes('permission') || errorStr.includes('auth/')) {
          isHandlingError.current = true
          setError(errorStr)
          // Reset flag after a short delay
          setTimeout(() => {
            isHandlingError.current = false
          }, 100)
        }
      } catch (e) {
        // If setting error fails, restore original and don't try again
        console.error = originalError
      }
    }

    return () => {
      console.error = originalError
    }
  }, [])

  if (!error) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Firebase Error</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">{error}</p>
          {errorDetails && (
            <details className="text-xs text-red-600 dark:text-red-400">
              <summary className="cursor-pointer mb-1">Show Details</summary>
              <pre className="bg-red-100 dark:bg-red-900/40 p-2 rounded mt-1 overflow-auto max-h-40">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              setError(null)
              setErrorDetails(null)
              localStorage.removeItem('firebase_error')
            }}
            className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
          >
            Dismiss
          </button>
        </div>
        <button
          onClick={() => {
            setError(null)
            setErrorDetails(null)
            localStorage.removeItem('firebase_error')
          }}
          className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

