import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-48 w-48 rounded-full mx-auto" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <SkeletonTable rows={6} />
            <SkeletonTable rows={4} />
          </div>
        </div>
      </div>
    </div>
  )
}
