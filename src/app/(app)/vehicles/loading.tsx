import { Skeleton } from '@/components/ui/skeleton'

export default function VehiclesLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-40" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-7 w-7 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
