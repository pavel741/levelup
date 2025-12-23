/**
 * Skeleton Loader Components
 * Provides loading placeholders for better UX
 */

/**
 * Simple className utility
 */
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  const animateClasses = animate ? 'animate-pulse' : ''
  
  const variantClasses = {
    default: 'rounded',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(baseClasses, animateClasses, variantClasses[variant], className)}
      style={style}
    />
  )
}

/**
 * Card Skeleton - for card-like components
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      <Skeleton variant="text" className="w-1/3 h-4 mb-4" />
      <Skeleton variant="text" className="w-1/2 h-8 mb-2" />
      <Skeleton variant="text" className="w-2/3 h-4" />
    </div>
  )
}

/**
 * Table Skeleton - for table/list components
 */
export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/3 h-4" />
            <Skeleton variant="text" className="w-1/4 h-3" />
          </div>
          <Skeleton variant="text" className="w-20 h-4" />
        </div>
      ))}
    </div>
  )
}

/**
 * List Skeleton - for simple lists
 */
export function ListSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" className="flex-1 h-4" />
        </div>
      ))}
    </div>
  )
}

/**
 * Grid Skeleton - for grid layouts
 */
export function GridSkeleton({
  columns = 3,
  rows = 2,
  className,
}: {
  columns?: number
  rows?: number
  className?: string
}) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Transaction List Skeleton - specific to finance transactions
 */
export function TransactionListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-1/3 h-4" />
              <Skeleton variant="text" className="w-1/4 h-3" />
            </div>
            <Skeleton variant="text" className="w-24 h-6" />
          </div>
        </div>
      ))}
    </div>
  )
}

