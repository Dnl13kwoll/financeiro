import { Skeleton } from '@/components/ui/skeleton'

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Despesas', 'Receitas'].map(type => (
            <div key={type} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <Skeleton className="h-5 w-28" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
