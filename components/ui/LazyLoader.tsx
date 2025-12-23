/**
 * Lazy Loader Component
 * Wrapper for lazy-loaded components with loading state
 */

import { Suspense, ComponentType, ReactNode } from 'react'
import { Skeleton, CardSkeleton } from './Skeleton'

interface LazyLoaderProps {
  children?: ReactNode
  fallback?: ReactNode
  variant?: 'default' | 'card' | 'list' | 'grid'
}

export function LazyLoader({ children, fallback, variant = 'default' }: LazyLoaderProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <Skeleton variant="text" className="w-full h-32" />
    </div>
  )

  const variantFallbacks = {
    default: defaultFallback,
    card: <CardSkeleton />,
    list: <div className="space-y-2"><Skeleton variant="text" className="w-full h-16" /></div>,
    grid: <div className="grid grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>,
  }

  const loadingFallback = fallback || variantFallbacks[variant]

  if (!children) {
    return <>{loadingFallback}</>
  }

  return (
    <Suspense fallback={loadingFallback}>
      {children}
    </Suspense>
  )
}

/**
 * Create a lazy-loaded component with loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  return function LazyComponentWithFallback(props: React.ComponentProps<T>) {
    return (
      <LazyLoader fallback={fallback}>
        <LazyComponent {...props} />
      </LazyLoader>
    )
  }
}

import { lazy } from 'react'

// Re-export lazy for convenience
export { lazy }

