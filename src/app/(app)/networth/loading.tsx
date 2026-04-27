import { Skeleton, SkeletonSummaryCards, SkeletonCard } from '@/components/ui/skeleton'

export default function NetworthLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <SkeletonSummaryCards count={3} />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    </div>
  )
}
