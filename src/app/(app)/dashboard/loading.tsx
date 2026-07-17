export default function Loading() {
  return (
    <div className="flex flex-col flex-1 animate-pulse">
      <div className="border-b border-gray-100 p-4 md:p-6 flex items-center justify-between">
        <div className="h-6 w-28 bg-gray-200 rounded-lg" />
        <div className="h-8 w-20 bg-gray-100 rounded-lg" />
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-7 w-28 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="flex items-end gap-3 h-36">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end" style={{ height: '100px' }}>
                  <div className="flex-1 bg-green-100 rounded-t-sm" style={{ height: `${35 + i * 8}%` }} />
                  <div className="flex-1 bg-red-100 rounded-t-sm" style={{ height: `${25 + i * 10}%` }} />
                </div>
                <div className="h-3 w-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="h-4 w-36 bg-gray-200 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
