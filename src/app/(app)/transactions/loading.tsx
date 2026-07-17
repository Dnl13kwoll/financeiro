export default function Loading() {
  return (
    <div className="flex flex-col flex-1 animate-pulse">
      <div className="border-b border-gray-100 p-4 md:p-6 flex items-center justify-between">
        <div className="h-6 w-28 bg-gray-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-100 rounded-lg" />
          <div className="h-8 w-24 bg-gray-100 rounded-lg" />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Filters bar */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-100 rounded-lg" />
          ))}
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-white rounded-xl border border-gray-100 shadow-sm" />
          <div className="h-16 bg-white rounded-xl border border-gray-100 shadow-sm" />
          <div className="h-16 bg-white rounded-xl border border-gray-100 shadow-sm" />
        </div>

        {/* Transaction rows */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
