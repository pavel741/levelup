/**
 * Secure API Client Utilities
 * Helps client-side code send authenticated requests
 */

/**
 * Get Firebase ID token for authenticated requests
 * This should be called from client-side code
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const { auth } = await import('@/lib/firebase')
    if (!auth) {
      return null
    }

    const { onAuthStateChanged } = await import('firebase/auth')
    
    // Get current user - wait for auth state to be determined
    return new Promise<string | null>((resolve) => {
      let resolved = false
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (resolved) return
          resolved = true
          unsubscribe()
          
          if (!user) {
            resolve(null)
            return
          }
          
          try {
            const token = await user.getIdToken()
            resolve(token)
          } catch (error) {
            console.error('Failed to get ID token:', error)
            resolve(null)
          }
        },
        (error) => {
          if (resolved) return
          resolved = true
          unsubscribe()
          console.error('Auth state error:', error)
          resolve(null)
        }
      )
      
      // Timeout after 2 seconds if auth state doesn't resolve
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          unsubscribe()
          resolve(null)
        }
      }, 2000)
    })
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

/**
 * Create authenticated fetch options
 */
export async function getAuthenticatedFetchOptions(
  options?: RequestInit
): Promise<RequestInit> {
  const token = await getAuthToken()
  
  const headers = new Headers(options?.headers)
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return {
    ...options,
    headers,
  }
}

/**
 * Authenticated fetch wrapper
 * Automatically includes auth token in requests
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const authOptions = await getAuthenticatedFetchOptions(options)
  return fetch(url, authOptions)
}

