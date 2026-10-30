import { cn } from '../../utils/format'

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

export function ProductCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden p-3">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2 px-1 pb-1 pt-4">
        <Skeleton className="h-3 w-1/3 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-5 w-1/2 rounded" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function ListingSkeleton({ rows = 3, className }) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-md" />
      ))}
    </div>
  )
}
