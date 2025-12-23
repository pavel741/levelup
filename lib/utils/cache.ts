/**
 * Client-Side Cache Utility
 * Provides React Query-like caching with stale-while-revalidate pattern
 * No external dependencies - works with existing Zustand stores
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  refetchPromise?: Promise<T>
}

interface CacheOptions {
  staleTime?: number // Time before data is considered stale (default: 5 minutes)
  cacheTime?: number // Time before cache entry is removed (default: 30 minutes)
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    // Clean up expired entries periodically
    this.startCleanup()
  }

  /**
   * Get cached data or fetch if not cached/stale
   * Implements stale-while-revalidate pattern
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const opts = { ...this.options, ...options }
    const entry = this.cache.get(key)
    const now = Date.now()

    // If cache exists and not expired
    if (entry && now < entry.expiresAt) {
      // If stale, refetch in background but return cached data
      if (now >= entry.timestamp + opts.staleTime) {
        this.refetchInBackground(key, fetchFn, opts)
      }
      return entry.data
    }

    // Cache miss or expired - fetch fresh data
    return this.fetchAndCache(key, fetchFn, opts)
  }

  /**
   * Fetch and cache data
   */
  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: Required<CacheOptions>
  ): Promise<T> {
    // Check if there's already a refetch in progress
    const existing = this.cache.get(key)
    if (existing?.refetchPromise) {
      return existing.refetchPromise
    }

    const fetchPromise = fetchFn()
    
    // Store promise to prevent duplicate fetches
    this.cache.set(key, {
      data: existing?.data || null,
      timestamp: existing?.timestamp || 0,
      expiresAt: existing?.expiresAt || 0,
      refetchPromise: fetchPromise,
    })

    try {
      const data = await fetchPromise
      const now = Date.now()
      
      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + options.cacheTime,
      })
      
      return data
    } catch (error) {
      // Remove failed fetch promise
      const current = this.cache.get(key)
      if (current) {
        delete current.refetchPromise
      }
      throw error
    }
  }

  /**
   * Refetch data in background (stale-while-revalidate)
   */
  private async refetchInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: Required<CacheOptions>
  ): Promise<void> {
    // Prevent duplicate refetches
    const existing = this.cache.get(key)
    if (existing?.refetchPromise) {
      return
    }

    try {
      // Fetch and cache in background - data already cached by fetchAndCache
      await this.fetchAndCache(key, fetchFn, options)
    } catch (error) {
      // Silently fail background refetch - keep stale data
      console.warn(`Background refetch failed for ${key}:`, error)
    }
  }

  /**
   * Set cache entry manually
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const opts = { ...this.options, ...options }
    const now = Date.now()
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + opts.cacheTime,
    })
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache entry without fetching
   */
  getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data as T
    }
    return null
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry !== undefined && Date.now() < entry.expiresAt
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      const entries = Array.from(this.cache.entries())
      for (const [key, entry] of entries) {
        if (now >= entry.expiresAt) {
          this.cache.delete(key)
        }
      }
    }, 5 * 60 * 1000) // Clean up every 5 minutes
  }
}

// Global cache instance
export const cache = new CacheManager()

/**
 * Create a cache key from parts
 */
export function createCacheKey(...parts: (string | number | null | undefined)[]): string {
  return parts.filter(Boolean).join(':')
}

/**
 * Cache wrapper for API functions
 * Provides stale-while-revalidate pattern
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  options?: CacheOptions
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args)
    return cache.get(key, () => fn(...args), options)
  }) as T
}

