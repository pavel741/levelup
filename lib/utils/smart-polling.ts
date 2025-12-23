/**
 * Smart Polling Utility
 * Adjusts polling frequency based on user activity and page visibility
 * Only triggers callbacks when data actually changes
 */

export interface SmartPollOptions {
  activeInterval?: number // When user is actively using the app (default: 30s)
  idleInterval?: number // When user is idle but tab is visible (default: 2min)
  hiddenInterval?: number // When tab is hidden (default: 5min)
  idleThreshold?: number // Time before considered idle (default: 60s)
  hashFn?: (data: any) => string // Function to hash data for change detection
  initialData?: any // Initial data to compare against
}

interface RequiredSmartPollOptions {
  activeInterval: number
  idleInterval: number
  hiddenInterval: number
  idleThreshold: number
  hashFn?: (data: any) => string
  initialData?: any
}

const DEFAULT_OPTIONS: RequiredSmartPollOptions = {
  activeInterval: 30000, // 30 seconds
  idleInterval: 120000, // 2 minutes
  hiddenInterval: 300000, // 5 minutes
  idleThreshold: 60000, // 1 minute
}

/**
 * Create a smart polling function that adjusts frequency based on user activity
 * Only triggers callbacks when data actually changes (if hashFn provided)
 */
export function createSmartPoll<T>(
  fetchFn: () => Promise<T>,
  callback: (data: T) => void,
  options: SmartPollOptions = {}
): () => void {
  const opts: RequiredSmartPollOptions = { ...DEFAULT_OPTIONS, ...options }
  let intervalId: NodeJS.Timeout | null = null
  let lastActivity = Date.now()
  let isActive = true
  let lastDataHash: string | null = null
  let isFirstFetch = true

  // Initialize hash if initial data provided
  if (opts.initialData !== undefined && opts.hashFn) {
    lastDataHash = opts.hashFn(opts.initialData)
  }

  const getInterval = (): number => {
    if (!isActive) return opts.hiddenInterval
    
    if (typeof document !== 'undefined' && document.hidden) {
      return opts.hiddenInterval
    }
    
    if (Date.now() - lastActivity > opts.idleThreshold) {
      return opts.idleInterval
    }
    
    return opts.activeInterval
  }

  const poll = async () => {
    if (!isActive) return
    
    try {
      const data = await fetchFn()
      
      // Only call callback if data changed (or first fetch)
      if (opts.hashFn) {
        const newHash = opts.hashFn(data)
        if (isFirstFetch || newHash !== lastDataHash) {
          isFirstFetch = false
          lastDataHash = newHash
          callback(data)
        }
      } else {
        // No hash function - always call callback
        callback(data)
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
    
    // Adjust interval based on current state
    const newInterval = getInterval()
    if (intervalId) {
      clearTimeout(intervalId)
    }
    intervalId = setTimeout(poll, newInterval)
  }

  // Track user activity
  if (typeof document !== 'undefined') {
    const events: (keyof DocumentEventMap)[] = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const updateActivity = () => {
      lastActivity = Date.now()
    }
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - use longer interval
        if (intervalId) {
          clearInterval(intervalId)
        }
        intervalId = setTimeout(poll, opts.hiddenInterval)
      } else {
        // Tab visible - resume normal polling
        if (intervalId) {
          clearInterval(intervalId)
        }
        lastActivity = Date.now() // Reset activity on visibility
        intervalId = setTimeout(poll, getInterval())
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Initial poll
    poll()
    
    // Cleanup function
    return () => {
      isActive = false
      if (intervalId) {
        clearTimeout(intervalId)
      }
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  } else {
    // Server-side: just poll at active interval
    poll()
    return () => {
      isActive = false
      if (intervalId) {
        clearTimeout(intervalId)
      }
    }
  }
}

