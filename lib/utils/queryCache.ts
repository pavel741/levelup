/**
 * Server-Side Query Result Cache
 * Caches MongoDB query results in memory to avoid repeated database hits
 * Automatically invalidates on mutations
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = { ttl: options.ttl || DEFAULT_TTL }
    this.startCleanup()
  }

  /**
   * Get cached data or execute query and cache result
   */
  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const ttl = options.ttl || this.options.ttl
    const entry = this.cache.get(key)
    const now = Date.now()

    // Return cached data if valid
    if (entry && now < entry.expiresAt) {
      return entry.data as T
    }

    // Execute query and cache result
    const data = await queryFn()
    this.set(key, data, { ttl })
    return data
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.options.ttl
    const now = Date.now()
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all entries matching a pattern
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
   * Invalidate all cache entries for a user
   */
  invalidateUser(userId: string): void {
    this.invalidatePattern(new RegExp(`^.*:${userId}(:.*)?$`))
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
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
    }, 60 * 1000) // Clean up every minute
  }
}

// Global cache instance
export const queryCache = new QueryCache()

/**
 * Create a cache key from parts
 */
export function createQueryCacheKey(...parts: (string | number | null | undefined)[]): string {
  return parts.filter(Boolean).join(':')
}

/**
 * Cache wrapper for query functions
 */
export function withQueryCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  options?: CacheOptions
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args)
    return queryCache.get(key, () => fn(...args), options)
  }) as T
}

