import { Skeleton } from '@/components/ui/skeleton'

export default function AgendaLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100 p-2">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-4 mx-auto w-6" />)}
          </div>
          <div className="grid grid-cols-7">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="min-h-[80px] p-2 border-b border-r border-gray-50 space-y-1">
                <Skeleton className="w-6 h-6 rounded-full" />
                {i % 4 === 0 && <Skeleton className="h-4 rounded w-full" />}
                {i % 7 === 2 && <Skeleton className="h-4 rounded w-3/4" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
