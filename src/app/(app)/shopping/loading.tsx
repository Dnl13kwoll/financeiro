import { Skeleton } from '@/components/ui/skeleton'

export default function ShoppingLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-40" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="flex items-center gap-3 py-1 border-t border-gray-50">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
