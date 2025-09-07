import { cn } from "@/lib/utils"

/**
 * Skeleton component for loading states
 * Provides animated placeholder content while data is loading
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-800/50", className)}
      {...props}
    />
  )
}

/**
 * Card skeleton for asset/vault cards
 */
function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

/**
 * Table row skeleton for data tables
 */
function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-700">
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-20" />
      </td>
    </tr>
  )
}

/**
 * Stats card skeleton for dashboard metrics
 */
function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="mt-4 flex items-center space-x-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

/**
 * Asset grid skeleton for marketplace
 */
function AssetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Page header skeleton
 */
function PageHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  AssetGridSkeleton,
  PageHeaderSkeleton,
}