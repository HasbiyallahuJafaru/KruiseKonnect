import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-navy/6',
        className
      )}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-navy/8 bg-white shadow-card p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-1/4 mt-4" />
    </div>
  )
}
