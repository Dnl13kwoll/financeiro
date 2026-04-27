import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-100 px-4 md:px-6 flex items-center justify-between shrink-0">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
