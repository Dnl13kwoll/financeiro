import { Skeleton } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-7 w-7 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
